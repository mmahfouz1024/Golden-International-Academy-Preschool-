
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
    // Use the API key or fallback to empty string to prevent crash, though calls will fail gracefully later
    const apiKey = process.env.API_KEY || ''; 
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
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
    
    // Construct the prompt with data
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
    
    // Minimal context about students to map names to IDs
    const studentContext = students.map(s => `${s.name} (ID: ${s.id})`).join(', ');

    const prompt = `
      You are an AI assistant for a kindergarten teacher. 
      Interpret the following voice command and map it to a specific action.
      The command may be in English, Arabic, or a mix (Arabizi).
      
      Available Students: [${studentContext}]
      
      Command: "${command}"
      
      Determine the intent and return a JSON object.
      
      Possible Actions:
      1. 'mark_attendance': Set attendance status. 
         - English keywords: present, absent, here, away, mark attendance.
         - Arabic keywords: حاضر, موجود, غائب, غياب, مجاش, سجل حضور, تسجيل حضور, حضر.
         - Arabizi/Phonetic: hadir, mawjood, ghaeb, ghayeb, majash, bresent (present), absent (أبسنت).
         - Values: 'present', 'absent'.
         - Note: If user says "Register/Record attendance" (سجل حضور) without saying "absent", assume value is 'present'.
      2. 'update_meal': Set meal consumption.
         - English keywords: ate all, finished, ate some, didn't eat.
         - Arabic keywords: أكل كله, خلص أكله, أكل شوية, مأكلش, صايم.
         - Arabizi/Phonetic: akal kullo, akal shwaya, ma akalsh, finish, eat all (إيت أول).
         - Values: 'all', 'some', 'none'.
      3. 'add_note': Add a text note.
         - English keywords: note, add note, remember that.
         - Arabic keywords: ملاحظة, اكتب ملاحظة, سجل ملاحظة.
         - Note: Only use this if the command is clearly about writing a note/observation, NOT attendance.
      4. 'unknown': If command is unclear or student name is not found in the list.

      CRITICAL Name Matching Rules:
      - Match student names loosely to handle spelling variations.
      - **Arabic Specifics**:
        - Treat "ة" (Ta Marbuta) and "ه" (Ha) at end of words as IDENTICAL (e.g. "حمزة" == "حمزه").
        - Treat "أ", "إ", "آ", "ا" (Alif forms) as IDENTICAL (e.g. "أحمد" == "احمد").
        - Treat "ي" and "ى" as IDENTICAL.
      - If multiple students match, pick the most likely one based on the full name provided.

      Return ONLY JSON format:
      {
        "action": "mark_attendance" | "update_meal" | "add_note" | "unknown",
        "studentId": "id_string" (if applicable, best match from Available Students),
        "value": "string_value" (e.g., 'present', 'all', or the note text),
        "confidence": number (0-1)
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
            studentId: { type: Type.STRING },
            value: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error interpreting command:", error);
    return { action: 'unknown' };
  }
};
