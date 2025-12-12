
import React, { useState, useEffect } from 'react';
import { KidSelector } from './components/KidSelector';
import { ScanButton } from './components/ScanButton';
import { AudioPlayer } from './components/AudioPlayer';
import { VisualCue } from './components/VisualCue';
import { WeaknessTracker } from './components/WeaknessTracker';
import { KIDS } from './constants';
import { KidProfile, HomeworkAnalysis, GuidedSession, ChapterGuide, HistoryItem } from './types';
import { analyzeHomeworkImage, generateParentGuide, generateChapterGuide } from './services/geminiService';
import { saveSession, getHistory } from './services/storageService';

// Updated type to include 'choice' and split active states
type AppStatus = 'idle' | 'scanning' | 'analyzing' | 'choice' | 'generating' | 'active_homework' | 'active_chapter';

const App: React.FC = () => {
  // --- State ---
  const [activeKid, setActiveKid] = useState<KidProfile>(KIDS[0]);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  
  // Data State
  const [analysis, setAnalysis] = useState<HomeworkAnalysis | null>(null);
  
  // Homework Mode State
  const [guide, setGuide] = useState<GuidedSession | null>(null);
  
  // Chapter Mode State
  const [chapterGuide, setChapterGuide] = useState<ChapterGuide | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  
  // UI State
  const [showEnglishContext, setShowEnglishContext] = useState(false);
  const [weaknessStats, setWeaknessStats] = useState<Record<string, number>>({});
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- Effects ---
  useEffect(() => {
    // Load history asynchronously
    const loadHistory = async () => {
      const items = await getHistory();
      setHistory(items);
    };
    loadHistory();
  }, []);

  // --- Handlers ---

  const handleKidSwitch = (kid: KidProfile) => {
    setActiveKid(kid);
    setStatus('idle');
    setScannedImages([]);
    setAnalysis(null);
    setGuide(null);
    setChapterGuide(null);
    setCurrentChunkIndex(0);
    setShowEnglishContext(false);
    setExpandedQuestionId(null);
  };

  const handleImageSelected = (base64Image: string) => {
    setScannedImages(prev => [...prev, base64Image]);
    setStatus('scanning');
  };

  const removeImage = (index: number) => {
    setScannedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setStatus('idle');
      return updated;
    });
  };

  const restoreSession = (item: HistoryItem) => {
    setAnalysis(item.analysis);
    const kid = KIDS.find(k => k.id === item.kidId) || KIDS[0];
    setActiveKid(kid);
    
    // Restore images if available so user can refer to them or rescan
    if (item.images && item.images.length > 0) {
      setScannedImages(item.images);
    }
    
    if (item.type === 'chapter') {
      setChapterGuide(item.data as ChapterGuide);
      setStatus('active_chapter');
      setCurrentChunkIndex(0);
    } else {
      setGuide(item.data as GuidedSession);
      setStatus('active_homework');
    }
  };

  const startAnalysis = async () => {
    if (scannedImages.length === 0) return;

    setStatus('analyzing');
    
    // Step 1: Vision Analysis
    const analysisResult = await analyzeHomeworkImage(scannedImages);
    setAnalysis(analysisResult);
    
    // Logic: Determine Next Step based on detection
    const { hasChapterContent, hasHomeworkQuestions } = analysisResult.detectedContent;

    if (hasChapterContent && hasHomeworkQuestions) {
      setStatus('choice');
    } else if (hasChapterContent) {
      startChapterMode(analysisResult);
    } else {
      startHomeworkMode(analysisResult);
    }
  };

  const startHomeworkMode = async (analysisData: HomeworkAnalysis) => {
    setStatus('generating');
    // FIXED: Now passing scannedImages to generateParentGuide
    const guideResult = await generateParentGuide(scannedImages, analysisData, activeKid);
    setGuide(guideResult);
    
    // Save to History (Async with IDB)
    await saveSession(activeKid.id, analysisData, 'homework', guideResult, scannedImages);
    const updatedHistory = await getHistory();
    setHistory(updatedHistory);
    
    setStatus('active_homework');
  };

  const startChapterMode = async (analysisData: HomeworkAnalysis) => {
    setStatus('generating');
    const chapterResult = await generateChapterGuide(scannedImages, analysisData, activeKid);
    setChapterGuide(chapterResult);
    setCurrentChunkIndex(0);

    // Save to History (Async with IDB)
    await saveSession(activeKid.id, analysisData, 'chapter', chapterResult, scannedImages);
    const updatedHistory = await getHistory();
    setHistory(updatedHistory);

    setStatus('active_chapter');
  };

  const handleReset = () => {
    setStatus('idle');
    setScannedImages([]);
    setAnalysis(null);
    setGuide(null);
    setChapterGuide(null);
    setCurrentChunkIndex(0);
    setShowEnglishContext(false);
    setExpandedQuestionId(null);
  };

  const handleWeaknessFeedback = (tags: string[]) => {
    setWeaknessStats(prev => {
      const next = { ...prev };
      tags.forEach(tag => {
        next[tag] = (next[tag] || 0) + 1;
      });
      return next;
    });
  };

  // --- Render Helpers ---

  const renderChoiceScreen = () => {
    if (!analysis) return null;
    return (
      <div className="px-6 py-10 animate-fade-in flex flex-col justify-center min-h-[60vh]">
         <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full mb-3 text-sm">
              {analysis.subject} • {analysis.chapter}
            </span>
            <h2 className="text-2xl font-bold text-gray-900">What do you want to do?</h2>
            <p className="text-gray-500 mt-2">I see both the story and questions.</p>
         </div>

         <div className="space-y-4">
           <button 
             onClick={() => startChapterMode(analysis)}
             className="w-full bg-white border-2 border-indigo-100 p-5 rounded-2xl flex items-center shadow-sm hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
           >
             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
               📖
             </div>
             <div className="ml-4">
               <h3 className="text-lg font-bold text-gray-900">Teach the Chapter</h3>
               <p className="text-sm text-gray-500">Break it down into small parts</p>
             </div>
           </button>

           <button 
             onClick={() => startHomeworkMode(analysis)}
             className="w-full bg-white border-2 border-pink-100 p-5 rounded-2xl flex items-center shadow-sm hover:border-pink-500 hover:bg-pink-50 transition-all text-left group"
           >
             <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
               ✏️
             </div>
             <div className="ml-4">
               <h3 className="text-lg font-bold text-gray-900">Help with Homework</h3>
               <p className="text-sm text-gray-500">Solve the specific questions</p>
             </div>
           </button>

           <button 
             onClick={() => startChapterMode(analysis)}
             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-2xl flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
           >
             <span className="font-bold text-lg">Do Both (Start with Chapter)</span>
           </button>
         </div>
      </div>
    );
  };

  const renderActiveChapterSession = () => {
    if (!chapterGuide || !analysis) return null;
    const chunk = chapterGuide.subChapters[currentChunkIndex];
    const isLast = currentChunkIndex === chapterGuide.subChapters.length - 1;

    return (
      <div className="pb-32 px-4 animate-fade-in space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4 flex justify-between items-center">
           <div>
             <h2 className="text-lg font-bold text-gray-900">{chapterGuide.topic}</h2>
             <p className="text-xs text-gray-500 uppercase tracking-wide">
               Part {currentChunkIndex + 1} of {chapterGuide.subChapters.length}: {chunk.title}
             </p>
           </div>
           <button onClick={handleReset} className="text-gray-400 p-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* 1. Original Content */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase">1. From the Book</h3>
             <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Read this to {activeKid.name}</span>
          </div>
          <p className="text-gray-900 italic font-serif leading-relaxed text-lg mb-4">"{chunk.originalText}"</p>
          <AudioPlayer text={chunk.originalText} label="Listen to Pronunciation" className="text-sm w-full justify-center bg-white border-gray-300 shadow-sm" />
        </div>

        {/* 2. Parent Friendly Explanation */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-5 shadow-sm">
           <h3 className="flex items-center text-orange-800 font-bold mb-2">
             <span className="mr-2">🧠</span> For You (Understand It)
           </h3>
           <p className="text-gray-800 mb-3">{chunk.parentExplanation}</p>
           <AudioPlayer text={chunk.parentExplanation} label="Listen (Hinglish)" className="text-xs scale-90 origin-left" />
        </div>

        {/* 3. Teaching Guide */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-5 shadow-sm">
           <h3 className="flex items-center text-blue-800 font-bold mb-2">
             <span className="mr-2">👨‍🏫</span> How to Teach {activeKid.name}
           </h3>
           <p className="text-gray-800 mb-3">{chunk.teachingGuide}</p>
           <AudioPlayer text={chunk.teachingGuide} label="Listen (Hinglish)" className="text-xs scale-90 origin-left" />
        </div>

        {/* 4. Simplified English */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
           <div className="flex items-center mb-3">
             <div className="bg-green-100 text-green-700 p-2 rounded-full mr-3">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
               </svg>
             </div>
             <div>
               <h3 className="text-green-900 font-bold text-base">Play for {activeKid.name}</h3>
               <p className="text-xs text-green-700">Simple English explanation</p>
             </div>
           </div>
           <p className="text-gray-800 mb-4 font-medium text-lg">"{chunk.simplifiedEnglish}"</p>
           <AudioPlayer text={chunk.simplifiedEnglish} label={`Play for ${activeKid.name}`} className="w-full justify-center bg-white border-green-300 text-green-700" />
        </div>

        {/* 5. Kid Facing Explanation (Hinglish Script) */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">✨</div>
           <h3 className="text-purple-800 font-bold mb-2 text-sm">5. Say to {activeKid.name} (Hinglish)</h3>
           <p className="text-gray-900 text-lg font-medium leading-relaxed mb-4">"{chunk.kidExplanation}"</p>
           <AudioPlayer text={chunk.kidExplanation} label="Play Script" className="w-full justify-center" />
        </div>

        {/* Navigation */}
        <div className="pt-4">
          {isLast ? (
             <button 
               onClick={() => startHomeworkMode(analysis)}
               className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
             >
               <span>✨ Chapter Done! Go to Questions</span>
             </button>
          ) : (
             <button 
               onClick={() => {
                 setCurrentChunkIndex(prev => prev + 1);
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
             >
               Next Chunk (Part {currentChunkIndex + 2}) →
             </button>
          )}
        </div>
      </div>
    );
  };

  const renderActiveHomeworkSession = () => {
    if (!analysis || !guide) return null;

    const contextText = showEnglishContext ? guide.parentContextEnglish : guide.parentContextOriginal;

    return (
      <div className="pb-32 px-4 animate-fade-in space-y-6">
        {/* Header Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
          <div className="flex justify-between items-start mb-3">
             <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                {analysis.subject} • {analysis.chapter || 'Topic'}
             </span>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Homework & Questions</h2>
        </div>

        {/* Card 1: Parent Context */}
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
          <p className="text-gray-800 leading-relaxed text-lg mb-4">
            {contextText}
          </p>
          <AudioPlayer text={contextText} label="Listen Explanation" className="w-full justify-center" />
        </div>

        {/* NEW: Vocabulary Card */}
        {guide.vocabularyHelp && guide.vocabularyHelp.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-yellow-800 font-bold mb-3 flex items-center">
              <span className="mr-2">📖</span> Word Help
            </h3>
            <div className="space-y-3">
              {guide.vocabularyHelp.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-yellow-100">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{item.word}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{item.pronunciation}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Card 2: Questions List */}
        {guide.questionsList && guide.questionsList.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide ml-1">Homework Questions</h3>
            {guide.questionsList.map((q) => {
              const isExpanded = expandedQuestionId === q.id;
              return (
                <div key={q.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                       <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs mr-3 flex-shrink-0">
                         {q.id}
                       </span>
                       <div className="flex-1">
                         <p className="font-bold text-gray-900 text-lg mb-2">{q.text}</p>
                         {q.options && (
                           <ul className="space-y-1 mb-3">
                             {q.options.map((opt, i) => (
                               <li key={i} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">{opt}</li>
                             ))}
                           </ul>
                         )}
                         <AudioPlayer text={q.text} label="Read Question" className="text-xs scale-90 origin-left" />
                       </div>
                    </div>
                  </div>
                  
                  {/* Answer Section (Toggle) */}
                  <div className={`bg-gray-50 border-t border-gray-100 transition-all ${isExpanded ? 'p-4' : 'px-4 py-2'}`}>
                    <button 
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="w-full flex justify-between items-center text-sm font-bold text-indigo-600"
                    >
                      <span>{isExpanded ? 'Hide Answer' : 'Show Answer & Help'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-3 space-y-3 animate-fade-in">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <p className="text-xs text-green-700 font-bold uppercase mb-1">Correct Answer</p>
                          <p className="text-green-900 font-medium">{q.answer}</p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                          <p className="text-xs text-indigo-700 font-bold uppercase mb-1">Explain to {activeKid.name} (Hinglish)</p>
                          <p className="text-indigo-900 text-sm">{q.explanation}</p>
                          <AudioPlayer text={q.explanation} label="Listen" className="text-xs scale-90 origin-left mt-2" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback for cases without specific questions list */
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
             <h3 className="text-green-800 font-bold mb-2 text-sm uppercase tracking-wide">
               Concept / Answer
             </h3>
             <p className="text-gray-800">
               {guide.finalAnswer || "No specific questions identified. Please rely on the context above."}
             </p>
          </div>
        )}

        {/* Card 3: Speak Script */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-5 shadow-sm mt-4">
          <h3 className="flex items-center text-blue-800 font-bold mb-2">
            <span className="mr-2">🗣️</span> Start by saying (Hinglish)
          </h3>
          <p className="text-lg text-gray-900 font-medium leading-relaxed italic mb-4">
            "{guide.speakScript}"
          </p>
          <AudioPlayer text={guide.speakScript} label="Play Script" className="w-full justify-center" />
        </div>

        {/* Tier 2: Visual Cue */}
        {guide.visualCuePrompt && (
          <VisualCue prompt={guide.visualCuePrompt} />
        )}

        {/* Tier 2: Weakness Tracking */}
        <WeaknessTracker onFeedback={handleWeaknessFeedback} />
      </div>
    );
  };

  const renderLoadingState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] px-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {status === 'analyzing' ? `Analyzing content...` : 'Preparing your guide...'}
        </h2>
        <p className="text-gray-500">
          We are analyzing the page and creating simple steps for you.
        </p>
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="px-6 py-10 text-center pb-32">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to help {activeKid.name}?
          </h2>
          <p className="text-gray-500">
            Scan the <strong>Chapter</strong> or <strong>Homework</strong>. We'll help you teach both!
          </p>
        </div>

        {/* Recent Sessions List */}
        {history.length > 0 && (
          <div className="mt-8 text-left">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent Sessions</h3>
              <span className="text-xs text-indigo-600 font-medium">Offline Available</span>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => restoreSession(item)}
                  className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 ${
                    item.type === 'chapter' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {item.type === 'chapter' ? '📖' : '✏️'}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 truncate">{item.topic}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.subject}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tier 2: Learning Stats Mini-Dashboard */}
        {Object.keys(weaknessStats).length > 0 && (
           <div className="bg-gray-100 rounded-2xl p-4 text-left mt-6">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Today's Focus Areas</h3>
             <div className="flex gap-2 flex-wrap">
               {Object.entries(weaknessStats).map(([key, count]) => (
                 <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                   {key === 'vocab' ? 'Hard Words' : key === 'concept' ? 'Concepts' : 'Focus'}
                   <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 rounded-full">{count}</span>
                 </span>
               ))}
             </div>
           </div>
        )}
      </div>
    );
  };

  // New Staging Area for multiple images
  const renderScanningState = () => {
    return (
      <div className="px-4 py-6 pb-40 text-center">
         <h2 className="text-xl font-bold text-gray-900 mb-4">Scanned Pages ({scannedImages.length})</h2>
         <div className="grid grid-cols-2 gap-4 mb-6">
           {scannedImages.map((img, idx) => (
             <div key={idx} className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-[3/4] group">
               <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
               <div className="absolute inset-0 bg-black/10"></div>
               <button 
                 onClick={() => removeImage(idx)} 
                 className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md active:scale-95"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
           ))}
         </div>
         
         {/* Floating Action to Start Analysis */}
         <div className="fixed bottom-24 left-6 right-6 z-40">
           <button 
             onClick={startAnalysis} 
             className="w-full bg-indigo-600 text-white font-bold py-4 rounded-full shadow-xl text-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
           >
             <span>✨ Start Teaching ({scannedImages.length})</span>
           </button>
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
        {status === 'scanning' && renderScanningState()}
        {(status === 'analyzing' || status === 'generating') && renderLoadingState()}
        {status === 'choice' && renderChoiceScreen()}
        {status === 'active_chapter' && renderActiveChapterSession()}
        {status === 'active_homework' && renderActiveHomeworkSession()}
      </main>

      {/* Persistent Action Button */}
      {(status === 'idle' || status === 'active_homework' || status === 'scanning') && (
        <ScanButton 
          onImageSelected={handleImageSelected} 
          isLoading={false}
          label={status === 'scanning' ? "Scan Another Page" : undefined}
        />
      )}
    </div>
  );
};

export default App;
