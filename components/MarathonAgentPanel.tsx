import React from 'react';
import { HistoryItem, KidProfile, MarathonPlan, ParentLanguage } from '../types';

interface MarathonAgentPanelProps {
  kid: KidProfile;
  history: HistoryItem[];
  weaknessStats: Record<string, number>;
  plan: MarathonPlan | null;
  isGenerating: boolean;
  parentLanguage: ParentLanguage;
  onGeneratePlan: () => void;
  onViewPlan: () => void;
}

// Parent-friendly labels
const getLabels = (lang: ParentLanguage, kidName: string) => {
  if (lang === 'hinglish') {
    return {
      marathonAgent: 'Padhai Planner',
      kidPlan: `${kidName} Ka Plan`,
      createPlan: `${kidName} Ke Liye Plan Banayein`,
      basedOn: 'session se',
      focus: 'Focus',
      generatePlan: '7-Din Ka Plan Banayein',
      creatingPlan: 'Plan ban raha hai...',
      days: 'Din',
    };
  }
  return {
    marathonAgent: 'Marathon Agent',
    kidPlan: `${kidName}'s Plan`,
    createPlan: `Create ${kidName}'s Learning Plan`,
    basedOn: 'session',
    focus: 'Focus',
    generatePlan: 'Generate 7-Day Plan',
    creatingPlan: 'Creating Plan...',
    days: 'D',
  };
};

/**
 * A minimal, non-intrusive entry point for the Marathon Agent.
 * Only appears when there's enough data to be useful.
 */
export const MarathonAgentPanel: React.FC<MarathonAgentPanelProps> = ({
  kid,
  history,
  weaknessStats,
  plan,
  isGenerating,
  parentLanguage,
  onGeneratePlan,
  onViewPlan
}) => {
  const kidHistory = history.filter(item => item.kidId === kid.id);
  const sessionCount = kidHistory.length;
  const labels = getLabels(parentLanguage, kid.name);

  // Only show when there's at least 1 completed session
  if (sessionCount === 0 && !plan) {
    return null;
  }

  // If there's an active plan, show a compact "View Plan" card
  if (plan) {
    const completedCount = plan.missions.filter(m => m.status === 'done').length;
    const progress = Math.round((completedCount / Math.max(1, plan.missions.length)) * 100);
    const allDone = completedCount === plan.missions.length;

    return (
      <button
        onClick={onViewPlan}
        className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-98 text-left group"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
          allDone ? 'bg-emerald-100' : 'bg-indigo-100'
        }`}>
          {allDone ? '🏆' : '🎯'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
              {labels.kidPlan}
            </p>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {plan.durationDays}{labels.days}
            </span>
          </div>
          <h4 className="font-bold text-stone-900 truncate">{plan.planTitle}</h4>

          {/* Progress mini bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  allDone ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-stone-500">{completedCount}/{plan.missions.length}</span>
          </div>
        </div>

        {/* Arrow */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    );
  }

  // No plan yet - show generate option (only when there's session data)
  const topWeakness = Object.entries(weaknessStats)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">
          🎯
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{labels.marathonAgent}</p>
          <h4 className="font-bold text-stone-900 text-sm">{labels.createPlan}</h4>
        </div>
      </div>

      <p className="text-xs text-stone-500 mb-3">
        {sessionCount} {labels.basedOn}{sessionCount > 1 ? 's' : ''}
        {topWeakness ? ` • ${labels.focus}: ${topWeakness[0]}` : ''}
      </p>

      <button
        onClick={onGeneratePlan}
        disabled={isGenerating}
        className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-wait active:scale-98"
      >
        {isGenerating ? labels.creatingPlan : labels.generatePlan}
      </button>
    </div>
  );
};
