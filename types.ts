export interface KidProfile {
  id: string;
  name: string;
  grade: string;
  subject: string; // Default subject for the demo
  avatarColor: string;
  schoolType: string; // e.g., 'English Medium'
}

export type SessionStatus = 'idle' | 'analyzing' | 'generating' | 'active';

// Step 1: Vision Analysis Result
export interface HomeworkAnalysis {
  subject: string;
  chapter: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Step 2: The Guided Session for the Parent
export interface GuidedSession {
  parentContextOriginal: string; // Hinglish (Hindi in English script)
  parentContextEnglish: string;  // Simple English translation
  speakScript: string;           // What to say to the child
  visualCuePrompt: string;       // Description for image gen (Tier 2)
  finalAnswer: string;           // The solution
}
