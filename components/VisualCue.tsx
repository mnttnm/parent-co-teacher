
import React, { useState, useEffect } from 'react';
import { generateVisualCue } from '../services/geminiService';

interface VisualCueProps {
  prompt: string;
}

export const VisualCue: React.FC<VisualCueProps> = ({ prompt }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchImage = async () => {
      try {
        setLoading(true);
        // Add a small description to ensure style consistency
        const enhancedPrompt = `Simple, clear, educational illustration for a child: ${prompt}`;
        const base64 = await generateVisualCue(enhancedPrompt);
        if (active) setImageData(base64);
      } catch (e) {
        console.error(e);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (prompt) {
      fetchImage();
    }

    return () => { active = false; };
  }, [prompt]);

  if (error) return null; // Hide if generation fails to keep UI clean

  return (
    <div className="mt-4 bg-white rounded-xl overflow-hidden border border-purple-100 shadow-sm">
      <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center">
        <span className="text-xl mr-2">🎨</span>
        <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">
          Show this to your child
        </h3>
      </div>
      
      <div className="p-4 flex flex-col items-center justify-center min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-sm text-purple-600 font-medium animate-pulse">Drawing a picture...</p>
          </div>
        ) : imageData ? (
          <img 
            src={`data:image/jpeg;base64,${imageData}`} 
            alt="Visual Cue" 
            className="w-full h-auto rounded-lg shadow-sm max-h-64 object-contain"
          />
        ) : null}
        <p className="text-xs text-gray-400 mt-2 text-center italic">
          "{prompt}"
        </p>
      </div>
    </div>
  );
};
