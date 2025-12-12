
import { HistoryItem, HomeworkAnalysis, GuidedSession, ChapterGuide } from '../types';

const DB_NAME = 'ParentTeacherDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveSession = async (
  kidId: string,
  analysis: HomeworkAnalysis,
  type: 'chapter' | 'homework',
  data: ChapterGuide | GuidedSession,
  images: string[]
): Promise<HistoryItem | null> => {
  try {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      kidId,
      subject: analysis.subject,
      topic: analysis.chapter || (data as ChapterGuide).topic || 'Unknown Topic',
      type,
      analysis,
      data,
      images // Store images for offline retrieval
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newItem);

      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save session to IDB", e);
    return null;
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as HistoryItem[];
        // Sort descending by timestamp (newest first)
        const sorted = result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to load history from IDB", e);
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to clear history", e);
  }
};
