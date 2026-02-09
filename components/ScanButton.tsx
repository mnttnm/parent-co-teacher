
import React, { useRef } from 'react';
import { StoredImage } from '../types';

interface ScanButtonProps {
  onImageSelected: (image: StoredImage) => void;
  isLoading: boolean;
  label?: string;
}

export const ScanButton: React.FC<ScanButtonProps> = ({ onImageSelected, isLoading, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const rawBase64 = base64String.split(',')[1]; 
        onImageSelected({
          data: rawBase64,
          mimeType: file.type || 'image/jpeg'
        });
        // Reset input to allow selecting the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 animate-slide-up delay-200">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        onClick={() => !isLoading && fileInputRef.current?.click()}
        disabled={isLoading}
        className={`w-full max-w-md h-16 rounded-full shadow-xl shadow-indigo-200 flex items-center justify-center space-x-3 transition-all active:scale-95 hover:shadow-2xl ${
          isLoading ? 'bg-stone-300 cursor-wait' : 'bg-gradient-to-r from-teal-600 to-teal-700'
        }`}
      >
        {isLoading ? (
          <span className="text-white font-semibold text-lg animate-pulse">
            Analyzing...
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <span className="text-white font-bold text-lg">{label || "Scan Study Material"}</span>
          </>
        )}
      </button>
    </div>
  );
};
