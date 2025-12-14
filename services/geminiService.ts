
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

// Helper strictly for other functions if needed, but interpretVoiceCommand now relies on AI
const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
    
    // Strategy: Pass the context (list of students) to the AI.
    // This allows the AI to handle fuzzy matching, Arabic <-> English transliteration, and typo correction directly.
    const studentContextJSON = JSON.stringify(students.slice(0, 50)); // Limit context to 50 students to be safe, though 1M window allows more.

    const prompt = `
      You are a Smart Kindergarten Assistant.
      
      CONTEXT (List of Students in current class):
      ${studentContextJSON}
      
      USER AUDIO COMMAND: "${command}"

      TASK:
      1. Match the spoken name in the command to a unique "id" from the CONTEXT list.
         - Be flexible: "Hamza" matches "Hamza Mohamed", "حمزة" matches "Hamza".
         - Handle Arabic/English differences intelligently.
         - If multiple partial matches exist, pick the most likely one based on the full name.
      
      2. Determine the Intent (Action) & Value:
         - "mark_attendance":
            - Keywords: "سجل حضور", "حضور", "موجود", "غائب", "attendance", "present", "absent".
            - Value: 'present' (default if not specified) OR 'absent' (if "غائب"/"absent" mentioned).
         - "update_meal":
            - Keywords: "أكل", "وجبة", "خلص", "eat", "meal", "lunch".
            - Value: 'all', 'some', 'none'.
         - "add_note":
            - Keywords: "ملاحظة", "note".
            - Value: The content of the note.

      OUTPUT JSON:
      {
        "action": "mark_attendance" | "update_meal" | "add_note" | "unknown",
        "studentId": "string" | null,
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
            studentId: { type: Type.STRING, nullable: true },
            value: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
        action: result.action || 'unknown',
        studentId: result.studentId,
        value: result.value,
        extractedName: '' // Legacy field, not strictly needed with ID
    };

  } catch (error) {
    console.error("Error interpreting command:", error);
    return { action: 'unknown' };
  }
};
