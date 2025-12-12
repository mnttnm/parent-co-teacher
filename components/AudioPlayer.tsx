
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, pcmToAudioBuffer } from '../utils/audioUtils';

interface AudioPlayerProps {
  text: string;
  className?: string;
  label?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, className = "", label = "Listen" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        setIsPlaying(false);
      }
      return;
    }

    if (!text) return;

    try {
      setIsLoading(true);
      setError(false);

      // Initialize AudioContext on user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      // Resume if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Fetch or reuse buffer
      if (!audioBufferRef.current) {
        const base64Audio = await generateSpeech(text);
        const bytes = decodeBase64(base64Audio);
        audioBufferRef.current = pcmToAudioBuffer(bytes, audioContextRef.current);
      }

      // Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      sourceRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play audio", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading || error}
      className={`flex items-center space-x-2 text-sm font-semibold rounded-full px-4 py-2 transition-all ${
        error 
         ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
         : isPlaying 
          ? 'bg-red-100 text-red-600 border border-red-200' 
          : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
      } ${className}`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
        </svg>
      ) : error ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
           <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
        </svg>
      )}
      <span>{error ? 'Unavailable' : isPlaying ? 'Stop' : label}</span>
    </button>
  );
};
