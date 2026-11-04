import { create } from 'zustand';
import {
  checkOfflineBibleStatus,
  downloadBibleBundleWithProgress,
  clearOfflineBibleBundle,
  OfflineBibleStatus,
} from '../lib/bible';

export interface OfflineMutation {
  id: string;
  type: 'progress' | 'highlight' | 'note';
  payload: any;
  timestamp: number;
}

interface OfflineSyncState {
  // Bible offline storage state
  bibleStatus: OfflineBibleStatus;
  downloadingScript: 'simp' | 'trad' | 'all' | null;
  downloadProgress: number; // 0..100
  downloadError: string | null;

  // Offline queue state
  queue: OfflineMutation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;

  // Actions
  refreshBibleStatus: () => Promise<void>;
  downloadBible: (scope: 'current' | 'all', currentScript: 'simp' | 'trad') => Promise<void>;
  clearBibleCache: (script?: 'simp' | 'trad') => Promise<void>;

  // Queue actions
  enqueueMutation: (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => void;
  triggerSyncQueue: (syncCallback: () => Promise<void>) => Promise<void>;
  setIsOnline: (online: boolean) => void;
}

const OFFLINE_QUEUE_KEY = 'dailybible_offline_queue_v1';
const LAST_SYNC_KEY = 'dailybible_last_synced_at';

function loadPersistedQueue(): OfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: OfflineMutation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

function loadLastSyncedAt(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
  bibleStatus: {
    cunps: false,
    cunpt: false,
    cunpsSize: 0,
    cunptSize: 0,
  },
  downloadingScript: null,
  downloadProgress: 0,
  downloadError: null,

  queue: loadPersistedQueue(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: loadLastSyncedAt(),
  syncError: null,

  refreshBibleStatus: async () => {
    try {
      const status = await checkOfflineBibleStatus();
      set({ bibleStatus: status });
    } catch {
      // ignore
    }
  },

  downloadBible: async (scope, currentScript) => {
    set({
      downloadingScript: scope === 'all' ? 'all' : currentScript,
      downloadProgress: 0,
      downloadError: null,
    });

    try {
      if (scope === 'all') {
        // Download simp then trad
        await downloadBibleBundleWithProgress('simp', (p) => {
          set({ downloadProgress: Math.round(p * 0.5) });
        });
        await downloadBibleBundleWithProgress('trad', (p) => {
          set({ downloadProgress: 50 + Math.round(p * 0.5) });
        });
      } else {
        await downloadBibleBundleWithProgress(currentScript, (p) => {
          set({ downloadProgress: p });
        });
      }

      await get().refreshBibleStatus();
      set({ downloadingScript: null, downloadProgress: 100 });
      setTimeout(() => set({ downloadProgress: 0 }), 3000);
    } catch (err: any) {
      set({
        downloadingScript: null,
        downloadError: err?.message || '下载离线圣经失败，请检查网络后重试',
      });
    }
  },

  clearBibleCache: async (script) => {
    await clearOfflineBibleBundle(script);
    await get().refreshBibleStatus();
  },

  enqueueMutation: (mutation) => {
    const item: OfflineMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    const nextQueue = [...get().queue, item];
    set({ queue: nextQueue });
    persistQueue(nextQueue);
  },

  triggerSyncQueue: async (syncCallback) => {
    if (get().isSyncing) return;
    set({ isSyncing: true, syncError: null });

    try {
      await syncCallback();
      const now = Date.now();
      set({
        queue: [],
        isSyncing: false,
        lastSyncedAt: now,
      });
      persistQueue([]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_KEY, now.toString());
      }
    } catch (err: any) {
      set({
        isSyncing: false,
        syncError: err?.message || '同步失败，已保留离线待上传队列，将在联网时自动重试',
      });
    }
  },

  setIsOnline: (online) => set({ isOnline: online }),
}));

// Setup global network event listeners in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineSyncStore.getState().setIsOnline(true);
  });
  window.addEventListener('offline', () => {
    useOfflineSyncStore.getState().setIsOnline(false);
  });
}
