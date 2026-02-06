import React from 'react';
import { HistoryItem, KidProfile, MarathonPlan } from '../types';

interface MarathonAgentPanelProps {
  kid: KidProfile;
  history: HistoryItem[];
  weaknessStats: Record<string, number>;
  plan: MarathonPlan | null;
  isGenerating: boolean;
  isCheckInRunning: boolean;
  onGeneratePlan: () => void;
  onToggleMission: (missionId: string, nextDone: boolean) => void;
  onRunCheckIn: () => void;
}

export const MarathonAgentPanel: React.FC<MarathonAgentPanelProps> = ({
  kid,
  history,
  weaknessStats,
  plan,
  isGenerating,
  isCheckInRunning,
  onGeneratePlan,
  onToggleMission,
  onRunCheckIn
}) => {
  const kidHistory = history.filter(item => item.kidId === kid.id);
  const topWeakness = Object.entries(weaknessStats).sort((a, b) => b[1] - a[1])[0];

  if (!plan) {
    return (
      <div className="mb-8 bg-white border border-teal-100 rounded-2xl shadow-sm p-5 animate-slide-up delay-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Marathon Agent</p>
            <h3 className="text-lg font-bold text-stone-900">Autonomous 7-Day Learning Plan</h3>
          </div>
          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-bold">Action Era</span>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Builds a long-running plan from session memory, weakness trends, and recent topics. Then self-refines before saving.
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600 mb-4">
          <p>Sessions available: <span className="font-bold text-stone-800">{kidHistory.length}</span></p>
          <p>Top weakness: <span className="font-bold text-stone-800 capitalize">{topWeakness ? topWeakness[0] : 'Not enough data yet'}</span></p>
        </div>
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {isGenerating ? 'Generating Agent Plan...' : 'Generate Marathon Plan'}
        </button>
      </div>
    );
  }

  const completedCount = plan.missions.filter(mission => mission.status === 'done').length;
  const progress = Math.round((completedCount / Math.max(1, plan.missions.length)) * 100);
  const latestCheckIn = plan.checkInHistory?.[0];

  return (
    <div className="mb-8 bg-white border border-indigo-100 rounded-2xl shadow-sm p-5 animate-slide-up delay-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Marathon Agent Active</p>
          <h3 className="text-lg font-bold text-stone-900">{plan.planTitle}</h3>
          <p className="text-xs text-stone-500 mt-1">{plan.strategy}</p>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold">{plan.durationDays} Days</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold text-stone-500 mb-1">
          <span>Progress</span>
          <span>{completedCount}/{plan.missions.length} done</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-stone-50 rounded-lg p-2 border border-stone-200">
          <p className="text-[10px] uppercase font-bold text-stone-400">Initial Score</p>
          <p className="text-lg font-bold text-stone-900">{plan.qualityReport.initialScore}</p>
        </div>
        <div className="bg-stone-50 rounded-lg p-2 border border-stone-200">
          <p className="text-[10px] uppercase font-bold text-stone-400">Final Score</p>
          <p className="text-lg font-bold text-indigo-700">{plan.qualityReport.finalScore}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1">
        {plan.missions.map((mission) => {
          const done = mission.status === 'done';
          return (
            <div key={mission.id} className={`border rounded-xl p-3 ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Day {mission.dayNumber} · {mission.focusSkill}</p>
                <button
                  onClick={() => onToggleMission(mission.id, !done)}
                  className={`text-xs px-2 py-1 rounded-full font-bold ${done ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {done ? 'Done' : 'Mark Done'}
                </button>
              </div>
              <p className="font-bold text-stone-900 text-sm">{mission.objective}</p>
              <p className="text-xs text-stone-600 mt-1">Parent: {mission.parentAction}</p>
              <p className="text-xs text-stone-600">Child: {mission.childTask}</p>
              <p className="text-[11px] text-stone-500 mt-2">Evidence: {mission.evidenceToCapture}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={onRunCheckIn}
          disabled={isCheckInRunning}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          {isCheckInRunning ? 'Running Check-In...' : 'Run Agent Check-In'}
        </button>
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className="px-4 bg-stone-100 text-stone-700 py-2.5 rounded-lg font-bold text-sm border border-stone-200 disabled:opacity-60"
        >
          Refresh Plan
        </button>
      </div>

      {latestCheckIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-fade-in">
          <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">Latest Agent Check-In</p>
          <p className="text-sm text-stone-700 mb-1">{latestCheckIn.summary}</p>
          <p className="text-sm font-semibold text-stone-900">{latestCheckIn.nextAction}</p>
          <p className="text-xs text-amber-800 mt-2 italic">"{latestCheckIn.motivationScript}"</p>
        </div>
      )}
    </div>
  );
};
