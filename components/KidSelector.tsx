
import React from 'react';
import { KidProfile } from '../types';

interface KidSelectorProps {
  kids: KidProfile[];
  activeKid: KidProfile;
  onSelect: (kid: KidProfile) => void;
}

export const KidSelector: React.FC<KidSelectorProps> = ({ kids, activeKid, onSelect }) => {
  return (
    <div className="w-full overflow-x-auto py-2 px-4 whitespace-nowrap scrollbar-hide">
      <div className="flex space-x-3">
        {kids.map((kid) => {
          const isActive = kid.id === activeKid.id;
          return (
            <button
              key={kid.id}
              onClick={() => onSelect(kid)}
              className={`inline-flex items-center space-x-2 p-2 pr-4 rounded-full border transition-all ${
                isActive
                  ? 'border-teal-600 bg-teal-50 shadow-sm'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    // Use profile-specific colors, but mute them slightly to fit the theme if needed
                    kid.avatarColor.replace('500', '600')
                }`}
              >
                {kid.name[0]}
              </div>
              <div className="text-left leading-tight">
                <p className={`font-bold text-sm ${isActive ? 'text-teal-900' : 'text-stone-700'}`}>
                  {kid.name}
                </p>
                <p className="text-[10px] text-stone-500 uppercase tracking-wide">{kid.grade}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
