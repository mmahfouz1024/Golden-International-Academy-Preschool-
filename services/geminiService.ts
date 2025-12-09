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
      بصفتك خبير تربوي في رياض الأطفال، قم بإنشاء نشاط تعليمي ممتع وتفاعلي.
      الفئة العمرية: ${ageGroup}
      الموضوع: ${topic}
      
      يجب أن تكون النتيجة بتنسيق JSON يحتوي على الحقول التالية:
      - title: عنوان النشاط
      - duration: المدة المقترحة
      - materials: قائمة المواد المطلوبة (array)
      - steps: خطوات تنفيذ النشاط (array)
      - learningOutcomes: ماذا سيتعلم الطفل (ملخص)
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
      اكتب رسالة قصيرة ومهذبة لولي أمر الطالب: ${studentName}.
      نوع الرسالة: ${type === 'praise' ? 'ثناء ومدح' : type === 'issue' ? 'مشكلة سلوكية أو ملاحظة' : 'إعلان عام'}.
      التفاصيل: ${details}.
      
      الأسلوب: دافئ، مهني، ومشجع. اللغة: العربية.
      لا تضع مقدمات طويلة، ادخل في صلب الموضوع بلطف.
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