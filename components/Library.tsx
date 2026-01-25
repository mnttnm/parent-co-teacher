
import React from 'react';
import { KidProfile } from '../types';

interface LibraryProps {
  kid: KidProfile;
}

export const Library: React.FC<LibraryProps> = ({ kid }) => {
  const books = [
    { title: "English Reader", color: "bg-emerald-100 text-emerald-800" },
    { title: "Mathematics", color: "bg-blue-100 text-blue-800" },
    { title: "Environmental Science", color: "bg-amber-100 text-amber-800" },
    { title: "Hindi Vyakaran", color: "bg-rose-100 text-rose-800" },
  ];

  return (
    <div className="px-6 py-6 animate-fade-in pb-32">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
        <h2 className="text-xl font-bold text-stone-900">
          {kid.name}'s Bookshelf
        </h2>
        <p className="text-stone-500 text-sm mt-1">Select a book to browse chapters manually.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {books.map((book, idx) => (
          <div key={idx} className={`${book.color} aspect-[3/4] rounded-xl flex flex-col justify-end p-4 shadow-sm relative overflow-hidden group active:scale-95 transition-transform`}>
             <div className="absolute -top-4 -right-4 w-16 h-16 bg-white opacity-20 rounded-full"></div>
             <div className="absolute top-10 -left-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
             
             <h3 className="font-bold text-lg leading-tight">{book.title}</h3>
             <p className="text-xs font-semibold opacity-70 mt-1">{kid.grade}</p>
          </div>
        ))}
        
        {/* Add New Placeholder */}
        <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 mb-2">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
           </svg>
           <span className="text-xs font-bold">Add Book</span>
        </div>
      </div>
    </div>
  );
};
