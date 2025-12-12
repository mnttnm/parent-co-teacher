import { GoogleGenAI, Type } from "@google/genai";
import { HomeworkAnalysis, GuidedSession, KidProfile } from '../types';
import { MOCK_ANALYSIS, MOCK_SESSION } from '../constants';

// Initialize Gemini
// NOTE: API Key is injected via process.env.API_KEY automatically in this environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the image to get structured data (Subject, Question, etc.)
 */
export const analyzeHomeworkImage = async (base64Image: string): Promise<HomeworkAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analyze this homework image. Identify the subject, chapter name (if visible), and the main question. 
            If there is no specific question (e.g., just a diagram or text), summarize the main concept being taught and set that as the 'question'.
            Output strictly in JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            chapter: { type: Type.STRING },
            question: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
          },
          required: ['subject', 'question', 'difficulty']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as HomeworkAnalysis;

  } catch (error) {
    console.error("Vision API Error, using mock:", error);
    return MOCK_ANALYSIS;
  }
};

/**
 * Step 2: Generate the Parent Guide based on the analysis and Kid Profile
 */
export const generateParentGuide = async (
  analysis: HomeworkAnalysis, 
  kid: KidProfile
): Promise<GuidedSession> => {
  try {
    const prompt = `
      You are a helpful teaching assistant for a parent with limited education.
      Child: ${kid.name}, ${kid.grade}, School: ${kid.schoolType}.
      Subject: ${analysis.subject}.
      Topic: ${analysis.chapter}.
      Concept/Question: ${analysis.question}.

      Goal: Help the parent explain this to the child.
      
      Output JSON with these fields:
      1. parentContextOriginal: Explain the concept/answer to the parent in "Hinglish" (Hindi language written in English script). Keep it very simple and conversational.
      2. parentContextEnglish: The exact same explanation translated into simple English.
      3. speakScript: A sentence the parent can say to the child to guide them.
      4. finalAnswer: The correct answer or summary of the concept.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parentContextOriginal: { type: Type.STRING },
            parentContextEnglish: { type: Type.STRING },
            speakScript: { type: Type.STRING },
            visualCuePrompt: { type: Type.STRING },
            finalAnswer: { type: Type.STRING }
          },
          required: ['parentContextOriginal', 'parentContextEnglish', 'speakScript', 'finalAnswer']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GuidedSession;

  } catch (error) {
    console.error("Generation API Error, using mock:", error);
    return MOCK_SESSION;
  }
};
