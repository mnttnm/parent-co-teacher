
export interface KidProfile {
  id: string;
  name: string;
  grade: string;
  subject: string; // Default subject for the demo
  avatarColor: string;
  schoolType: string; // e.g., 'English Medium'
  preferredLanguage: ParentLanguage; // Parent instruction language preference
}

export type ParentLanguage = 'hinglish' | 'english';

export type SessionStatus = 'idle' | 'scanning' | 'analyzing' | 'choice' | 'generating' | 'active_homework' | 'active_chapter' | 'revision' | 'micro_lesson';

// Step 1: Vision Analysis Result
export interface HomeworkAnalysis {
  subject: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // New flags for detection
  detectedContent: {
    hasChapterContent: boolean;
    hasHomeworkQuestions: boolean;
  };
}

export interface VocabularyItem {
  word: string;
  meaning: string; // Hindi/Hinglish meaning
  pronunciation: string; // Phonetic spelling
}

export interface StoredImage {
  data: string;
  mimeType: string;
}

// Detailed Question Structure
export interface HomeworkQuestion {
  id: number;
  text: string;
  type: 'subjective' | 'mcq' | 'fill_in_blank';
  options?: string[]; // For MCQs
  answer: string;
  explanation: string; // Simple hint for the parent
}

// Existing Homework Session
export interface GuidedSession {
  parentContextOriginal: string; // Primary parent-language explanation
  parentContextEnglish: string;  // Secondary support-language explanation
  speakScript: string;           // Intro script in primary parent language
  visualCuePrompt: string;       
  vocabularyHelp: VocabularyItem[]; 
  guidedQuestions: string[];     // General check-in questions
  
  // NEW: List of specific extracted homework questions
  questionsList: HomeworkQuestion[];
  finalAnswer?: string; // Fallback for cases where structured questions aren't available
}

// New: Chapter Teaching Mode
export interface SubChapter {
  id: number;
  title: string;
  originalText: string;          // 1. Original Extracted Content
  parentExplanation: string;     // 2. Parent-friendly explanation in primary parent language
  teachingGuide: string;         // 3. How to teach (primary parent language)
  simplifiedEnglish: string;     // 4. Secondary support-language summary
  kidExplanation: string;        // 5. Kid-facing script in primary parent language
}

export interface ChapterGuide {
  topic: string;
  summary: string;
  subChapters: SubChapter[];
}

// Data Persistence Type
export interface HistoryItem {
  id: string;
  timestamp: number;
  kidId: string;
  subject: string;
  topic: string;
  type: 'chapter' | 'homework';
  analysis: HomeworkAnalysis;
  data: ChapterGuide | GuidedSession;
  images?: StoredImage[] | string[]; // Legacy string[] records are normalized at read-time
  feedbackTags?: string[]; // Tags like 'vocab', 'concept'
}

// --- Tier 3 Types ---

export interface RevisionQuiz {
  topic: string;
  questions: {
    id: number;
    question: string;
    type: 'mcq' | 'flashcard';
    options?: string[];
    correctAnswer: string;
    explanation: string; // Parent-friendly explanation in primary language
  }[];
}

export interface MicroLesson {
  title: string;
  focusArea: string; // e.g., 'Vocabulary'
  steps: {
    text: string;
    speakScript: string; // Primary parent language
    visualPrompt?: string;
  }[];
}

export type MarathonMissionStatus = 'pending' | 'done' | 'adjusted';

export interface MarathonMission {
  id: string;
  dayNumber: number;
  focusSkill: string;
  objective: string;
  parentAction: string;
  childTask: string;
  evidenceToCapture: string;
  fallbackPlan: string;
  estimatedMinutes: number;
  status: MarathonMissionStatus;
  reflectionNote?: string;
}

export interface MarathonSignalPack {
  topWeaknesses: string[];
  recentTopics: string[];
  sessionsAnalyzed: number;
}

export interface MarathonQualityReport {
  initialScore: number;
  finalScore: number;
  critique: string;
  verificationChecklist: string[];
}

export interface MarathonMissionUpdate {
  missionId: string;
  reason: string;
  updatedParentAction: string;
  updatedChildTask: string;
}

export interface MarathonCheckIn {
  timestamp: number;
  summary: string;
  nextAction: string;
  motivationScript: string;
  missionUpdates: MarathonMissionUpdate[];
}

export interface MarathonPlan {
  id: string;
  kidId: string;
  createdAt: number;
  updatedAt: number;
  planTitle: string;
  strategy: string;
  durationDays: number;
  missions: MarathonMission[];
  signals: MarathonSignalPack;
  qualityReport: MarathonQualityReport;
  checkInHistory: MarathonCheckIn[];
}
