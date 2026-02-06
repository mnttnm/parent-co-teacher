
import { GoogleGenAI, Type, Modality } from "@google/genai";
import {
  HomeworkAnalysis,
  GuidedSession,
  KidProfile,
  ChapterGuide,
  RevisionQuiz,
  MicroLesson,
  HistoryItem,
  MarathonPlan,
  MarathonMission,
  MarathonCheckIn,
  MarathonMissionUpdate
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

const normalizeMission = (mission: MarathonDraftMission, index: number): MarathonMission => {
  const missionId = `m-${index + 1}`;
  return {
    id: missionId,
    dayNumber: mission.dayNumber || index + 1,
    focusSkill: mission.focusSkill || 'Comprehension',
    objective: mission.objective || 'Build confidence through one focused practice loop.',
    parentAction: mission.parentAction || 'Read the concept aloud and ask one open-ended question.',
    childTask: mission.childTask || 'Explain the concept in simple words with one example.',
    evidenceToCapture: mission.evidenceToCapture || 'One spoken response from the child and one written sentence.',
    fallbackPlan: mission.fallbackPlan || 'Retry with easier examples and a 2-minute recap.',
    estimatedMinutes: Math.max(5, Math.min(25, mission.estimatedMinutes || 12)),
    status: 'pending'
  };
};

const ensureDraftQuality = (draft: MarathonDraftPlan): MarathonDraftPlan => {
  const missionPool = draft.missions || [];
  const filled = missionPool.length >= 5 ? missionPool : [
    ...missionPool,
    ...Array.from({ length: 5 - missionPool.length }).map((_, idx) => ({
      dayNumber: missionPool.length + idx + 1,
      focusSkill: 'Comprehension',
      objective: 'Practice one concept from today in a parent-guided conversation.',
      parentAction: 'Use one real-life example and ask the child to restate the answer.',
      childTask: 'Solve one question and explain the reasoning aloud.',
      evidenceToCapture: 'Record one correct explanation and one corrected mistake.',
      fallbackPlan: 'Switch to a simpler question and do a guided retry.',
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
 * Tier 3: Revision Mode (Quiz Generation)
 * Generates MCQs and Flashcards based on a topic string (from history).
 */
export const generateRevisionQuiz = async (
  topic: string,
  kid: KidProfile
): Promise<RevisionQuiz> => {
  try {
    const prompt = `
      Create a revision quiz for the topic: "${topic}".
      Child: ${kid.name}, ${kid.grade}.
      
      Requirements:
      1. Generate 2 Multiple Choice Questions (MCQ).
      2. Generate 1 Flashcard Question (simple concept recall).
      3. Language: English for the question, but Provide **Hinglish** explanations for the parent to help.
      
      Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    console.error("Quiz Gen Error", error);
    throw error;
  }
};

/**
 * Tier 3: Micro-Lesson (Weakness Fixer)
 * Generates a 3-step quick fix for a specific problem area.
 */
export const generateMicroLesson = async (
  topic: string,
  weakness: string,
  kid: KidProfile
): Promise<MicroLesson> => {
  try {
    const prompt = `
      Create a "5-minute Micro-Lesson" to fix a weakness.
      Topic: "${topic}"
      Weakness Tag: "${weakness}" (e.g., Vocabulary, Concept).
      Child: ${kid.name}, ${kid.grade}.
      
      Output 3 simple steps for the parent to teach this concept effectively in Hinglish.
      Include a visual prompt suggestion for each step if needed.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    console.error("Micro Lesson Error", error);
    throw error;
  }
};

export const generateMarathonPlan = async (
  kid: KidProfile,
  history: HistoryItem[],
  weaknessStats: Record<string, number>
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
  `;

  try {
    const draftResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      planTitle: '7-Day Learning Marathon',
      strategy: 'Short, evidence-based daily loops for parent-guided practice.',
      durationDays: 7,
      missions: []
    };
    const draft = ensureDraftQuality(draftParsed);
    const initialEvaluation = scoreDraft(draft, signals.topWeaknesses);

    const refinePrompt = `
      Improve this plan using the critique below.
      Critique: ${initialEvaluation.critique}

      Original plan:
      ${JSON.stringify(draft, null, 2)}

      Return a stronger plan that fixes missing coverage and keeps mission actions concrete.
    `;

    const refinedResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    const finalDraft = ensureDraftQuality(refinedParsed || draft);
    const finalEvaluation = scoreDraft(finalDraft, signals.topWeaknesses);
    const missions = finalDraft.missions.map((mission, index) => normalizeMission(mission, index));

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
      objective: `Reinforce ${signals.recentTopics[0] || 'current chapter'} using one short guided loop.`,
      parentAction: 'Read one question aloud, pause, and ask the child to explain in their own words.',
      childTask: 'Answer one question and give one real-life example.',
      evidenceToCapture: '1 spoken explanation + 1 written sentence.',
      fallbackPlan: 'If stuck, simplify language and retry with a worked example.',
      estimatedMinutes: 12,
      status: 'pending'
    }));

    return {
      id: `plan-${now}`,
      kidId: kid.id,
      createdAt: now,
      updatedAt: now,
      planTitle: 'Fallback Learning Marathon',
      strategy: 'Steady daily repetition with evidence capture and simpler retries.',
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
  weaknessStats: Record<string, number>
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
      model: 'gemini-2.5-flash',
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
        3) motivationScript in Hinglish
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
      summary: `${completed}/${plan.missions.length} missions complete. Continue with the next pending mission.`,
      nextAction: pending[0] ? `Do mission ${pending[0].dayNumber}: ${pending[0].objective}` : 'Plan is complete.',
      motivationScript: `${kid.name} ke saath 10 minute ka focused revision karo. Aaj consistency sabse important hai.`,
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
