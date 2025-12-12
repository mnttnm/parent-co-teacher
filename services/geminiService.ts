
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HomeworkAnalysis, GuidedSession, KidProfile, ChapterGuide } from '../types';
import { MOCK_ANALYSIS, MOCK_SESSION, MOCK_CHAPTER_GUIDE } from '../constants';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the images to get structured data
 * Using gemini-3-pro-preview for best multimodal reasoning.
 */
export const analyzeHomeworkImage = async (base64Images: string[]): Promise<HomeworkAnalysis> => {
  try {
    const imageParts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded for better recognition
      contents: {
        parts: [
          ...imageParts,
          {
            text: `Analyze these homework images. 
            1. Identify Subject and Chapter Name.
            2. DETECT CONTENT TYPE (Look carefully for headers):
               - "hasChapterContent": true if there is a STORY, POEM, or LESSON TEXT.
               - "hasHomeworkQuestions": true if there are "Exercises", "Questions", "Let us Learn", "Vocabulary", "Glossary", "Fill in the blanks".
            
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
            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
            detectedContent: {
              type: Type.OBJECT,
              properties: {
                hasChapterContent: { type: Type.BOOLEAN },
                hasHomeworkQuestions: { type: Type.BOOLEAN }
              },
              required: ['hasChapterContent', 'hasHomeworkQuestions']
            }
          },
          required: ['subject', 'chapter', 'difficulty', 'detectedContent']
        }
      }
    });

    const text = response.text;
    console.log("🔍 Vision Analysis Response:", text);

    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as HomeworkAnalysis;

  } catch (error) {
    console.error("Vision API Error, using mock:", error);
    return MOCK_ANALYSIS;
  }
};

/**
 * Step 2a: Generate the Parent Guide (Homework Mode)
 * Enforces Hinglish for all parent scripts and strict JSON arrays.
 */
export const generateParentGuide = async (
  base64Images: string[],
  analysis: HomeworkAnalysis, 
  kid: KidProfile
): Promise<GuidedSession> => {
  try {
    const imageParts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const prompt = `
      You are "Hom-ed Teacher," an AI assistant for parents with limited education.
      
      Context:
      Child: ${kid.name}, ${kid.grade}, School: ${kid.schoolType}.
      Subject: ${analysis.subject}.
      Chapter: ${analysis.chapter}.

      Your Task:
      1. Analyze the images and EXTRACT ALL HOMEWORK QUESTIONS, EXERCISES, and VOCABULARY.
         - Look for headers like: "Exercises", "Let's Think", "Word Power", "Glossary", "Q&A".
         - EXTRACT these even if they are mixed with story text.
      
      2. **LANGUAGE RULES (CRITICAL):**
         - The parent acts as a co-teacher but has limited English.
         - **parentContextOriginal**: EXPLAIN the concept in **Hinglish** (Hindi in English script). 
           Example: "Is sawal mein humein ye pata lagana hai ki..."
         - **speakScript**: Write exactly what the parent should SAY to the child in **Hinglish**.
           Example: "${kid.name} beta, chalo dekhte hain ki is kahani mein kya hua."
         - **explanation**: For each question, provide a hint in **Hinglish**.

      3. **DATA STRUCTURE RULES:**
         - **questionsList**: Must be a JSON Array. Do NOT merge questions into a paragraph.
         - **vocabularyHelp**: Extract any "Word Meanings", "Glossary", or "Let us learn" words here.
           CORRECT: { "word": "Pact", "meaning": "Samjhauta", "pronunciation": "Pakt" }

      Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parentContextOriginal: { type: Type.STRING, description: "Hinglish explanation" },
            parentContextEnglish: { type: Type.STRING, description: "English explanation" },
            speakScript: { type: Type.STRING, description: "Hinglish script to say to child" },
            guidedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            visualCuePrompt: { type: Type.STRING },
            vocabularyHelp: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  pronunciation: { type: Type.STRING }
                }
              }
            },
            questionsList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['subjective', 'mcq', 'fill_in_blank'] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING, description: "Hinglish hint for the parent" }
                },
                required: ['id', 'text', 'type', 'answer', 'explanation']
              }
            }
          },
          required: ['parentContextOriginal', 'parentContextEnglish', 'speakScript', 'questionsList', 'visualCuePrompt', 'vocabularyHelp']
        }
      }
    });

    const text = response.text;
    console.log("📝 Parent Guide Response:", text);

    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GuidedSession;

  } catch (error) {
    console.error("Generation API Error, using mock:", error);
    return MOCK_SESSION;
  }
};

/**
 * Step 2b: Generate Chapter Teaching Guide (Chapter Mode)
 * Enforces Hinglish for Teaching Guide and Kid Explanation.
 * STRICTLY EXCLUDES EXERCISES from the text chunks.
 */
export const generateChapterGuide = async (
  base64Images: string[],
  analysis: HomeworkAnalysis, 
  kid: KidProfile
): Promise<ChapterGuide> => {
  try {
    const imageParts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const prompt = `
      You are "Hom-ed Teacher". The parent wants to teach the *entire chapter* to their child: ${kid.name} (${kid.grade}).
      
      Subject: ${analysis.subject}.
      Chapter: ${analysis.chapter}.

      Task:
      1. Analyze the full text in the images.
      2. Break the chapter into logical, progressive "Sub-Chapters".
      3. **Ensure each chunk is CONCISE.**
      
      4. **CONTENT EXCLUSION (CRITICAL):**
         - **INCLUDE ONLY**: The main story, poem, or lesson text.
         - **STRICTLY EXCLUDE**: Any section titled "Exercises", "Questions", "Let us Learn", "Word Meanings", "Glossary", "Activity".
         - Do not treat Q&A or Vocabulary lists as "Sub-Chapters". If the page ends with exercises, IGNORE THEM for this specific task.
      
      5. **LANGUAGE RULES:**
         - **parentExplanation**: Explain to the parent in **Hinglish**.
         - **teachingGuide**: Guide the parent on how to teach in **Hinglish**.
           Example: "Pehle ${kid.name} se poocho ki usne kabhi..."
         - **kidExplanation**: The script the parent SAYS to the child. Must be **Hinglish**.
           Example: "${kid.name}, socho agar tumhare paas ek..."
         - **simplifiedEnglish**: Simple English summary (for listening practice).

      Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            subChapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  parentExplanation: { type: Type.STRING },
                  teachingGuide: { type: Type.STRING },
                  simplifiedEnglish: { type: Type.STRING },
                  kidExplanation: { type: Type.STRING }
                },
                required: ['id', 'title', 'originalText', 'parentExplanation', 'teachingGuide', 'simplifiedEnglish', 'kidExplanation']
              }
            }
          },
          required: ['topic', 'summary', 'subChapters']
        }
      }
    });

    const text = response.text;
    console.log("📖 Chapter Guide Response:", text);

    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ChapterGuide;

  } catch (error) {
    console.error("Chapter API Error, using mock:", error);
    return MOCK_CHAPTER_GUIDE;
  }
};

/**
 * Tier 2: Generate Audio (TTS)
 */
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    // 1. Sanitize text: Limit length and remove weird characters
    const safeText = text.substring(0, 450); 
    
    console.log("🔊 Generating TTS for:", safeText.substring(0, 50) + "...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: safeText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Tier 2: Generate Visual Cue Image
 */
export const generateVisualCue = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data; 
      }
    }
    throw new Error("No image part found in response");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};
