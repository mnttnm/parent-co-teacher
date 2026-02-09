import React, { useState } from 'react';
import { KidProfile, MarathonPlan, ParentLanguage } from '../types';

interface MarathonPlanModalProps {
  plan: MarathonPlan;
  kid: KidProfile;
  parentLanguage: ParentLanguage;
  isCheckInRunning: boolean;
  onClose: () => void;
  onToggleMission: (missionId: string, nextDone: boolean) => void;
  onRunCheckIn: () => void;
  onRefreshPlan: () => void;
  isGenerating: boolean;
}

// Parent-friendly labels in both languages
const getLabels = (lang: ParentLanguage, kidName: string) => {
  if (lang === 'hinglish') {
    return {
      header: 'Padhai Ka Plan',
      kidPlan: `${kidName} Ka Plan`,
      days: 'Din',
      startScore: 'Shuru Mein',
      currentScore: 'Abhi Ka Score',
      dailyMissions: 'Har Din Ka Kaam',
      day: 'Din',
      minutes: 'min',
      parentTask: 'Aapka Kaam',
      childTask: `${kidName} Ka Kaam`,
      evidence: 'Proof',
      backupPlan: 'Dusra Tarika',
      completed: 'Ho Gaya! Wapas kholne ke liye tap karein',
      markDone: 'Done Mark Karein',
      agentUpdate: 'Agent Ka Update',
      runCheckIn: 'Check-In Karein',
      checkingIn: 'Check ho raha hai...',
    };
  }
  return {
    header: 'Learning Journey',
    kidPlan: `${kidName}'s Plan`,
    days: 'Days',
    startScore: 'Started At',
    currentScore: 'Current Score',
    dailyMissions: 'Daily Missions',
    day: 'Day',
    minutes: 'min',
    parentTask: 'Your Task',
    childTask: `${kidName}'s Task`,
    evidence: 'Evidence',
    backupPlan: 'Backup Plan',
    completed: 'Completed! Tap to undo',
    markDone: 'Mark as Done',
    agentUpdate: 'Agent Update',
    runCheckIn: 'Run Check-In',
    checkingIn: 'Checking In...',
  };
};

export const MarathonPlanModal: React.FC<MarathonPlanModalProps> = ({
  plan,
  kid,
  parentLanguage,
  isCheckInRunning,
  onClose,
  onToggleMission,
  onRunCheckIn,
  onRefreshPlan,
  isGenerating
}) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const labels = getLabels(parentLanguage, kid.name);

  const completedCount = plan.missions.filter(m => m.status === 'done').length;
  const progress = Math.round((completedCount / Math.max(1, plan.missions.length)) * 100);
  const latestCheckIn = plan.checkInHistory?.[0];

  // Day icons for kid-friendly display
  const dayIcons = ['🌟', '🚀', '🎯', '💪', '🧠', '✨', '🏆'];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-white to-amber-50 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 pt-safe-top sticky top-0 z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-stone-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{labels.header}</p>
            <h1 className="text-lg font-bold text-stone-900">{labels.kidPlan}</h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto h-[calc(100vh-80px)] pb-32">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-6">

          {/* Plan Title Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h2 className="text-xl font-bold text-stone-900">{plan.planTitle}</h2>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">{plan.strategy}</p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                {plan.durationDays} {labels.days}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-stone-100 rounded-full p-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-stone-700 whitespace-nowrap">
                  {completedCount}/{plan.missions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quality Scores */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up delay-100">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 text-center">
              <p className="text-xs font-bold uppercase text-stone-400 mb-1">{labels.startScore}</p>
              <p className="text-3xl font-bold text-stone-400">{plan.qualityReport.initialScore}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-xs font-bold uppercase text-indigo-100 mb-1">{labels.currentScore}</p>
              <p className="text-3xl font-bold text-white">{plan.qualityReport.finalScore}</p>
            </div>
          </div>

          {/* Missions / Days */}
          <div className="animate-slide-up delay-200">
            <h3 className="text-sm font-bold uppercase text-stone-400 mb-4 px-1">{labels.dailyMissions}</h3>
            <div className="space-y-4">
              {plan.missions.map((mission, idx) => {
                const done = mission.status === 'done';
                const isExpanded = activeDay === mission.dayNumber;

                return (
                  <div
                    key={mission.id}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                      done
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200'
                        : 'bg-white border-2 border-stone-100 hover:border-indigo-200'
                    }`}
                  >
                    {/* Mission Header - Always Visible */}
                    <button
                      onClick={() => setActiveDay(isExpanded ? null : mission.dayNumber)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start gap-4">
                        {/* Day Icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          done ? 'bg-emerald-100' : 'bg-indigo-100'
                        }`}>
                          {done ? '✅' : dayIcons[idx % dayIcons.length]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wide ${
                              done ? 'text-emerald-600' : 'text-indigo-600'
                            }`}>
                              {labels.day} {mission.dayNumber}
                            </span>
                            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                              {mission.estimatedMinutes} {labels.minutes}
                            </span>
                          </div>
                          <h4 className="font-bold text-stone-900 text-lg mb-1">{mission.focusSkill}</h4>
                          <p className="text-stone-600 text-sm line-clamp-2">{mission.objective}</p>
                        </div>

                        {/* Expand Icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 animate-fade-in border-t border-stone-100 pt-4">
                        {/* Parent Action */}
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">👨‍👩‍👧</span>
                            <p className="text-xs font-bold uppercase text-amber-700">{labels.parentTask}</p>
                          </div>
                          <p className="text-stone-800 text-base leading-relaxed">{mission.parentAction}</p>
                        </div>

                        {/* Child Task */}
                        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧒</span>
                            <p className="text-xs font-bold uppercase text-teal-700">{labels.childTask}</p>
                          </div>
                          <p className="text-stone-800 text-base leading-relaxed">{mission.childTask}</p>
                        </div>

                        {/* Evidence & Fallback */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                            <p className="text-xs font-bold text-stone-500 mb-1">📸 {labels.evidence}</p>
                            <p className="text-xs text-stone-600">{mission.evidenceToCapture}</p>
                          </div>
                          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                            <p className="text-xs font-bold text-stone-500 mb-1">🔄 {labels.backupPlan}</p>
                            <p className="text-xs text-stone-600">{mission.fallbackPlan}</p>
                          </div>
                        </div>

                        {/* Toggle Done Button */}
                        <button
                          onClick={() => onToggleMission(mission.id, !done)}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-98 ${
                            done
                              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                          }`}
                        >
                          {done ? `✓ ${labels.completed}` : labels.markDone}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Latest Check-In */}
          {latestCheckIn && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 animate-slide-up delay-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <p className="text-xs font-bold uppercase text-amber-700">{labels.agentUpdate}</p>
              </div>
              <p className="text-stone-700 text-sm mb-2">{latestCheckIn.summary}</p>
              <p className="text-stone-900 font-semibold mb-3">{latestCheckIn.nextAction}</p>
              <div className="bg-white/50 rounded-xl p-3 border border-amber-200">
                <p className="text-amber-800 italic text-sm">"{latestCheckIn.motivationScript}"</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 pb-safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onRunCheckIn}
            disabled={isCheckInRunning}
            className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-60 shadow-lg shadow-indigo-200 active:scale-98 transition-transform"
          >
            {isCheckInRunning ? labels.checkingIn : `🤖 ${labels.runCheckIn}`}
          </button>
          <button
            onClick={onRefreshPlan}
            disabled={isGenerating}
            className="px-5 bg-stone-100 text-stone-700 py-3.5 rounded-xl font-bold text-sm border border-stone-200 disabled:opacity-60 active:scale-98 transition-transform"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};
