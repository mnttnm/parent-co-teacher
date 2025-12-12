
import { KidProfile, HomeworkAnalysis, GuidedSession, ChapterGuide } from './types';

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
  difficulty: "medium",
  detectedContent: {
    hasChapterContent: true,
    hasHomeworkQuestions: true
  }
};

export const MOCK_SESSION: GuidedSession = {
  parentContextOriginal: "Yeh exercises 'A Pact with the Sun' chapter se hain. Isme mainly Saeeda ki maa ki bimari aur suraj ke saath unke vaade (pact) ke baare mein sawaal hain.",
  parentContextEnglish: "These exercises are from 'A Pact with the Sun'. They focus on Saeeda's mother's illness and the agreement with the sun.",
  speakScript: "Chalo Riya, ab hum homework questions solve karte hain. Dhyan se padhna!",
  visualCuePrompt: "Sun rays entering a dark room through a window",
  vocabularyHelp: [
    { word: "Pact", meaning: "Samjhauta / Wada", pronunciation: "Pakt" },
    { word: "Ailing", meaning: "Bimar", pronunciation: "Ai-ling" }
  ],
  guidedQuestions: [
    "Story mein kaun bimar tha?",
    "Suraj ne kya promise kiya?"
  ],
  questionsList: [
    {
      id: 1,
      text: "What did the doctors advise Saeeda's mother?",
      type: "subjective",
      answer: "The doctors advised her to sit in the sun and breathe fresh air.",
      explanation: "Doctors ne kaha ki dhoop (sun) mein baitho aur taazi hawa lo."
    },
    {
      id: 2,
      text: "Why did Saeeda make a pact with the sun?",
      type: "subjective",
      answer: "To bring warmth and light for her sick mother.",
      explanation: "Apni bimar maa ke liye garmi aur roshni lane ke liye."
    },
    {
      id: 3,
      text: "What happened to the sunrays the next day?",
      type: "mcq",
      options: ["They refused to come", "They came down", "They stayed in the clouds"],
      answer: "They came down",
      explanation: "Woh neeche aaye, badalon ko cheer kar."
    }
  ]
};

export const MOCK_CHAPTER_GUIDE: ChapterGuide = {
  topic: "A Pact With The Sun",
  summary: "A story about a daughter's love for her sick mother.",
  subChapters: [
    {
      id: 1,
      title: "The Sick Mother",
      originalText: "Saeeda's mother had been ailing for a long time - fever, cough, body-ache... She was denied healthy food, sunshine, and fresh air.",
      parentExplanation: "Saeeda's mom is very sick. The old doctors told her NOT to go in the sun, which was wrong.",
      teachingGuide: "Explain that sometimes we need nature (sun/air) to get better, not just medicine.",
      simplifiedEnglish: "Saeeda's mommy was sick for many days. She stayed in a dark room.",
      kidExplanation: "Imagine if your mom had a fever and stayed in a dark room all day. Sad, right? That is Saeeda's mom."
    },
    {
      id: 2,
      title: "The Bargain with Sunrays",
      originalText: "Saeeda made a pact with sunrays to come the next morning.",
      parentExplanation: "Saeeda talks to the sunrays like friends. She asks them to help her mom.",
      teachingGuide: "Ask Riya if she talks to nature (trees, birds, sun).",
      simplifiedEnglish: "Saeeda asked the Sun: 'Please come tomorrow to help my mommy!'",
      kidExplanation: "Saeeda told the sun: 'Please come tomorrow with heat so my mom gets better! Don't take a holiday!'"
    }
  ]
};
