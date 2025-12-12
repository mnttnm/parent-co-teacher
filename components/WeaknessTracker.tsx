
import React, { useState } from 'react';

interface WeaknessTrackerProps {
  onFeedback: (tags: string[]) => void;
}

export const WeaknessTracker: React.FC<WeaknessTrackerProps> = ({ onFeedback }) => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = [
    { id: 'vocab', label: 'Hard Words' },
    { id: 'concept', label: 'Confused Concept' },
    { id: 'focus', label: 'Lost Focus' },
  ];

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onFeedback(selectedTags);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100 animate-fade-in mt-6">
        <p className="text-green-800 font-bold">Thanks for tracking!</p>
        <p className="text-sm text-green-600">We've updated the learning plan.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mt-8">
      <h3 className="text-gray-800 font-bold mb-3 flex items-center">
        <span className="mr-2">📊</span> How did it go?
      </h3>
      <p className="text-sm text-gray-500 mb-4">Tap if the child struggled with:</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTags.includes(tag.id)
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors"
      >
        Complete Session
      </button>
    </div>
  );
};
