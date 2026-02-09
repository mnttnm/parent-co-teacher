import React, { useRef } from 'react';
import { StoredImage } from '../types';

interface ScanActionSheetProps {
  pageCount: number;
  onStartTeaching: () => void;
  onAddPage: (image: StoredImage) => void;
  isAnalyzing?: boolean;
}

export const ScanActionSheet: React.FC<ScanActionSheetProps> = ({
  pageCount,
  onStartTeaching,
  onAddPage,
  isAnalyzing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(',')[1];
        onAddPage({
          data: rawBase64,
          mimeType: file.type || 'image/jpeg'
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Sheet container */}
      <div className="bg-white rounded-t-3xl shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.15)] px-6 pt-3 pb-8 max-w-md mx-auto">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-4" />

        {/* Page count badge */}
        <div className="flex items-center justify-center mb-5">
          <div className="flex items-center space-x-2 bg-stone-100 px-4 py-2 rounded-full">
            <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {pageCount}
            </div>
            <span className="text-sm font-medium text-stone-600">
              {pageCount === 1 ? 'page scanned' : 'pages scanned'}
            </span>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Primary: Start Teaching */}
          <button
            onClick={onStartTeaching}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98] ${
              isAnalyzing
                ? 'bg-stone-200 text-stone-400 cursor-wait'
                : 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-700'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Start Teaching</span>
              </>
            )}
          </button>

          {/* Secondary: Add Another Page */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 border-2 transition-all active:scale-[0.98] ${
              isAnalyzing
                ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Another Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
