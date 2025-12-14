
import { GoogleGenAI, Type } from "@google/genai";

// Declaration to satisfy TypeScript if @types/node is missing
declare var process: {
  env: {
    API_KEY: string;
  };
};

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY || ''; 
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// --- Improved Arabic Text Normalization ---
const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    // Normalize Alef forms
    .replace(/[أإآ]/g, 'ا')
    // Normalize Ta Marbuta and Ha to the SAME character (h)
    .replace(/[ةه]/g, 'ه')
    // Normalize Ya and Alif Maqsura
    .replace(/[ىي]/g, 'ي')
    // Remove Tashkeel (Diacritics)
    .replace(/[\u064B-\u065F]/g, '')
    // Remove Tatweel (Kashida)
    .replace(/\u0640/g, '')
    // Remove non-word characters (keep spaces)
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const findBestStudentMatch = (searchName: string, students: {id: string, name: string}[]): string | null => {
  if (!searchName) return null;

  // 1. Clean the search query (Remove titles like "Student", "Child")
  const stopWords = ['الطالب', 'طالب', 'الطفل', 'طفل', 'ابن', 'ابني', 'بنت', 'بنتي', 'الولد', 'ولد', 'student', 'child'];
  let cleanSearch = searchName;
  stopWords.forEach(word => {
    cleanSearch = cleanSearch.replace(new RegExp(word, 'gi'), '');
  });

  const normalizedSearch = normalizeArabic(cleanSearch);
  const searchParts = normalizedSearch.split(' ').filter(p => p.length > 1); // Filter out single letters

  if (searchParts.length === 0) return null;

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const student of students) {
    const normalizedStudentName = normalizeArabic(student.name);
    const studentParts = normalizedStudentName.split(' ');
    
    let matches = 0;
    
    // Check how many search tokens exist in the student name
    for (const searchPart of searchParts) {
      if (studentParts.some(sp => sp === searchPart || sp.startsWith(searchPart))) {
        matches++;
      }
    }

    // Calculate Score: 
    // Use the length of the *shorter* name to allow for:
    // 1. Nicknames/First Name only (Speech: "Hamza", Record: "Hamza Mohamed")
    // 2. Extra details in speech (Speech: "Hamza Mohamed Mahfouz", Record: "Hamza Mohamed")
    const minLen = Math.min(searchParts.length, studentParts.length);
    const score = minLen > 0 ? matches / minLen : 0;

    // Bonus for exact substring match (e.g. "Hamza Mohamed" inside "Hamza Mohamed Mahfouz")
    if (normalizedStudentName.includes(normalizedSearch) || normalizedSearch.includes(normalizedStudentName)) {
        // Boost significantly
        if (score >= 0.5) return student.id; 
    }

    if (score > highestScore && score >= 0.6) { // Lower threshold slightly to allow for partial mismatches
      highestScore = score;
      bestMatchId = student.id;
    }
  }

  return bestMatchId;
};

export const generateActivityPlan = async (ageGroup: string, topic: string) => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const prompt = `
      As an expert kindergarten educator, create a fun and interactive learning activity.
      Age Group: ${ageGroup}
      Topic: ${topic}
      
      The result must be in JSON format containing the following fields:
      - title: Activity Title
      - duration: Suggested Duration
      - materials: List of required materials (array)
      - steps: Execution steps (array)
      - learningOutcomes: What the child will learn (summary)
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningOutcomes: { type: Type.STRING },
          },
          required: ["title", "duration", "materials", "steps", "learningOutcomes"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

export const draftParentMessage = async (studentName: string, type: 'praise' | 'issue' | 'announcement', details: string) => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const prompt = `
      Write a short and polite message to the parent of student: ${studentName}.
      Message Type: ${type === 'praise' ? 'Praise' : type === 'issue' ? 'Behavioral Issue or Note' : 'General Announcement'}.
      Details: ${details}.
      
      Tone: Warm, professional, and encouraging. Language: English.
      Do not use long introductions, get straight to the point gently.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error drafting message:", error);
    throw error;
  }
};

export const generateMonthlyProgress = async (studentName: string, month: string, reportSummary: any, lang: 'en' | 'ar') => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a professional kindergarten teacher consultant.
      Please write a "Monthly Progress Report" for a student based on their daily logs for the month of ${month}.
      
      Student Name: ${studentName}
      Language of Report: ${lang === 'ar' ? 'Arabic (Modern Standard, warm and professional)' : 'English (Warm and professional)'}
      
      Aggregated Data from Daily Reports:
      ${JSON.stringify(reportSummary, null, 2)}
      
      Structure the report with these sections (use appropriate emojis):
      1. Social & Emotional Development (based on moods and notes)
      2. Participation & Activities (based on activities list)
      3. Skills & Academic Progress (highlight any noted skills)
      4. General Teacher Observations (summary of notes)
      5. Recommendations for Parents (encouraging tips)
      
      Keep it concise, about 150-200 words. Make it sound encouraging for the parents.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating progress report:", error);
    throw error;
  }
};

export const interpretVoiceCommand = async (command: string, students: {id: string, name: string}[]) => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    
    // Improved Prompt with clearer Intent Mapping
    const prompt = `
      You are a Kindergarten Voice Assistant. Extract structured data from the following command.

      COMMAND: "${command}"

      RULES:
      1. **Action Extraction**:
         - "mark_attendance":
            - Keywords: "حضور" (Attendance), "سجل" (Record/Register), "موجود" (Present), "غائب" (Absent), "غياب", "مجاش".
            - **CRITICAL**: The phrase "سجل حضور" (Record Attendance) ALONE implies Action="mark_attendance" and Value="present".
         - "update_meal":
            - Keywords: "أكل" (Ate), "وجبة", "خلص", "eat", "food".
         - "add_note":
            - Only if it's explicitly about a "note", "observation", or "reminder" AND NOT about attendance.

      2. **Value Extraction**:
         - For 'mark_attendance': 
           - IF command contains "غائب" or "مجاش" or "not here" -> 'absent'.
           - ELSE (default) -> 'present'.
         - For 'update_meal': 'all' | 'some' | 'none'.
         - For 'add_note': The note content.

      3. **Name Extraction**:
         - Extract the student name. Remove titles like "الطالب" or "الطفل".

      OUTPUT JSON:
      {
        "action": "mark_attendance" | "update_meal" | "add_note" | "unknown",
        "extractedName": "string",
        "value": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            extractedName: { type: Type.STRING },
            value: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // --- ROBUST CLIENT-SIDE MATCHING ---
    let matchedStudentId = null;
    if (result.extractedName) {
        matchedStudentId = findBestStudentMatch(result.extractedName, students);
    }

    return {
        action: result.action || 'unknown',
        studentId: matchedStudentId,
        value: result.value,
        extractedName: result.extractedName
    };

  } catch (error) {
    console.error("Error interpreting command:", error);
    return { action: 'unknown' };
  }
};
