import React, { useState } from 'react';
import { KidSelector } from './components/KidSelector';
import { ScanButton } from './components/ScanButton';
import { KIDS } from './constants';
import { KidProfile, SessionStatus, HomeworkAnalysis, GuidedSession } from './types';
import { analyzeHomeworkImage, generateParentGuide } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [activeKid, setActiveKid] = useState<KidProfile>(KIDS[0]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  
  // Data State
  const [analysis, setAnalysis] = useState<HomeworkAnalysis | null>(null);
  const [guide, setGuide] = useState<GuidedSession | null>(null);
  
  // UI State
  const [showEnglishContext, setShowEnglishContext] = useState(false);

  // --- Handlers ---

  const handleKidSwitch = (kid: KidProfile) => {
    setActiveKid(kid);
    // Reset session when switching kids
    setStatus('idle');
    setAnalysis(null);
    setGuide(null);
    setShowEnglishContext(false);
  };

  const handleImageSelected = async (base64Image: string) => {
    setStatus('analyzing');
    
    // Step 1: Vision Analysis
    const analysisResult = await analyzeHomeworkImage(base64Image);
    setAnalysis(analysisResult);
    
    setStatus('generating');

    // Step 2: Generate Teaching Guide
    const guideResult = await generateParentGuide(analysisResult, activeKid);
    setGuide(guideResult);
    
    setStatus('active');
  };

  const handleReset = () => {
    setStatus('idle');
    setAnalysis(null);
    setGuide(null);
    setShowEnglishContext(false);
  };

  // --- Render Helpers ---

  const renderActiveSession = () => {
    if (!analysis || !guide) return null;

    return (
      <div className="pb-24 px-4 animate-fade-in space-y-6">
        {/* Header Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded mb-2">
                {analysis.subject}
              </span>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {analysis.chapter || 'Topic Analysis'}
              </h2>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{analysis.question}</p>
            </div>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Card 1: Parent Context (The "Understand" Phase) */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="flex items-center text-orange-800 font-bold">
              <span className="mr-2">🧠</span> For You (Parent)
            </h3>
            <button 
              onClick={() => setShowEnglishContext(!showEnglishContext)}
              className="text-xs font-semibold bg-white border border-orange-200 text-orange-700 px-3 py-1 rounded-full shadow-sm hover:bg-orange-50 transition-colors"
            >
              {showEnglishContext ? 'Show Hinglish' : 'Show English'}
            </button>
          </div>
          <p className="text-gray-800 leading-relaxed text-lg">
            {showEnglishContext ? guide.parentContextEnglish : guide.parentContextOriginal}
          </p>
        </div>

        {/* Card 2: Speak Script (The "Action" Phase) */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-5 shadow-sm">
          <h3 className="flex items-center text-blue-800 font-bold mb-2">
            <span className="mr-2">🗣️</span> Say to {activeKid.name}
          </h3>
          <p className="text-lg text-gray-900 font-medium leading-relaxed italic">
            "{guide.speakScript}"
          </p>
        </div>

        {/* Card 3: Final Answer */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-green-800 font-bold mb-2 text-sm uppercase tracking-wide">
            Concept / Answer
          </h3>
          <p className="text-gray-800">
            {guide.finalAnswer}
          </p>
        </div>
        
        <div className="h-8"></div>
      </div>
    );
  };

  const renderLoadingState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] px-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {status === 'analyzing' ? `Reading ${activeKid.name}'s Homework...` : 'Preparing your guide...'}
        </h2>
        <p className="text-gray-500">
          We are analyzing the page and creating simple steps for you.
        </p>
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="px-6 py-10 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to help {activeKid.name}?
          </h2>
          <p className="text-gray-500">
            Scan any question, paragraph, or diagram from {activeKid.name}'s {activeKid.subject} book.
          </p>
        </div>
        
        {/* Mock visual element for polish */}
        <div className="opacity-50 pointer-events-none select-none">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navigation / Kid Selector */}
      <KidSelector 
        kids={KIDS} 
        activeKid={activeKid} 
        onSelect={handleKidSwitch} 
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto">
        {status === 'idle' && renderEmptyState()}
        {(status === 'analyzing' || status === 'generating') && renderLoadingState()}
        {status === 'active' && renderActiveSession()}
      </main>

      {/* Persistent Action Button */}
      {(status === 'idle' || status === 'active') && (
        <ScanButton 
          onImageSelected={handleImageSelected} 
          isLoading={false} 
        />
      )}
    </div>
  );
};

export default App;