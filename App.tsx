
import React, { useState, useEffect } from 'react';
import { BottomNavigation } from './components/BottomNavigation'; 
import { Library } from './components/Library'; 
import { AudioPlayer } from './components/AudioPlayer';
import { VisualCue } from './components/VisualCue';
import { WeaknessTracker } from './components/WeaknessTracker';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RevisionSession } from './components/RevisionSession';
import { SmartLoader } from './components/SmartLoader';
import { Confetti } from './components/Confetti';
import { ScanButton } from './components/ScanButton'; // Ensure this is imported
import { MarathonAgentPanel } from './components/MarathonAgentPanel';
import { KIDS } from './constants';
import { KidProfile, HomeworkAnalysis, GuidedSession, ChapterGuide, HistoryItem, RevisionQuiz, MicroLesson, MarathonPlan } from './types';
import {
  analyzeHomeworkImage,
  generateParentGuide,
  generateChapterGuide,
  generateRevisionQuiz,
  generateMicroLesson,
  generateMarathonPlan,
  runMarathonCheckIn
} from './services/geminiService';
import {
  saveSession,
  getHistory,
  updateSessionFeedback,
  getWeaknessStats,
  getLatestMarathonPlan,
  saveMarathonPlan,
  updateMarathonMissionStatus,
  appendMarathonCheckIn
} from './services/storageService';

type AppStatus = 'idle' | 'scanning' | 'analyzing' | 'choice' | 'generating' | 'active_homework' | 'active_chapter' | 'revision' | 'micro_lesson';
type Tab = 'home' | 'library';

const App: React.FC = () => {
  // --- State ---
  const [activeKid, setActiveKid] = useState<KidProfile>(KIDS[0]);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false); // NEW: Dropdown State
  
  // Data State
  const [analysis, setAnalysis] = useState<HomeworkAnalysis | null>(null);
  const [guide, setGuide] = useState<GuidedSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chapterGuide, setChapterGuide] = useState<ChapterGuide | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [revisionQuiz, setRevisionQuiz] = useState<RevisionQuiz | null>(null);
  const [microLesson, setMicroLesson] = useState<MicroLesson | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showEnglishContext, setShowEnglishContext] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<Record<string, number>>({});
  const [marathonPlan, setMarathonPlan] = useState<MarathonPlan | null>(null);
  const [isMarathonGenerating, setIsMarathonGenerating] = useState(false);
  const [isAgentCheckingIn, setIsAgentCheckingIn] = useState(false);

  useEffect(() => {
    refreshData();
  }, [activeKid.id]);

  const refreshData = async () => {
    const items = await getHistory();
    setHistory(items);
    const stats = await getWeaknessStats(activeKid.id);
    setDashboardStats(stats);
    const latestPlan = await getLatestMarathonPlan(activeKid.id);
    setMarathonPlan(latestPlan);
  };

  // --- Handlers ---
  const handleKidSwitch = (kid: KidProfile) => {
    setActiveKid(kid);
    setIsChildMenuOpen(false);
    resetToIdle();
  };

  const resetToIdle = () => {
    setStatus('idle');
    setScannedImages([]);
    setAnalysis(null);
    setGuide(null);
    setChapterGuide(null);
    setCurrentChunkIndex(0);
    setShowEnglishContext(false);
    setExpandedQuestionId(null);
    setRevisionQuiz(null);
    setMicroLesson(null);
    setShowConfetti(false);
  };

  const handleImageSelected = (base64Image: string) => {
    setScannedImages(prev => [...prev, base64Image]);
    setStatus('scanning');
    setActiveTab('home'); 
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
    setCurrentSessionId(item.id);
    const kid = KIDS.find(k => k.id === item.kidId) || KIDS[0];
    setActiveKid(kid);
    
    if (item.images && item.images.length > 0) setScannedImages(item.images);
    
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
    const analysisResult = await analyzeHomeworkImage(scannedImages);
    setAnalysis(analysisResult);
    
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
    const guideResult = await generateParentGuide(scannedImages, analysisData, activeKid);
    setGuide(guideResult);
    const saved = await saveSession(activeKid.id, analysisData, 'homework', guideResult, scannedImages);
    if (saved) setCurrentSessionId(saved.id);
    await refreshData();
    setStatus('active_homework');
  };

  const startChapterMode = async (analysisData: HomeworkAnalysis) => {
    setStatus('generating');
    const chapterResult = await generateChapterGuide(scannedImages, analysisData, activeKid);
    setChapterGuide(chapterResult);
    setCurrentChunkIndex(0);
    const saved = await saveSession(activeKid.id, analysisData, 'chapter', chapterResult, scannedImages);
    if (saved) setCurrentSessionId(saved.id);
    await refreshData();
    setStatus('active_chapter');
  };

  const startRevision = async (topic: string) => {
    setStatus('generating');
    try {
      const quiz = await generateRevisionQuiz(topic, activeKid);
      setRevisionQuiz(quiz);
      setStatus('revision');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const startMicroLesson = async (topic: string, weakness: string) => {
    setStatus('generating');
    try {
      const lesson = await generateMicroLesson(topic, weakness, activeKid);
      setMicroLesson(lesson);
      setStatus('micro_lesson');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const handleGenerateMarathonPlan = async () => {
    setIsMarathonGenerating(true);
    setStatus('generating');
    try {
      const kidHistory = history.filter(item => item.kidId === activeKid.id);
      const plan = await generateMarathonPlan(activeKid, kidHistory, dashboardStats);
      await saveMarathonPlan(plan);
      setMarathonPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMarathonGenerating(false);
      setStatus('idle');
      await refreshData();
    }
  };

  const handleMissionToggle = async (missionId: string, nextDone: boolean) => {
    if (!marathonPlan) return;
    const updated = await updateMarathonMissionStatus(
      marathonPlan.id,
      missionId,
      nextDone ? 'done' : 'pending'
    );

    if (updated) {
      setMarathonPlan(updated);
      const allDone = updated.missions.length > 0 && updated.missions.every(mission => mission.status === 'done');
      if (allDone) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
      }
    }
  };

  const handleAgentCheckIn = async () => {
    if (!marathonPlan) return;

    setIsAgentCheckingIn(true);
    try {
      const checkIn = await runMarathonCheckIn(marathonPlan, activeKid, dashboardStats);

      let updatedPlan: MarathonPlan = {
        ...marathonPlan,
        missions: marathonPlan.missions.map((mission) => {
          const update = checkIn.missionUpdates.find(item => item.missionId === mission.id);
          if (!update) return mission;
          return {
            ...mission,
            status: mission.status === 'done' ? 'done' : 'adjusted',
            parentAction: update.updatedParentAction,
            childTask: update.updatedChildTask
          };
        }),
        updatedAt: Date.now()
      };

      await saveMarathonPlan(updatedPlan);
      updatedPlan = (await appendMarathonCheckIn(updatedPlan.id, checkIn)) || updatedPlan;
      if (!updatedPlan.checkInHistory || updatedPlan.checkInHistory.length === 0) {
        updatedPlan = {
          ...updatedPlan,
          checkInHistory: [checkIn, ...(updatedPlan.checkInHistory || [])].slice(0, 6)
        };
        await saveMarathonPlan(updatedPlan);
      }
      setMarathonPlan(updatedPlan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAgentCheckingIn(false);
    }
  };

  const handleWeaknessFeedback = async (tags: string[]) => {
    if (currentSessionId) {
      await updateSessionFeedback(currentSessionId, tags);
      await refreshData();
    }
  };

  const handleMicroLessonComplete = () => {
    setShowConfetti(true);
    setTimeout(() => resetToIdle(), 4000);
  };
  
  const handleRevisionComplete = () => {
    setShowConfetti(true);
    setTimeout(() => resetToIdle(), 4000);
  };


  // --- Render Helpers (Revised for Compact Header & Animations) ---
  
  const renderCompactHeader = () => (
    <div className="bg-white border-b border-stone-200 pt-safe-top pb-3 px-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] sticky top-0 z-30 transition-all">
      <div className="flex justify-between items-center pt-3">
        <div>
           <h1 className="text-xl font-bold text-teal-700 tracking-tight">ParentGuide</h1>
           <p className="text-stone-400 text-[10px] uppercase tracking-widest">Co-Teacher</p>
        </div>
        
        {/* Child Switcher Pill */}
        <div className="relative">
          <button 
            onClick={() => setIsChildMenuOpen(!isChildMenuOpen)}
            className="flex items-center bg-stone-100 hover:bg-stone-200 rounded-full pl-1 pr-3 py-1 transition-all active:scale-95 border border-stone-200"
          >
             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 ${activeKid.avatarColor}`}>
                {activeKid.name[0]}
             </div>
             <span className="text-sm font-bold text-stone-700 mr-1">{activeKid.name}</span>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-stone-400 transition-transform ${isChildMenuOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
             </svg>
          </button>

          {/* Popover Menu */}
          {isChildMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsChildMenuOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 p-2 z-50 animate-scale-in origin-top-right">
                <p className="text-[10px] text-stone-400 font-bold uppercase px-2 py-1 mb-1">Select Child</p>
                {KIDS.map(kid => (
                  <button
                    key={kid.id}
                    onClick={() => handleKidSwitch(kid)}
                    className={`w-full flex items-center p-2 rounded-lg text-left mb-1 transition-colors ${kid.id === activeKid.id ? 'bg-teal-50 text-teal-800' : 'hover:bg-stone-50'}`}
                  >
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2 ${kid.avatarColor}`}>
                        {kid.name[0]}
                     </div>
                     <div>
                       <p className="text-sm font-bold">{kid.name}</p>
                       <p className="text-[10px] text-stone-500">{kid.grade}</p>
                     </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => {
    return (
      <div className="px-6 pt-8 pb-32 animate-fade-in">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-white to-stone-50 rounded-3xl p-8 shadow-sm border border-stone-100 mb-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">
            Hi Parent!
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
             Tap <span className="font-bold text-teal-700">Scan Content</span> below.<br/>
             {activeKid.name} ka lesson scan kijiye.<br/>
             Main aapko step-by-step guide karunga.
          </p>
        </div>

        <MarathonAgentPanel
          kid={activeKid}
          history={history}
          weaknessStats={dashboardStats}
          plan={marathonPlan}
          isGenerating={isMarathonGenerating}
          isCheckInRunning={isAgentCheckingIn}
          onGeneratePlan={handleGenerateMarathonPlan}
          onToggleMission={handleMissionToggle}
          onRunCheckIn={handleAgentCheckIn}
        />

        {/* Analytics */}
        <AnalyticsDashboard 
          stats={dashboardStats} 
          activeKid={activeKid}
          history={history}
          onStartRevision={startRevision}
          onStartMicroLesson={startMicroLesson}
        />

        {/* Recent Sessions List */}
        {history.length > 0 && (
          <div className="mt-8 text-left animate-slide-up delay-200">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wide">Recent Sessions</h3>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => restoreSession(item)}
                  className="w-full bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex items-center hover:bg-stone-50 transition-all active:scale-98"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 shadow-sm ${
                    item.type === 'chapter' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.type === 'chapter' ? '📖' : '✏️'}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-stone-800 truncate">{item.topic}</h4>
                    <p className="text-xs text-stone-400">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.subject}
                    </p>
                  </div>
                  <div className="text-stone-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderScanningState = () => (
    <div className="px-6 py-8 pt-12 pb-40 text-center animate-fade-in">
       <h2 className="text-xl font-bold text-stone-900 mb-4 animate-slide-up">Scanned Pages ({scannedImages.length})</h2>
       <div className="grid grid-cols-2 gap-4 mb-6 animate-slide-up delay-100">
         {scannedImages.map((img, idx) => (
           <div key={idx} className="relative rounded-xl overflow-hidden shadow-sm border border-stone-200 aspect-[3/4] group">
             <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
             <div className="absolute inset-0 bg-black/10"></div>
             <button 
               onClick={() => removeImage(idx)} 
               className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md active:scale-95"
             >
               ✕
             </button>
           </div>
         ))}
       </div>
       <div className="fixed bottom-28 left-6 right-6 z-40 animate-slide-up delay-200">
         <button 
           onClick={startAnalysis} 
           className="w-full bg-teal-600 text-white font-bold py-4 rounded-full shadow-xl shadow-teal-200 text-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
         >
           <span>✨ Start Teaching ({scannedImages.length})</span>
         </button>
       </div>
    </div>
  );
  
  const renderChoiceScreen = () => {
    if (!analysis) return null;
    return (
      <div className="px-6 py-10 animate-fade-in flex flex-col justify-center min-h-[60vh]">
         <div className="text-center mb-8 animate-slide-up">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 font-bold rounded-full mb-3 text-xs border border-teal-100">
              {analysis.subject} • {analysis.chapter}
            </span>
            <h2 className="text-2xl font-bold text-stone-900">Content Found!</h2>
            <p className="text-stone-500 mt-2">How do you want to teach this?</p>
         </div>

         <div className="space-y-4 animate-slide-up delay-100">
           <button onClick={() => startChapterMode(analysis)} className="w-full bg-white border-2 border-teal-50 p-5 rounded-2xl flex items-center shadow-sm hover:border-teal-500 hover:bg-teal-50 transition-all text-left group active:scale-95">
             <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl">📖</div>
             <div className="ml-4">
               <h3 className="text-lg font-bold text-stone-900">Explain the Story</h3>
               <p className="text-sm text-stone-500">Break down the chapter</p>
             </div>
           </button>

           <button onClick={() => startHomeworkMode(analysis)} className="w-full bg-white border-2 border-amber-50 p-5 rounded-2xl flex items-center shadow-sm hover:border-amber-500 hover:bg-amber-50 transition-all text-left group active:scale-95">
             <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl">✏️</div>
             <div className="ml-4">
               <h3 className="text-lg font-bold text-stone-900">Solve Questions</h3>
               <p className="text-sm text-stone-500">Get answers & hints</p>
             </div>
           </button>
         </div>
      </div>
    );
  };
  
  const renderActiveChapterSession = () => {
     if (!chapterGuide) return null;
     const chunk = chapterGuide.subChapters[currentChunkIndex];
     return (
        <div className="pb-32 px-4 animate-fade-in space-y-6 pt-6">
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-stone-100 flex justify-between items-center sticky top-20 z-20 animate-slide-up">
              <div><h2 className="text-lg font-bold text-stone-900">{chapterGuide.topic}</h2><p className="text-xs text-stone-400 uppercase">Part {currentChunkIndex + 1}/{chapterGuide.subChapters.length}</p></div>
              <button onClick={resetToIdle} className="text-stone-400 p-2 bg-stone-50 rounded-full">✕</button>
            </div>
            
            <div className="space-y-6 animate-slide-up delay-100">
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                 <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Book Text</h3>
                 <p className="text-stone-800 italic font-serif leading-relaxed text-lg mb-4">"{chunk.originalText}"</p>
                 <AudioPlayer text={chunk.originalText} label="Read Aloud" className="text-sm w-full justify-center bg-white" />
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
                 <h3 className="flex items-center text-amber-800 font-bold mb-2">🧠 Understand It</h3>
                 <p className="text-stone-800 mb-3">{chunk.parentExplanation}</p>
                 <AudioPlayer text={chunk.parentExplanation} label="Listen (Hinglish)" className="scale-90 origin-left" />
              </div>
              <div className="bg-teal-50 border-l-4 border-teal-500 rounded-r-xl p-5 shadow-sm">
                 <h3 className="flex items-center text-teal-800 font-bold mb-2">🗣️ Say to {activeKid.name}</h3>
                 <p className="text-lg text-stone-900 font-medium leading-relaxed mb-4">"{chunk.kidExplanation}"</p>
                 <AudioPlayer text={chunk.kidExplanation} label="Play Script" className="w-full justify-center" />
              </div>
            </div>
            
            <div className="pt-4 animate-slide-up delay-200">
                {currentChunkIndex < chapterGuide.subChapters.length - 1 ? (
                    <button onClick={() => { setCurrentChunkIndex(p => p + 1); window.scrollTo({top:0, behavior:'smooth'}); }} className="w-full bg-white border-2 border-teal-600 text-teal-600 py-4 rounded-xl font-bold active:bg-teal-50">Next Part →</button>
                ) : (
                    <button onClick={() => startHomeworkMode(analysis!)} className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 active:scale-98">Go to Questions ✨</button>
                )}
            </div>
        </div>
     );
  };

  const renderActiveHomeworkSession = () => {
    if (!guide) return null;
    const contextText = showEnglishContext ? guide.parentContextEnglish : guide.parentContextOriginal;
    return (
      <div className="pb-32 px-4 animate-fade-in space-y-6 pt-6">
         <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-stone-100 mt-4 sticky top-20 z-20 flex justify-between animate-slide-up">
           <h2 className="text-xl font-bold text-stone-900">Homework Helper</h2>
           <button onClick={resetToIdle} className="text-stone-400 bg-stone-50 rounded-full p-2">✕</button>
         </div>
         
         <div className="space-y-6 animate-slide-up delay-100">
           <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
              <div className="flex justify-between mb-2">
                  <h3 className="text-amber-800 font-bold">🧠 For You (Parent)</h3>
                  <button onClick={() => setShowEnglishContext(!showEnglishContext)} className="text-xs bg-white text-amber-700 px-2 py-1 rounded border border-amber-200">{showEnglishContext ? "Hinglish" : "English"}</button>
              </div>
              <p className="text-stone-800 leading-relaxed text-lg mb-4">{contextText}</p>
              <AudioPlayer text={contextText} label="Listen Explanation" className="w-full justify-center" />
           </div>

           {/* Questions Loop */}
           {guide.questionsList && guide.questionsList.length > 0 && (
               <div className="space-y-4">
                   {guide.questionsList.map(q => {
                       const isExpanded = expandedQuestionId === q.id;
                       return (
                           <div key={q.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                               <div className="p-4 flex">
                                   <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{q.id}</span>
                                   <div className="flex-1">
                                       <p className="font-bold text-stone-900 mb-2">{q.text}</p>
                                       <AudioPlayer text={q.text} label="Read" className="scale-75 origin-left" />
                                   </div>
                               </div>
                               <div className={`bg-stone-50 border-t border-stone-100 transition-all ${isExpanded ? 'p-4 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                                   <button onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)} className="w-full flex justify-between text-sm font-bold text-teal-600 mb-2">
                                       <span>Answer Details</span>
                                   </button>
                                   <div className="space-y-3">
                                       <div className="bg-emerald-50 p-3 rounded border border-emerald-100"><p className="text-emerald-900 font-medium">{q.answer}</p></div>
                                       <div className="bg-teal-50 p-3 rounded border border-teal-100">
                                           <p className="text-xs text-teal-700 font-bold mb-1">Explain to {activeKid.name}:</p>
                                           <p className="text-teal-900 text-sm">{q.explanation}</p>
                                           <AudioPlayer text={q.explanation} label="Listen" className="scale-75 origin-left mt-2" />
                                       </div>
                                   </div>
                               </div>
                               {!isExpanded && (
                                 <button onClick={() => setExpandedQuestionId(q.id)} className="w-full py-2 bg-stone-50 text-xs text-stone-500 font-bold border-t border-stone-100">Show Answer ▼</button>
                               )}
                               {isExpanded && (
                                 <button onClick={() => setExpandedQuestionId(null)} className="w-full py-2 bg-stone-50 text-xs text-stone-500 font-bold border-t border-stone-100">Hide Answer ▲</button>
                               )}
                           </div>
                       )
                   })}
               </div>
           )}
           
           <div className="bg-teal-50 border-l-4 border-teal-500 rounded-r-xl p-5 shadow-sm">
              <h3 className="text-teal-800 font-bold mb-2">🗣️ Start by saying:</h3>
              <p className="text-lg text-stone-900 italic mb-4">"{guide.speakScript}"</p>
              <AudioPlayer text={guide.speakScript} label="Play Script" className="w-full justify-center" />
           </div>

           {guide.visualCuePrompt && <VisualCue prompt={guide.visualCuePrompt} />}
           <WeaknessTracker onFeedback={handleWeaknessFeedback} />
         </div>
      </div>
    );
  };

  const renderMicroLesson = () => {
      if(!microLesson) return null;
      return (
          <div className="pb-32 px-4 pt-6 animate-fade-in space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 flex justify-between items-center sticky top-20 z-20 animate-slide-up">
                  <div><h2 className="text-xl font-bold text-stone-900">⚡ Fast Fix: {microLesson.focusArea}</h2></div>
                  <button onClick={resetToIdle}>✕</button>
              </div>
              <div className="space-y-4 animate-slide-up delay-100">
                {microLesson.steps.map((step, idx) => (
                    <div key={idx} className="bg-white border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">Step {idx + 1}</span>
                        <p className="text-stone-600 mb-4">{step.text}</p>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                            <p className="text-xs font-bold text-stone-500 uppercase mb-1">Say to {activeKid.name}</p>
                            <p className="text-lg text-stone-800 font-medium italic mb-2">"{step.speakScript}"</p>
                            <AudioPlayer text={step.speakScript} label="Play" className="scale-90 origin-left" />
                        </div>
                    </div>
                ))}
              </div>
              <button onClick={handleMicroLessonComplete} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold animate-slide-up delay-200 shadow-lg active:scale-95">Done!</button>
          </div>
      )
  };


  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-20">
      {/* 1. COMPACT HEADER (Always visible) */}
      {renderCompactHeader()}

      <main className="max-w-md mx-auto">
        {showConfetti && <Confetti />}
        
        {/* Render Logic based on Tab OR Active Mode */}
        {status !== 'idle' ? (
           // ACTIVE MODES TAKE OVER
           <>
             {status === 'scanning' && renderScanningState()}
             {(status === 'analyzing' || status === 'generating') && <SmartLoader mode={status === 'analyzing' ? 'analyzing' : 'generating'} />}
             {status === 'choice' && renderChoiceScreen()}
             {status === 'active_chapter' && renderActiveChapterSession()}
             {status === 'active_homework' && renderActiveHomeworkSession()}
             {status === 'revision' && revisionQuiz && <RevisionSession quiz={revisionQuiz} onClose={handleRevisionComplete} />}
             {status === 'micro_lesson' && renderMicroLesson()}
           </>
        ) : (
           // TABS (Only visible when idle)
           <>
             {activeTab === 'home' && renderEmptyState()}
             {activeTab === 'library' && <Library kid={activeKid} />}
           </>
        )}
      </main>

      {/* 2. BOTTOM NAVIGATION (Always visible unless in deep immersive mode?) */}
      {(status === 'idle' || status === 'scanning') && (
        <>
          <BottomNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onScanSelected={handleImageSelected} 
            isScanning={status === 'scanning'}
          />
          {/* Use ScanButton when status is 'scanning' to allow adding more pages or finalizing */}
          {(status === 'scanning') && (
            <ScanButton 
               onImageSelected={handleImageSelected} 
               isLoading={false}
               label="Add More or Done"
            />
          )}
          {/* Note: The main Scan action is now central in BottomNavigation for 'idle' state. 
              The ScanButton component is re-used here just for the 'scanning' state flow 
              where users might want to add more pages, OR we can rely on the UI inside renderScanningState.
              Actually, renderScanningState has a 'Start Teaching' button.
              So we just need the FAB in the nav bar to trigger the initial scan.
          */}
        </>
      )}
    </div>
  );
};

export default App;
