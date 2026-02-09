
import { GoogleGenAI, Type, Modality } from "@google/genai";
import {
  HomeworkAnalysis,
  GuidedSession,
  KidProfile,
  ParentLanguage,
  ChapterGuide,
  RevisionQuiz,
  MicroLesson,
  HistoryItem,
  MarathonPlan,
  MarathonMission,
  MarathonCheckIn,
  MarathonMissionUpdate,
  StoredImage
} from '../types';
import { MOCK_ANALYSIS, MOCK_SESSION, MOCK_CHAPTER_GUIDE } from '../constants';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MarathonDraftMission {
  dayNumber: number;
  focusSkill: string;
  objective: string;
  parentAction: string;
  childTask: string;
  evidenceToCapture: string;
  fallbackPlan: string;
  estimatedMinutes: number;
}

interface MarathonDraftPlan {
  planTitle: string;
  strategy: string;
  durationDays: number;
  missions: MarathonDraftMission[];
}

const WEAKNESS_LABELS: Record<string, string> = {
  vocab: 'Vocabulary',
  concept: 'Concept Building',
  focus: 'Attention & Focus'
};

const safeParseJson = <T>(text: string | undefined): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const normalizeWeakness = (tag: string): string => WEAKNESS_LABELS[tag] || tag;

const getPrimaryLanguageLabel = (language: ParentLanguage): string =>
  language === 'english' ? 'clear conversational English' : 'natural Hinglish (Hindi in English script)';

const getSecondaryLanguageLabel = (language: ParentLanguage): string =>
  language === 'english' ? 'natural Hinglish (Hindi in English script)' : 'clear conversational English';

const getLanguageRules = (language: ParentLanguage): string => {
  if (language === 'english') {
    return `
      Primary parent language: clear conversational English.
      Secondary support language: natural Hinglish (Hindi in English script).
      Keep the tone practical, everyday, and easy to speak aloud.
    `;
  }

  return `
    Primary parent language: natural Hinglish (Hindi in English script).
    Use code-mixed everyday speech (for example, "line mein khade ho jao"), not literal textbook translation.
    Secondary support language: clear conversational English.
  `;
};

const buildSignals = (history: HistoryItem[], weaknessStats: Record<string, number>) => {
  const recentTopics = Array.from(new Set(history.map((item) => item.topic))).slice(0, 4);
  const topWeaknesses = Object.entries(weaknessStats)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => normalizeWeakness(key))
    .slice(0, 3);

  return {
    recentTopics,
    topWeaknesses: topWeaknesses.length > 0 ? topWeaknesses : ['Comprehension'],
    sessionsAnalyzed: Math.max(history.length, 1)
  };
};

const summarizeHistoryForPrompt = (history: HistoryItem[]): string => {
  if (history.length === 0) {
    return 'No prior session history is available. Start with a balanced plan of comprehension, vocabulary, and recap.';
  }

  return history.slice(0, 8).map((item, idx) => {
    const tags = item.feedbackTags && item.feedbackTags.length > 0 ? item.feedbackTags.join(', ') : 'none';
    return `${idx + 1}. ${item.subject} - ${item.topic} (${item.type}) | feedback tags: ${tags}`;
  }).join('\n');
};

const normalizeMission = (
  mission: MarathonDraftMission,
  index: number,
  parentLanguage: ParentLanguage
): MarathonMission => {
  const missionId = `m-${index + 1}`;
  return {
    id: missionId,
    dayNumber: mission.dayNumber || index + 1,
    focusSkill: mission.focusSkill || 'Comprehension',
    objective: mission.objective || (
      parentLanguage === 'english'
        ? 'Build confidence through one focused practice loop.'
        : 'Ek focused practice loop se confidence build karo.'
    ),
    parentAction: mission.parentAction || (
      parentLanguage === 'english'
        ? 'Read the concept aloud and ask one open-ended question.'
        : 'Concept ko zor se padho aur ek open-ended sawal pucho.'
    ),
    childTask: mission.childTask || (
      parentLanguage === 'english'
        ? 'Explain the concept in simple words with one example.'
        : 'Concept ko simple words mein ek example ke saath samjhao.'
    ),
    evidenceToCapture: mission.evidenceToCapture || (
      parentLanguage === 'english'
        ? 'One spoken response from the child and one written sentence.'
        : 'Child ka 1 spoken response aur 1 written sentence.'
    ),
    fallbackPlan: mission.fallbackPlan || (
      parentLanguage === 'english'
        ? 'Retry with easier examples and a 2-minute recap.'
        : 'Easy examples ke saath retry karo aur 2-minute recap karo.'
    ),
    estimatedMinutes: Math.max(5, Math.min(25, mission.estimatedMinutes || 12)),
    status: 'pending'
  };
};

const ensureDraftQuality = (draft: MarathonDraftPlan, parentLanguage: ParentLanguage): MarathonDraftPlan => {
  const missionPool = draft.missions || [];
  const filled = missionPool.length >= 5 ? missionPool : [
    ...missionPool,
    ...Array.from({ length: 5 - missionPool.length }).map((_, idx) => ({
      dayNumber: missionPool.length + idx + 1,
      focusSkill: 'Comprehension',
      objective: parentLanguage === 'english'
        ? 'Practice one concept from today in a parent-guided conversation.'
        : 'Aaj ke ek concept ko parent-guided conversation mein practice karo.',
      parentAction: parentLanguage === 'english'
        ? 'Use one real-life example and ask the child to restate the answer.'
        : 'Ek real-life example use karo aur child se answer ko restate karvao.',
      childTask: parentLanguage === 'english'
        ? 'Solve one question and explain the reasoning aloud.'
        : 'Ek question solve karo aur reasoning zor se explain karo.',
      evidenceToCapture: parentLanguage === 'english'
        ? 'Record one correct explanation and one corrected mistake.'
        : 'Ek correct explanation aur ek corrected mistake note karo.',
      fallbackPlan: parentLanguage === 'english'
        ? 'Switch to a simpler question and do a guided retry.'
        : 'Simple question par switch karo aur guided retry karo.',
      estimatedMinutes: 12
    }))
  ];

  return {
    planTitle: draft.planTitle || '7-Day Learning Marathon',
    strategy: draft.strategy || 'Short daily loops with adaptive revision.',
    durationDays: Math.max(5, Math.min(10, draft.durationDays || filled.length)),
    missions: filled.slice(0, 10)
  };
};

const scoreDraft = (
  draft: MarathonDraftPlan,
  topWeaknesses: string[]
): { score: number; checklist: string[]; critique: string } => {
  let score = 50;
  const checklist: string[] = [];
  const weaknessesLower = topWeaknesses.map(w => w.toLowerCase());
  const missionText = (draft.missions || []).map(m => `${m.focusSkill} ${m.objective}`).join(' ').toLowerCase();

  if ((draft.missions || []).length >= 5) {
    score += 15;
    checklist.push('At least 5 missions are present.');
  } else {
    checklist.push('Mission count is below 5.');
  }

  if (draft.strategy && draft.strategy.length > 20) {
    score += 10;
    checklist.push('Plan has an explicit strategy.');
  } else {
    checklist.push('Strategy is too shallow.');
  }

  const coveredWeaknesses = weaknessesLower.filter(tag => missionText.includes(tag.split(' ')[0]));
  if (coveredWeaknesses.length > 0) {
    score += 15;
    checklist.push(`Targets weakness signals: ${coveredWeaknesses.join(', ')}.`);
  } else {
    checklist.push('Does not clearly target top weaknesses.');
  }

  const hasEvidence = (draft.missions || []).every(m => (m.evidenceToCapture || '').length > 8);
  if (hasEvidence) {
    score += 10;
    checklist.push('Every mission includes measurable evidence.');
  } else {
    checklist.push('Some missions are missing measurable evidence.');
  }

  const minuteRangeOk = (draft.missions || []).every(m => m.estimatedMinutes >= 5 && m.estimatedMinutes <= 25);
  if (minuteRangeOk) {
    score += 10;
    checklist.push('Mission durations are parent-friendly (5-25 min).');
  } else {
    checklist.push('Mission durations need normalization.');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    checklist,
    critique: checklist.join(' ')
  };
};

/**
 * Step 1: Analyze the images to get structured data
 * Using gemini-3-pro-preview for best multimodal reasoning.
 */
export const analyzeHomeworkImage = async (images: StoredImage[]): Promise<HomeworkAnalysis> => {
  try {
    const imageParts = images.map((image) => ({
      inlineData: {
        mimeType: image.mimeType || 'image/jpeg',
        data: image.data
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
  images: StoredImage[],
  analysis: HomeworkAnalysis, 
  kid: KidProfile,
  parentLanguage: ParentLanguage
): Promise<GuidedSession> => {
  try {
    const imageParts = images.map((image) => ({
      inlineData: {
        mimeType: image.mimeType || 'image/jpeg',
        data: image.data
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
         ${getLanguageRules(parentLanguage)}
         - **parentContextOriginal**: Must be in PRIMARY language (${getPrimaryLanguageLabel(parentLanguage)}).
         - **parentContextEnglish**: Must be in SECONDARY language (${getSecondaryLanguageLabel(parentLanguage)}).
         - **speakScript**: Write exactly what the parent should SAY to the child in PRIMARY language.
         - **explanation**: For each question, provide a hint in PRIMARY language.
         - Keep wording naturally spoken, not literal translation.

      2.1 **QUESTION LANGUAGE RULE:**
         - **questionsList.text**, **answer**, and **options** should be in PRIMARY language unless a textbook line must be quoted exactly.
         - If textbook is in English and PRIMARY is Hinglish, keep it colloquial and parent-friendly.

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
            parentContextOriginal: { type: Type.STRING, description: "Primary language explanation for parent" },
            parentContextEnglish: { type: Type.STRING, description: "Secondary language explanation for parent" },
            speakScript: { type: Type.STRING, description: "Primary language script to say to child" },
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
                  explanation: { type: Type.STRING, description: "Primary language hint for the parent" }
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
  images: StoredImage[],
  analysis: HomeworkAnalysis, 
  kid: KidProfile,
  parentLanguage: ParentLanguage
): Promise<ChapterGuide> => {
  try {
    const imageParts = images.map((image) => ({
      inlineData: {
        mimeType: image.mimeType || 'image/jpeg',
        data: image.data
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
         ${getLanguageRules(parentLanguage)}
         - **parentExplanation**: Explain to the parent in PRIMARY language (${getPrimaryLanguageLabel(parentLanguage)}).
         - **teachingGuide**: Guide the parent on how to teach in PRIMARY language.
           Example: "Pehle ${kid.name} se poocho ki usne kabhi..."
         - **kidExplanation**: The script the parent SAYS to the child. Must be in PRIMARY language.
           Example: "${kid.name}, socho agar tumhare paas ek..."
         - **simplifiedEnglish**: SECONDARY language summary (${getSecondaryLanguageLabel(parentLanguage)}).

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
 * Tier 3: Revision Mode (Quiz Generation)
 * Generates MCQs and Flashcards based on a topic string (from history).
 */
export const generateRevisionQuiz = async (
  topic: string,
  kid: KidProfile,
  parentLanguage: ParentLanguage
): Promise<RevisionQuiz> => {
  try {
    const prompt = `
      Create a revision quiz for the topic: "${topic}".
      Child: ${kid.name}, ${kid.grade}.
      
      Requirements:
      1. Generate 2 Multiple Choice Questions (MCQ).
      2. Generate 1 Flashcard Question (simple concept recall).
      3. Use PRIMARY language (${getPrimaryLanguageLabel(parentLanguage)}) for question, options, and explanation.
      4. Keep phrasing naturally spoken by a parent and child.
      
      Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['mcq', 'flashcard'] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['id', 'question', 'type', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['topic', 'questions']
        }
      }
    });

    const text = response.text;
    return JSON.parse(text) as RevisionQuiz;
  } catch (error) {
    console.error("Quiz Gen Error, using fallback quiz:", error);
    return {
      topic,
      questions: [
        {
          id: 1,
          question: parentLanguage === 'english'
            ? `What is the main idea of "${topic}"?`
            : `"${topic}" ka main idea kya hai?`,
          type: 'mcq',
          options: parentLanguage === 'english'
            ? ['Main concept', 'Random detail', 'Unrelated fact']
            : ['Main concept', 'Random detail', 'Unrelated fact'],
          correctAnswer: 'Main concept',
          explanation: parentLanguage === 'english'
            ? `Ask ${kid.name} to explain the chapter's core idea in one line.`
            : `${kid.name} ko bolo chapter ka core idea ek line mein bataye.`
        },
        {
          id: 2,
          question: parentLanguage === 'english'
            ? `Which statement best supports the lesson from "${topic}"?`
            : `"${topic}" se kaunsa statement lesson ko best support karta hai?`,
          type: 'mcq',
          options: parentLanguage === 'english'
            ? ['Evidence from text', 'Guess without reading', 'Ignore examples']
            : ['Text se evidence', 'Bina padhe guess', 'Examples ignore karo'],
          correctAnswer: 'Evidence from text',
          explanation: parentLanguage === 'english'
            ? 'While answering, ask for one proof line from the text.'
            : 'Answer dete waqt text se ek proof line lena zaroori hai.'
        },
        {
          id: 3,
          question: parentLanguage === 'english'
            ? `Explain "${topic}" in your own words.`
            : `"${topic}" ko apne words mein samjhao.`,
          type: 'flashcard',
          correctAnswer: parentLanguage === 'english'
            ? 'A short summary using one example from the lesson.'
            : 'Lesson ka short summary do, saath mein ek example.',
          explanation: parentLanguage === 'english'
            ? 'Explaining in your own words improves retention.'
            : 'Apne words mein samjhana retention strong banata hai.'
        }
      ]
    };
  }
};

/**
 * Tier 3: Micro-Lesson (Weakness Fixer)
 * Generates a 3-step quick fix for a specific problem area.
 */
export const generateMicroLesson = async (
  topic: string,
  weakness: string,
  kid: KidProfile,
  parentLanguage: ParentLanguage
): Promise<MicroLesson> => {
  try {
    const prompt = `
      Create a "5-minute Micro-Lesson" to fix a weakness.
      Topic: "${topic}"
      Weakness Tag: "${weakness}" (e.g., Vocabulary, Concept).
      Child: ${kid.name}, ${kid.grade}.
      
      ${getLanguageRules(parentLanguage)}
      Output 3 simple steps for the parent to teach this concept effectively in PRIMARY language.
      Include a visual prompt suggestion for each step if needed.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            focusArea: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Instruction for parent" },
                  speakScript: { type: Type.STRING, description: "Hinglish script to say" },
                  visualPrompt: { type: Type.STRING, description: "Prompt for an image if needed" }
                },
                required: ['text', 'speakScript']
              }
            }
          },
          required: ['title', 'focusArea', 'steps']
        }
      }
    });
    
    return JSON.parse(response.text) as MicroLesson;
  } catch (error) {
    console.error("Micro Lesson Error, using fallback lesson:", error);
    return {
      title: `Quick Fix: ${weakness}`,
      focusArea: weakness,
      steps: [
        {
          text: parentLanguage === 'english'
            ? `Re-read one key part from "${topic}" and underline the confusing part.`
            : `"${topic}" ka ek important part dobara padho aur confusing line ko underline karo.`,
          speakScript: parentLanguage === 'english'
            ? `${kid.name}, first identify the confusing line.`
            : `${kid.name}, pehle confusing line identify karte hain.`
        },
        {
          text: parentLanguage === 'english'
            ? 'Explain that line in simpler words with one real-life example.'
            : 'Us line ko simple words mein samjhao aur ek real-life example do.',
          speakScript: parentLanguage === 'english'
            ? 'Now explain it in simple words, then give one example.'
            : 'Ab isko simple words mein samjhao, phir ek example do.'
        },
        {
          text: parentLanguage === 'english'
            ? 'Ask one check question and let the child answer independently.'
            : 'Ek check question pucho aur child ko khud answer dene do.',
          speakScript: parentLanguage === 'english'
            ? 'Now you answer on your own, I will only guide.'
            : 'Ab tum khud answer do, main sirf guide karunga.'
        }
      ]
    };
  }
};

export const generateMarathonPlan = async (
  kid: KidProfile,
  history: HistoryItem[],
  weaknessStats: Record<string, number>,
  parentLanguage: ParentLanguage
): Promise<MarathonPlan> => {
  const signals = buildSignals(history, weaknessStats);
  const historySummary = summarizeHistoryForPrompt(history);
  const now = Date.now();

  const basePrompt = `
    You are an autonomous learning orchestrator for a parent-led education app.
    Create a focused multi-day "marathon" plan for:
    Child: ${kid.name} (${kid.grade}), school type: ${kid.schoolType}.

    Signals:
    - Top weaknesses: ${signals.topWeaknesses.join(', ')}
    - Recent topics: ${signals.recentTopics.join(', ') || 'None'}
    - Session count reviewed: ${signals.sessionsAnalyzed}

    Recent learning history:
    ${historySummary}

    Plan requirements:
    1. Duration 5-7 days, one mission per day.
    2. Every mission must have: focusSkill, objective, parentAction, childTask, evidenceToCapture, fallbackPlan, estimatedMinutes.
    3. Keep actions practical for low-literacy parents.
    4. Maintain progression: warm-up -> core concept -> recall -> exam readiness.
    5. Use concise text and avoid generic advice.
    6. Write objective, parentAction, childTask, evidenceToCapture, and fallbackPlan in PRIMARY language (${getPrimaryLanguageLabel(parentLanguage)}).
  `;

  try {
    const draftResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: basePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            strategy: { type: Type.STRING },
            durationDays: { type: Type.INTEGER },
            missions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  focusSkill: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  parentAction: { type: Type.STRING },
                  childTask: { type: Type.STRING },
                  evidenceToCapture: { type: Type.STRING },
                  fallbackPlan: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ['dayNumber', 'focusSkill', 'objective', 'parentAction', 'childTask', 'evidenceToCapture', 'fallbackPlan', 'estimatedMinutes']
              }
            }
          },
          required: ['planTitle', 'strategy', 'durationDays', 'missions']
        }
      }
    });

    const draftParsed = safeParseJson<MarathonDraftPlan>(draftResponse.text) || {
      planTitle: parentLanguage === 'english' ? '7-Day Learning Marathon' : '7-Day Learning Marathon',
      strategy: parentLanguage === 'english'
        ? 'Short, evidence-based daily loops for parent-guided practice.'
        : 'Short, evidence-based daily loops for parent-guided practice.',
      durationDays: 7,
      missions: []
    };
    const draft = ensureDraftQuality(draftParsed, parentLanguage);
    const initialEvaluation = scoreDraft(draft, signals.topWeaknesses);

    const refinePrompt = `
      Improve this plan using the critique below.
      Critique: ${initialEvaluation.critique}

      Original plan:
      ${JSON.stringify(draft, null, 2)}

      Return a stronger plan that fixes missing coverage and keeps mission actions concrete.
    `;

    const refinedResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: refinePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            strategy: { type: Type.STRING },
            durationDays: { type: Type.INTEGER },
            missions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  focusSkill: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  parentAction: { type: Type.STRING },
                  childTask: { type: Type.STRING },
                  evidenceToCapture: { type: Type.STRING },
                  fallbackPlan: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ['dayNumber', 'focusSkill', 'objective', 'parentAction', 'childTask', 'evidenceToCapture', 'fallbackPlan', 'estimatedMinutes']
              }
            }
          },
          required: ['planTitle', 'strategy', 'durationDays', 'missions']
        }
      }
    });

    const refinedParsed = safeParseJson<MarathonDraftPlan>(refinedResponse.text);
    const finalDraft = ensureDraftQuality(refinedParsed || draft, parentLanguage);
    const finalEvaluation = scoreDraft(finalDraft, signals.topWeaknesses);
    const missions = finalDraft.missions.map((mission, index) => normalizeMission(mission, index, parentLanguage));

    return {
      id: `plan-${now}`,
      kidId: kid.id,
      createdAt: now,
      updatedAt: now,
      planTitle: finalDraft.planTitle,
      strategy: finalDraft.strategy,
      durationDays: finalDraft.durationDays,
      missions,
      signals,
      qualityReport: {
        initialScore: initialEvaluation.score,
        finalScore: finalEvaluation.score,
        critique: finalEvaluation.critique,
        verificationChecklist: finalEvaluation.checklist
      },
      checkInHistory: []
    };
  } catch (error) {
    console.error("Marathon plan generation failed, using fallback:", error);

    const fallbackMissions: MarathonMission[] = Array.from({ length: 5 }).map((_, idx) => ({
      id: `m-${idx + 1}`,
      dayNumber: idx + 1,
      focusSkill: signals.topWeaknesses[idx % signals.topWeaknesses.length] || 'Comprehension',
      objective: parentLanguage === 'english'
        ? `Reinforce ${signals.recentTopics[0] || 'current chapter'} using one short guided loop.`
        : `${signals.recentTopics[0] || 'current chapter'} ko ek short guided loop se reinforce karo.`,
      parentAction: parentLanguage === 'english'
        ? 'Read one question aloud, pause, and ask the child to explain in their own words.'
        : 'Ek question zor se padho, pause karo, phir child ko apne words mein samjhane bolo.',
      childTask: parentLanguage === 'english'
        ? 'Answer one question and give one real-life example.'
        : 'Ek question ka answer do aur ek real-life example do.',
      evidenceToCapture: parentLanguage === 'english'
        ? '1 spoken explanation + 1 written sentence.'
        : '1 spoken explanation + 1 written sentence.',
      fallbackPlan: parentLanguage === 'english'
        ? 'If stuck, simplify language and retry with a worked example.'
        : 'Agar atko, language aur simple karo aur worked example ke saath retry karo.',
      estimatedMinutes: 12,
      status: 'pending'
    }));

    return {
      id: `plan-${now}`,
      kidId: kid.id,
      createdAt: now,
      updatedAt: now,
      planTitle: parentLanguage === 'english' ? 'Fallback Learning Marathon' : 'Fallback Learning Marathon',
      strategy: parentLanguage === 'english'
        ? 'Steady daily repetition with evidence capture and simpler retries.'
        : 'Steady daily repetition with evidence capture and simpler retries.',
      durationDays: fallbackMissions.length,
      missions: fallbackMissions,
      signals,
      qualityReport: {
        initialScore: 55,
        finalScore: 55,
        critique: 'Fallback plan used due to API/runtime failure.',
        verificationChecklist: ['Fallback generated locally.']
      },
      checkInHistory: []
    };
  }
};

export const runMarathonCheckIn = async (
  plan: MarathonPlan,
  kid: KidProfile,
  weaknessStats: Record<string, number>,
  parentLanguage: ParentLanguage
): Promise<MarathonCheckIn> => {
  const completed = plan.missions.filter(m => m.status === 'done').length;
  const pending = plan.missions.filter(m => m.status !== 'done');
  const weaknessSignal = Object.entries(weaknessStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key, count]) => `${normalizeWeakness(key)} (${count})`)
    .join(', ');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are checking a long-running autonomous plan.
        Child: ${kid.name}, ${kid.grade}.
        Progress: ${completed}/${plan.missions.length} missions complete.
        Weakness signals: ${weaknessSignal || 'none'}.
        Next pending missions:
        ${pending.slice(0, 3).map(m => `- ${m.id}: ${m.objective} | parentAction: ${m.parentAction}`).join('\n')}

        Output a compact check-in with:
        1) summary
        2) nextAction
        3) motivationScript in PRIMARY language (${getPrimaryLanguageLabel(parentLanguage)})
        4) optional missionUpdates for pending missions only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            nextAction: { type: Type.STRING },
            motivationScript: { type: Type.STRING },
            missionUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  missionId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  updatedParentAction: { type: Type.STRING },
                  updatedChildTask: { type: Type.STRING }
                },
                required: ['missionId', 'reason', 'updatedParentAction', 'updatedChildTask']
              }
            }
          },
          required: ['summary', 'nextAction', 'motivationScript', 'missionUpdates']
        }
      }
    });

    const parsed = safeParseJson<{
      summary: string;
      nextAction: string;
      motivationScript: string;
      missionUpdates: MarathonMissionUpdate[];
    }>(response.text);

    if (!parsed) throw new Error('Invalid check-in response');

    const allowedIds = new Set(pending.map(m => m.id));
    const missionUpdates = (parsed.missionUpdates || []).filter(update => allowedIds.has(update.missionId));

    return {
      timestamp: Date.now(),
      summary: parsed.summary,
      nextAction: parsed.nextAction,
      motivationScript: parsed.motivationScript,
      missionUpdates
    };
  } catch (error) {
    console.error("Marathon check-in failed, using fallback:", error);
    return {
      timestamp: Date.now(),
      summary: parentLanguage === 'english'
        ? `${completed}/${plan.missions.length} missions complete. Continue with the next pending mission.`
        : `${completed}/${plan.missions.length} missions complete. Next pending mission continue karo.`,
      nextAction: pending[0]
        ? (parentLanguage === 'english'
          ? `Do mission ${pending[0].dayNumber}: ${pending[0].objective}`
          : `Mission ${pending[0].dayNumber} karo: ${pending[0].objective}`)
        : (parentLanguage === 'english' ? 'Plan is complete.' : 'Plan complete ho gaya.'),
      motivationScript: parentLanguage === 'english'
        ? `Do a focused 10-minute revision with ${kid.name}. Consistency matters most today.`
        : `${kid.name} ke saath 10 minute focused revision karo. Aaj consistency sabse important hai.`,
      missionUpdates: []
    };
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
      model: "gemini-2.5-pro-preview-tts",
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
      model: 'gemini-3-pro-image-preview',
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
