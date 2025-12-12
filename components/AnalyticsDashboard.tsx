
import React from 'react';
import { KidProfile, HistoryItem } from '../types';

interface AnalyticsDashboardProps {
  stats: Record<string, number>;
  activeKid: KidProfile;
  history: HistoryItem[];
  onStartRevision: (topic: string) => void;
  onStartMicroLesson: (topic: string, weakness: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  stats, 
  activeKid, 
  history, 
  onStartRevision, 
  onStartMicroLesson 
}) => {
  // Get recent unique topics
  const recentTopics = Array.from(new Set(
    history
    .filter(h => h.kidId === activeKid.id)
    .map(h => h.topic)
  )).slice(0, 2);

  const hasStats = Object.keys(stats).length > 0;
  const topWeakness = Object.entries(stats).sort((a,b) => b[1] - a[1])[0];

  const handleShare = () => {
    const text = `Hi! Today ${activeKid.name} studied ${recentTopics[0] || 'Homework'}. We focused on ${topWeakness ? topWeakness[0] : 'Learning'}. Check the app for details!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="px-6 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4 mt-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Learning Radar</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Live</span>
      </div>

      {/* Radar Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        {hasStats ? (
          <div>
            <div className="flex justify-between items-end mb-4">
               <div>
                 <p className="text-gray-500 text-sm">Top Struggle Area</p>
                 <h4 className="text-2xl font-bold text-gray-900 capitalize">{topWeakness[0] === 'vocab' ? 'Vocabulary' : topWeakness[0]}</h4>
               </div>
               <div className="text-right">
                 <p className="text-3xl font-bold text-indigo-600">{topWeakness[1]}</p>
                 <p className="text-xs text-gray-400">Issues flagged</p>
               </div>
            </div>

            {/* Micro-Lesson Action */}
            {recentTopics.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">Quick Fix available for: <span className="font-bold text-gray-800">{recentTopics[0]}</span></p>
                <button 
                  onClick={() => onStartMicroLesson(recentTopics[0], topWeakness[0])}
                  className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center"
                >
                  <span className="mr-2">⚡</span> Fix this in 5 Minutes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">✨</div>
             <p className="text-gray-500 text-sm">Start a session to see learning stats here.</p>
          </div>
        )}
      </div>

      {/* WhatsApp Share - NEW HIGH VALUE FEATURE */}
      {hasStats && (
        <div className="mb-6">
          <button 
            onClick={handleShare}
            className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/>
            </svg>
            Share Update on WhatsApp
          </button>
        </div>
      )}

      {/* Revision Actions */}
      {recentTopics.length > 0 && (
        <div>
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Ready for Revision?</h3>
           <div className="space-y-3">
             {recentTopics.map(topic => (
               <button
                 key={topic}
                 onClick={() => onStartRevision(topic)}
                 className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-xl shadow-md flex justify-between items-center active:scale-95 transition-transform"
               >
                 <span className="font-bold truncate mr-2">{topic}</span>
                 <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">Start Quiz</span>
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
