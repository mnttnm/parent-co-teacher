
import React, { useState } from 'react';
import { RevisionQuiz } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface RevisionSessionProps {
  quiz: RevisionQuiz;
  onClose: () => void;
}

export const RevisionSession: React.FC<RevisionSessionProps> = ({ quiz, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;

  const handleNext = () => {
    setShowAnswer(false);
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1);
    setShowAnswer(true);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="text-white opacity-80 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-bold uppercase tracking-wider text-xs bg-white/20 px-3 py-1 rounded-full">
            Revision Mode
          </span>
        </div>
        <h2 className="text-2xl font-bold">{quiz.topic}</h2>
        <div className="flex space-x-2 mt-4">
          {quiz.questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 flex-1 rounded-full ${
                idx === currentIndex ? 'bg-white' : idx < currentIndex ? 'bg-white/60' : 'bg-black/20'
              }`} 
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
           <div className="flex justify-between mb-4">
             <span className="text-sm font-bold text-gray-400">Question {currentIndex + 1}</span>
             <span className="text-sm font-bold text-pink-500 uppercase">{question.type}</span>
           </div>
           
           <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
             {question.question}
           </h3>
           <AudioPlayer text={question.question} label="Read Question" className="text-xs mb-6 scale-90 origin-left" />

           {/* MCQ Options */}
           {question.type === 'mcq' && question.options && (
             <div className="space-y-3">
               {question.options.map((opt, idx) => (
                 <button
                   key={idx}
                   disabled={showAnswer}
                   onClick={() => handleAnswer(opt === question.correctAnswer)}
                   className={`w-full p-4 rounded-xl text-left border-2 transition-all font-medium ${
                     showAnswer 
                       ? opt === question.correctAnswer 
                         ? 'bg-green-100 border-green-500 text-green-800'
                         : 'bg-gray-50 border-gray-100 text-gray-400'
                       : 'bg-white border-gray-200 hover:border-pink-300 active:bg-pink-50 text-gray-700'
                   }`}
                 >
                   {opt}
                 </button>
               ))}
             </div>
           )}

           {/* Flashcard Reveal */}
           {question.type === 'flashcard' && !showAnswer && (
              <button 
                onClick={() => setShowAnswer(true)}
                className="w-full py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
              >
                Tap to Flip & Reveal Answer
              </button>
           )}
        </div>

        {/* Answer Reveal Section */}
        {showAnswer && (
          <div className="animate-fade-in bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl p-5 mb-20">
            <h4 className="font-bold text-indigo-900 mb-2">Answer & Explanation</h4>
            <p className="text-gray-800 mb-2 font-medium">{question.correctAnswer}</p>
            <p className="text-sm text-gray-600 mb-3">{question.explanation}</p>
            <AudioPlayer text={question.explanation} label="Explain in Hinglish" className="text-xs scale-90 origin-left" />
            
            <button 
              onClick={handleNext}
              className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{isLast ? 'Finish Quiz' : 'Next Question ->'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
