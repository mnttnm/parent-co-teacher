
export interface KidProfile {
  id: string;
  name: string;
  grade: string;
  subject: string; // Default subject for the demo
  avatarColor: string;
  schoolType: string; // e.g., 'English Medium'
}

export type SessionStatus = 'idle' | 'analyzing' | 'choice' | 'generating' | 'active_homework' | 'active_chapter';

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
  parentContextOriginal: string; // Hinglish explanation of the overall topic
  parentContextEnglish: string;  
  speakScript: string;           // Intro script
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
  parentExplanation: string;     // 2. Parent-Friendly Explanation (Simple English)
  teachingGuide: string;         // 3. How to Teach Riya (Guide for parent)
  simplifiedEnglish: string;     // 4. Super-Simplified English Version
  kidExplanation: string;        // 5. Kid-Facing Explanation (English)
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
  images?: string[]; // Stored base64 images for offline access
}
