
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

// --- Arabic Text Normalization Helper ---
const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, 'ا') // Normalize Alif
    .replace(/ة/g, 'ه')     // Normalize Ta Marbuta to Ha
    .replace(/ى/g, 'ي')     // Normalize Ya
    .replace(/[\u064B-\u065F]/g, '') // Remove Tashkeel (diacritics)
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')   // Collapse whitespace
    .trim()
    .toLowerCase();
};

const findBestStudentMatch = (searchName: string, students: {id: string, name: string}[]): string | null => {
  if (!searchName) return null;
  const normalizedSearch = normalizeArabic(searchName);
  const searchParts = normalizedSearch.split(' ');

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const student of students) {
    const normalizedStudentName = normalizeArabic(student.name);
    const studentParts = normalizedStudentName.split(' ');
    
    // Scoring System: Count how many parts of the search name appear in the student name
    let score = 0;
    for (const part of searchParts) {
      if (studentParts.includes(part)) {
        score += 1;
      } else {
        // Partial match check (e.g. "Mohamed" matches "Mohammed")
        for (const sPart of studentParts) {
           if (sPart.includes(part) || part.includes(sPart)) {
             if (Math.abs(sPart.length - part.length) <= 1) { // tight length check
                score += 0.8; 
             }
           }
        }
      }
    }

    // Boost score if the full normalized string is a substring (exact phrase match)
    if (normalizedStudentName.includes(normalizedSearch)) {
      score += 2; 
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchId = student.id;
    }
  }

  // Threshold: At least one strong match or partials
  return highestScore >= 0.8 ? bestMatchId : null;
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
    
    // NOTE: We do NOT pass the full student list to the AI anymore to avoid token limits or hallucination.
    // We only ask the AI to extract the name, and we match it locally.

    const prompt = `
      You are a Kindergarten Voice Assistant.
      Extract structured data from the following command.

      COMMAND: "${command}"

      MAPPING RULES:
      1. **Action**:
         - "mark_attendance" IF command contains words like: حضور, غياب, سجل حضور, تسجيل, موجود, غائب, present, absent, attendance.
         - "update_meal" IF command contains words like: أكل, وجبة, خلص, eat, meal, food, lunch.
         - "add_note" IF command is about writing a note/observation.
         
      2. **Value** (based on action):
         - For 'mark_attendance': 
           - 'absent' IF command implies absent ("غائب", "مجاش", "not here").
           - 'present' OTHERWISE (default for "سجل حضور", "موجود", "حاضر").
         - For 'update_meal': 'all' | 'some' | 'none'.
         - For 'add_note': The actual note content.

      3. **Target Name**:
         - Extract the name of the student mentioned. E.g. "حمزه محمد", "Sarah", "Ahmed".

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
    
    // --- CLIENT-SIDE FUZZY MATCHING ---
    // This solves the Arabic spelling issues (e.g. Hamza with Ha vs Ta Marbuta)
    // deterministically in code rather than relying on the LLM.
    let matchedStudentId = null;
    if (result.extractedName) {
        matchedStudentId = findBestStudentMatch(result.extractedName, students);
    }

    return {
        action: result.action || 'unknown',
        studentId: matchedStudentId,
        value: result.value,
        extractedName: result.extractedName // Passed back for debugging or error messages
    };

  } catch (error) {
    console.error("Error interpreting command:", error);
    return { action: 'unknown' };
  }
};
