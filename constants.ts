import { KidProfile, HomeworkAnalysis, GuidedSession } from './types';

// Demo Profiles
export const KIDS: KidProfile[] = [
  {
    id: 'kid-1',
    name: 'Riya',
    grade: 'Class 4',
    subject: 'English',
    avatarColor: 'bg-pink-500',
    schoolType: 'English Medium',
  },
  {
    id: 'kid-2',
    name: 'Aarav',
    grade: 'Class 8',
    subject: 'Chemistry',
    avatarColor: 'bg-blue-500',
    schoolType: 'CBSE',
  },
];

// Fallback data for Demo Stability (if API fails or for fast demos)
export const MOCK_ANALYSIS: HomeworkAnalysis = {
  subject: "English",
  chapter: "A Pact With The Sun",
  question: "What did Saeeda tell the sunrays to do?",
  difficulty: "medium"
};

export const MOCK_SESSION: GuidedSession = {
  parentContextOriginal: "Yeh kahani ek bimar maa aur unki beti ke vishwas ke baare mein hai. Sawaal yeh pooch raha hai ki ladki ne suraj se kya karne ko kaha taaki uski maa theek ho sake.",
  parentContextEnglish: "This story is about a sick mother and her daughter's faith. The question asks why the girl wanted the sun to come out to help cure her mother.",
  speakScript: "Beta, ask yourself: Why was the mother sad? What did Riya want the sun to bring for her mother?",
  visualCuePrompt: "Sun rays entering a dark room through a window",
  finalAnswer: "Saeeda asked the sunrays to come the next day with lots of warmth and brightness to help cure her mother."
};
