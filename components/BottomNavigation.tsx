
import React, { useRef } from 'react';
import { StoredImage } from '../types';

type Tab = 'home' | 'library';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onScanSelected: (image: StoredImage) => void;
  isScanning: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  onScanSelected,
  isScanning 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(',')[1]; 
        onScanSelected({
          data: rawBase64,
          mimeType: file.type || 'image/jpeg'
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 h-20 px-6 flex items-center justify-between z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
       {/* Hidden Input for Scan */}
       <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Home Tab */}
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center space-y-1 w-16 ${activeTab === 'home' ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === 'home' ? "0" : "2"} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <span className="text-[10px] font-bold">Home</span>
      </button>

      {/* Center Scan Button */}
      <div className="relative -top-6 flex flex-col items-center">
        <button
          onClick={() => !isScanning && fileInputRef.current?.click()}
          disabled={isScanning}
          className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center border-4 border-white transition-transform active:scale-95 ${
            isScanning ? 'bg-stone-300 cursor-wait' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
           {isScanning ? (
             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
             </svg>
           )}
        </button>
        <span className="text-[10px] font-bold text-stone-400 mt-1">Scan</span>
      </div>

      {/* Library Tab */}
      <button 
        onClick={() => onTabChange('library')}
        className={`flex flex-col items-center space-y-1 w-16 ${activeTab === 'library' ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={activeTab === 'library' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === 'library' ? "0" : "2"} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <span className="text-[10px] font-bold">Books</span>
      </button>
    </div>
  );
};
