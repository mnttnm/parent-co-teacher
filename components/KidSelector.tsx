import React from 'react';
import { KidProfile } from '../types';

interface KidSelectorProps {
  kids: KidProfile[];
  activeKid: KidProfile;
  onSelect: (kid: KidProfile) => void;
}

export const KidSelector: React.FC<KidSelectorProps> = ({ kids, activeKid, onSelect }) => {
  return (
    <div className="w-full overflow-x-auto py-4 px-4 bg-white shadow-sm sticky top-0 z-10">
      <div className="flex space-x-4">
        {kids.map((kid) => {
          const isActive = kid.id === activeKid.id;
          return (
            <button
              key={kid.id}
              onClick={() => onSelect(kid)}
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all min-w-[160px] ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${kid.avatarColor}`}
              >
                {kid.name[0]}
              </div>
              <div className="text-left">
                <p className={`font-bold ${isActive ? 'text-indigo-900' : 'text-gray-800'}`}>
                  {kid.name}
                </p>
                <p className="text-xs text-gray-500">{kid.grade}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
