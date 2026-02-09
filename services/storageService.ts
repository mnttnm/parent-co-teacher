
import {
  HistoryItem,
  HomeworkAnalysis,
  GuidedSession,
  ChapterGuide,
  MarathonPlan,
  MarathonMissionStatus,
  MarathonCheckIn,
  StoredImage
} from '../types';

const DB_NAME = 'ParentTeacherDB';
const DB_VERSION = 2;
const SESSIONS_STORE = 'sessions';
const PLANS_STORE = 'marathonPlans';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PLANS_STORE)) {
        db.createObjectStore(PLANS_STORE, { keyPath: 'id' });
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
  images: StoredImage[]
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
      images, // Store images for offline retrieval
      feedbackTags: [] // Init empty
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(newItem);

      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save session to IDB", e);
    return null;
  }
};

export const updateSessionFeedback = async (id: string, tags: string[]): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const data = getReq.result as HistoryItem;
        if (!data) {
          resolve();
          return;
        }

        data.feedbackTags = tags;
        const putReq = store.put(data);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.error("Failed to update feedback", e);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
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

export const getWeaknessStats = async (kidId: string): Promise<Record<string, number>> => {
  const history = await getHistory();
  const kidHistory = history.filter(h => h.kidId === kidId);
  
  const stats: Record<string, number> = {};
  
  kidHistory.forEach(item => {
    if (item.feedbackTags) {
      item.feedbackTags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    }
  });
  
  return stats;
};

export const clearHistory = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to clear history", e);
  }
};

export const saveMarathonPlan = async (plan: MarathonPlan): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLANS_STORE], 'readwrite');
      const store = transaction.objectStore(PLANS_STORE);
      const request = store.put(plan);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save marathon plan", e);
  }
};

export const getLatestMarathonPlan = async (kidId: string): Promise<MarathonPlan | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLANS_STORE], 'readonly');
      const store = transaction.objectStore(PLANS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const plans = (request.result as MarathonPlan[])
          .filter(plan => plan.kidId === kidId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(plans[0] || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to load marathon plan", e);
    return null;
  }
};

export const updateMarathonMissionStatus = async (
  planId: string,
  missionId: string,
  status: MarathonMissionStatus,
  reflectionNote?: string
): Promise<MarathonPlan | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLANS_STORE], 'readwrite');
      const store = transaction.objectStore(PLANS_STORE);
      const getReq = store.get(planId);

      getReq.onsuccess = () => {
        const plan = getReq.result as MarathonPlan;
        if (!plan) {
          resolve(null);
          return;
        }

        const missions = plan.missions.map((mission) => {
          if (mission.id !== missionId) return mission;
          return { ...mission, status, reflectionNote };
        });

        const updated: MarathonPlan = {
          ...plan,
          missions,
          updatedAt: Date.now()
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    console.error("Failed to update marathon mission", e);
    return null;
  }
};

export const appendMarathonCheckIn = async (
  planId: string,
  checkIn: MarathonCheckIn
): Promise<MarathonPlan | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLANS_STORE], 'readwrite');
      const store = transaction.objectStore(PLANS_STORE);
      const getReq = store.get(planId);

      getReq.onsuccess = () => {
        const plan = getReq.result as MarathonPlan;
        if (!plan) {
          resolve(null);
          return;
        }

        const updated: MarathonPlan = {
          ...plan,
          checkInHistory: [checkIn, ...(plan.checkInHistory || [])].slice(0, 6),
          updatedAt: Date.now()
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    console.error("Failed to append marathon check-in", e);
    return null;
  }
};
