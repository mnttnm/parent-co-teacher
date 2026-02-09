
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

  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    audioBufferRef.current = null;
    setIsPlaying(false);
    setError(false);
  }, [text]);

  const handlePlay = async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    if (!text) return;

    try {
      setIsLoading(true);
      setError(false);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (!audioBufferRef.current) {
        const base64Audio = await generateSpeech(text);
        const bytes = decodeBase64(base64Audio);
        audioBufferRef.current = pcmToAudioBuffer(bytes, audioContextRef.current);
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        sourceRef.current = null;
        setIsPlaying(false);
      };
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
      disabled={isLoading}
      className={`flex items-center space-x-2 text-sm font-semibold rounded-full px-4 py-2 transition-all active:scale-95 ${
        error 
         ? 'bg-gray-100 text-gray-400 border border-gray-200'
         : isPlaying 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md border-transparent' 
          : 'bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50 shadow-sm'
      } ${className}`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <div className="flex items-center space-x-1 h-4">
           {/* Fake Visualizer Bars */}
           <div className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.4s' }}></div>
           <div className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.5s' }}></div>
           <div className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.6s' }}></div>
           <div className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '0.4s' }}></div>
        </div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
        </svg>
      )}
      <span>{error ? 'Unavailable' : isPlaying ? 'Stop' : label}</span>
    </button>
  );
};
