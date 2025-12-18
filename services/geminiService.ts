
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
    // Correctly initialize with API key from process.env.API_KEY as per guidelines
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

// --- ROBUST ARABIC NORMALIZATION ---
const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    // Normalize Alef
    .replace(/[أإآ]/g, 'ا')
    // Normalize Ta Marbuta to Ha (Critical for Hamza/Hamzah matching)
    .replace(/[ة]/g, 'ه')
    // Normalize Ya/Alif Maqsura
    .replace(/[ى]/g, 'ي')
    // Remove Tashkeel (Diacritics)
    .replace(/[\u064B-\u065F]/g, '')
    // Remove Tatweel
    .replace(/\u0640/g, '')
    // Remove non-word chars (keep spaces and arabic/english letters)
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const findBestStudentMatch = (searchName: string, students: {id: string, name: string}[]): string | null => {
  if (!searchName) return null;

  // 1. Clean the search query (Remove titles)
  const stopWords = ['الطالب', 'طالب', 'الطفل', 'طفل', 'ابن', 'ابني', 'بنت', 'بنتي', 'student', 'child'];
  let cleanSearch = searchName;
  stopWords.forEach(word => {
    cleanSearch = cleanSearch.replace(new RegExp(word, 'gi'), '');
  });

  const normalizedSearch = normalizeText(cleanSearch);
  const searchParts = normalizedSearch.split(' ').filter(p => p.length > 1);

  if (searchParts.length === 0) return null;

  let bestMatchId: string | null = null;
  let maxMatchedParts = 0;
  let bestScore = 0;

  for (const student of students) {
    const normalizedStudentName = normalizeText(student.name);
    const studentParts = normalizedStudentName.split(' ');
    
    let matchedPartsCount = 0;
    
    // Check how many search tokens exist in the student name
    for (const searchPart of searchParts) {
      if (studentParts.some(sp => sp.includes(searchPart) || searchPart.includes(sp))) {
        matchedPartsCount++;
      }
    }

    // Exact full match bonus
    if (normalizedStudentName === normalizedSearch) {
        return student.id;
    }

    // Substring match bonus (e.g. "Hamza" inside "Hamza Mohamed")
    if (normalizedStudentName.includes(normalizedSearch)) {
        matchedPartsCount += 0.5;
    }

    // Score calculation
    if (matchedPartsCount > maxMatchedParts) {
        maxMatchedParts = matchedPartsCount;
        bestMatchId = student.id;
        bestScore = matchedPartsCount / searchParts.length;
    } else if (matchedPartsCount === maxMatchedParts && matchedPartsCount > 0) {
        // Tie-breaker: prefer shorter name difference (more exact match)
        const currentDiff = Math.abs(normalizedStudentName.length - normalizedSearch.length);
        const bestStudent = students.find(s => s.id === bestMatchId);
        const bestDiff = bestStudent ? Math.abs(normalizeText(bestStudent.name).length - normalizedSearch.length) : 999;
        
        if (currentDiff < bestDiff) {
            bestMatchId = student.id;
        }
    }
  }

  // Threshold: Match at least one word strongly or 50% of tokens
  if (maxMatchedParts >= 1 || bestScore >= 0.5) {
      return bestMatchId;
  }

  return null;
};

export const generateActivityPlan = async (ageGroup: string, topic: string) => {
  try {
    const ai = getAiClient();
    // Using gemini-3-flash-preview as recommended for basic text tasks
    const model = 'gemini-3-flash-preview';
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
    // Using gemini-3-flash-preview as recommended for basic text tasks
    const model = 'gemini-3-flash-preview';
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
    // Using gemini-3-pro-preview as recommended for complex text tasks (analysis)
    const model = 'gemini-3-pro-preview';
    
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
    // Using gemini-3-flash-preview as recommended for basic extraction tasks
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      You are a Kindergarten Voice Assistant. Extract structured data from the command.

      COMMAND: "${command}"

      1. Identify the ACTION:
         - "mark_attendance": Keywords like "حضور" (Attendance), "سجل" (Record), "موجود" (Present), "غائب" (Absent), "غياب".
           * Note: "سجل حضور" implies "present" unless "absent" is explicitly mentioned.
         - "update_meal": Keywords like "أكل" (Ate), "وجبة", "خلص", "eat".
         - "add_note": Keywords like "ملاحظة", "note".

      2. Identify the VALUE:
         - For Attendance: 'present' (default) or 'absent'.
         - For Meals: 'all' (default if completed), 'some', 'none'.
         - For Note: The note text.

      3. Identify the NAME:
         - Extract the student name mentioned. Remove titles like "الطالب", "الطفل".

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
    
    // --- CLIENT SIDE MATCHING ---
    // This is more robust for Arabic spelling variations (Hamza vs Hamzah vs حمزة vs حمزه)
    // than relying on the AI to match against a list, especially for small typos.
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
