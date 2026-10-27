import { create } from 'zustand';
import { VerseItem, loadChapterVerses } from '../lib/bible';
import { BIBLE_BOOKS, BOOK_BY_ID, getBookName, getBookAbbr } from '../data/books';
import { useSettingsStore } from './settingsStore';
import { PlanDayEntry, PlanReadingSegment } from '../lib/plan';

export type AudioEditionId = 42 | 2; // 42 = 和合本100周年朗读版, 2 = 和合本（新旧约）磐石聆听版

export interface LyricCue {
  verse: number; // 0 = chapter title, >=1 = verse number
  start: number; // seconds
  end: number;   // seconds
}

export interface PlanQueueChapterItem {
  part: 'ps' | 'nt' | 'ot';
  partTag: string;
  bookId: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  labelSimp: string;
  labelTrad: string;
}

export const AUDIO_EDITIONS: Array<{ id: AudioEditionId; label: string; shortLabel: string }> = [
  { id: 42, label: '和合本100周年朗读版', shortLabel: '100周年版' },
  { id: 2, label: '和合本(新旧约)磐石聆听版', shortLabel: '磐石聆听版' },
];

export function buildPlanDayAudioQueue(dayEntry: PlanDayEntry): PlanQueueChapterItem[] {
  const queue: PlanQueueChapterItem[] = [];
  const segList: Array<{ part: 'ps' | 'nt' | 'ot'; tag: string; seg: PlanReadingSegment }> = [
    { part: 'ps', tag: '诗篇/智慧', seg: dayEntry.readings.ps },
    { part: 'nt', tag: '新约', seg: dayEntry.readings.nt },
    { part: 'ot', tag: '旧约', seg: dayEntry.readings.ot },
  ];

  for (const { part, tag, seg } of segList) {
    let vStart: number | undefined;
    let vEnd: number | undefined;
    if (seg.verseSpec) {
      const nums = seg.verseSpec.split('-').map((n) => parseInt(n, 10));
      if (!isNaN(nums[0])) vStart = nums[0];
      if (!isNaN(nums[1])) vEnd = nums[1];
    }

    for (let ch = seg.chapterStart; ch <= seg.chapterEnd; ch++) {
      const abbrS = getBookAbbr(seg.bookId, 'simp');
      const abbrT = getBookAbbr(seg.bookId, 'trad');
      const suffix = seg.verseSpec ? `:${seg.verseSpec}` : '章';
      queue.push({
        part,
        partTag: tag,
        bookId: seg.bookId,
        chapter: ch,
        verseStart: vStart,
        verseEnd: vEnd,
        labelSimp: `${abbrS}${ch}${suffix}`,
        labelTrad: `${abbrT}${ch}${suffix}`,
      });
    }
  }

  return queue;
}

export interface TtsState {
  isOpen: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isLoadingAudio: boolean;
  audioError: string | null;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: VerseItem[];
  currentIndex: number; // index into verses array
  rate: number; // 0.75 .. 2.0
  editionId: AudioEditionId; // 42 (default) or 2
  autoNextChapter: boolean;  // used when playbackMode === 'normal'
  playbackMode: 'normal' | 'plan_loop';
  planDayTitle: string;
  planQueue: PlanQueueChapterItem[];
  planQueueIndex: number;
  lyricFocusMode: boolean;     // Mode 1: Apple-Music style verse focus in Bible reader
  immersiveCardOpen: boolean;  // Mode 4: Fullscreen big-character listening card
  currentTime: number;
  duration: number;
  cues: LyricCue[];

  startReading: (params: {
    bookId: string;
    bookName: string;
    chapter: number;
    verses: VerseItem[];
    startVerseNumber?: number;
  }) => void;
  startPlanDayLoop: (params: {
    dayEntry: PlanDayEntry;
    startPart?: 'ps' | 'nt' | 'ot';
  }) => Promise<{ targetBookId: string; targetChapter: number }>;
  jumpToPlanQueueItem: (queueIndex: number) => Promise<void>;
  exitPlanLoopMode: () => void;
  pauseReading: () => void;
  resumeReading: () => void;
  togglePlayPause: () => void;
  prevVerse: () => void;
  nextVerse: () => void;
  jumpToVerseIndex: (idx: number) => void;
  seekToTime: (seconds: number) => void;
  setRate: (rate: number) => void;
  setEditionId: (editionId: AudioEditionId) => void;
  setAutoNextChapter: (enabled: boolean) => void;
  setLyricFocusMode: (enabled: boolean) => void;
  setImmersiveCardOpen: (open: boolean) => void;
  stopAndClose: () => void;
}

const PREF_KEY = 'dailybible_audio_prefs_v2';

function loadAudioPrefs(): {
  editionId: AudioEditionId;
  autoNextChapter: boolean;
  rate: number;
  lyricFocusMode: boolean;
} {
  if (typeof window === 'undefined') {
    return { editionId: 42, autoNextChapter: true, rate: 1.0, lyricFocusMode: true };
  }
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        editionId: p.editionId === 2 ? 2 : 42,
        autoNextChapter: p.autoNextChapter !== undefined ? Boolean(p.autoNextChapter) : true,
        rate: typeof p.rate === 'number' ? p.rate : 1.0,
        lyricFocusMode: p.lyricFocusMode !== undefined ? Boolean(p.lyricFocusMode) : true,
      };
    }
  } catch {
    // ignore
  }
  return { editionId: 42, autoNextChapter: true, rate: 1.0, lyricFocusMode: true };
}

function saveAudioPrefs(
  patch: Partial<{
    editionId: AudioEditionId;
    autoNextChapter: boolean;
    rate: number;
    lyricFocusMode: boolean;
  }>
) {
  if (typeof window === 'undefined') return;
  try {
    const curr = loadAudioPrefs();
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...curr, ...patch }));
  } catch {
    // ignore
  }
}

export function parseLyricTimestamps(lyric: string): LyricCue[] {
  if (!lyric || !lyric.trim()) return [];
  const cues: LyricCue[] = [];
  const lines = lyric.trim().split(/\r?\n/);
  for (const line of lines) {
    const m = line.trim().match(/^(\d+)\$(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (m) {
      const verse = parseInt(m[1], 10);
      const start = parseFloat(m[2]);
      const end = parseFloat(m[3]);
      if (!isNaN(verse) && !isNaN(start) && !isNaN(end)) {
        cues.push({ verse, start, end });
      }
    }
  }
  return cues;
}

let activeAudio: HTMLAudioElement | null = null;
let loadSessionId = 0;

function cleanupAudioElement() {
  if (activeAudio) {
    try {
      activeAudio.onloadedmetadata = null;
      activeAudio.ontimeupdate = null;
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.onplay = null;
      activeAudio.onpause = null;
      activeAudio.pause();
      activeAudio.src = '';
    } catch {
      // ignore
    }
    activeAudio = null;
  }
}

function syncBrowserUrlToChapter(bookId: string, chapter: number) {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/bible')) {
    const targetPath = `/bible/${bookId}.${chapter}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}

async function advanceOnChapterEnded(
  session: number,
  get: () => TtsState,
  set: (partial: Partial<TtsState>) => void
) {
  if (session !== loadSessionId) return;
  const latest = get();

  // Case 1: Victorious Reading Plan Loop Mode -> advance to next chapter in planQueue and loop around
  if (latest.playbackMode === 'plan_loop' && latest.planQueue.length > 0) {
    const nextQueueIdx = (latest.planQueueIndex + 1) % latest.planQueue.length;
    const targetItem = latest.planQueue[nextQueueIdx];
    const script = useSettingsStore.getState().script;
    const nextBookName = getBookName(targetItem.bookId, script);
    let nextVerses = await loadChapterVerses(targetItem.bookId, targetItem.chapter, script);
    if (session !== loadSessionId) return;

    if (targetItem.verseStart !== undefined) {
      nextVerses = nextVerses.filter(
        (v) =>
          v.v >= (targetItem.verseStart || 1) &&
          (targetItem.verseEnd === undefined || v.v <= targetItem.verseEnd)
      );
    }

    syncBrowserUrlToChapter(targetItem.bookId, targetItem.chapter);

    set({
      planQueueIndex: nextQueueIdx,
      bookId: targetItem.bookId,
      bookName: nextBookName,
      chapter: targetItem.chapter,
      verses: nextVerses,
      currentIndex: 0,
    });

    loadAndPlayChapterAudio(
      get,
      set,
      targetItem.verseStart || 1,
      targetItem.verseEnd
    );
    return;
  }

  // Case 2: Normal Bible Reader Mode
  if (!latest.autoNextChapter) {
    set({ isPlaying: false, isPaused: false, currentTime: 0 });
    return;
  }

  const currBookMeta = BOOK_BY_ID[latest.bookId] || BOOK_BY_ID['gen'];
  let nextBookId = latest.bookId;
  let nextChapter = latest.chapter + 1;

  if (nextChapter > currBookMeta.chapters) {
    if (currBookMeta.index < 66) {
      const nextBook = BIBLE_BOOKS[currBookMeta.index];
      nextBookId = nextBook.id;
      nextChapter = 1;
    } else {
      set({ isPlaying: false, isPaused: false });
      return;
    }
  }

  const script = useSettingsStore.getState().script;
  const nextBookName = getBookName(nextBookId, script);
  const nextVerses = await loadChapterVerses(nextBookId, nextChapter, script);
  if (session !== loadSessionId) return;

  syncBrowserUrlToChapter(nextBookId, nextChapter);

  set({
    bookId: nextBookId,
    bookName: nextBookName,
    chapter: nextChapter,
    verses: nextVerses,
    currentIndex: 0,
  });

  loadAndPlayChapterAudio(get, set, 1);
}

async function loadAndPlayChapterAudio(
  get: () => TtsState,
  set: (partial: Partial<TtsState>) => void,
  targetStartVerseNumber?: number,
  targetEndVerseNumber?: number
) {
  if (typeof window === 'undefined') return;

  const session = ++loadSessionId;
  cleanupAudioElement();

  const state = get();
  const bookMeta = BOOK_BY_ID[state.bookId] || BOOK_BY_ID['gen'];
  const usfm = bookMeta.usfm;

  set({
    isLoadingAudio: true,
    audioError: null,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    cues: [],
  });

  try {
    const res = await fetch(
      `/api/audio/chapter?book=${encodeURIComponent(usfm)}&chapter=${state.chapter}&cat=${state.editionId}`
    );
    if (session !== loadSessionId) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || '音频加载失败');
    }

    const data = await res.json();
    if (session !== loadSessionId) return;

    const downloadUrl: string = data.downloadUrl;
    const cues = parseLyricTimestamps(data.lyric || '');

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = downloadUrl;
    audio.playbackRate = get().rate;
    activeAudio = audio;

    // Calculate starting time if startVerseNumber > 1
    let initialSeekTime = 0;
    const desiredVerse =
      targetStartVerseNumber !== undefined
        ? targetStartVerseNumber
        : get().verses[get().currentIndex]?.v || 1;

    if (desiredVerse > 1 && cues.length > 0) {
      const foundCue = cues.find((c) => c.verse === desiredVerse);
      if (foundCue) {
        initialSeekTime = foundCue.start;
      }
    }

    // If a specific verseEnd is set (e.g., Psalm 119 partial segment), find end timestamp
    let segmentEndTime: number | undefined;
    if (targetEndVerseNumber !== undefined && cues.length > 0) {
      const endCue = cues.find((c) => c.verse === targetEndVerseNumber);
      if (endCue) {
        segmentEndTime = endCue.end;
      }
    }

    audio.onloadedmetadata = () => {
      if (session !== loadSessionId) return;
      set({
        duration: audio.duration || 0,
        isLoadingAudio: false,
      });
      if (initialSeekTime > 0 && initialSeekTime < (audio.duration || Infinity)) {
        audio.currentTime = initialSeekTime;
      } else if (desiredVerse > 1 && cues.length === 0 && audio.duration) {
        const latest = get();
        const ratio = latest.currentIndex / Math.max(1, latest.verses.length);
        audio.currentTime = audio.duration * ratio;
      }
    };

    audio.ontimeupdate = () => {
      if (session !== loadSessionId) return;
      const t = audio.currentTime || 0;
      const dur = audio.duration || 0;
      const latest = get();

      // If playing a partial chapter in Plan Loop mode (e.g. Psalm 119:1-24) and reached segmentEndTime
      if (segmentEndTime !== undefined && t >= segmentEndTime) {
        audio.pause();
        advanceOnChapterEnded(session, get, set);
        return;
      }

      let nextIdx = latest.currentIndex;
      if (cues.length > 0) {
        const matchedCue = cues.find((c) => c.verse >= 1 && t >= c.start && t < c.end);
        if (matchedCue) {
          const vIdx = latest.verses.findIndex((v) => v.v === matchedCue.verse);
          if (vIdx >= 0) {
            nextIdx = vIdx;
          }
        }
      } else if (dur > 0 && latest.verses.length > 0) {
        const approxIdx = Math.min(
          latest.verses.length - 1,
          Math.floor((t / dur) * latest.verses.length)
        );
        nextIdx = approxIdx;
      }

      if (nextIdx !== latest.currentIndex) {
        set({ currentIndex: nextIdx, currentTime: t, duration: dur });
      } else {
        set({ currentTime: t, duration: dur });
      }
    };

    audio.onplay = () => {
      if (session !== loadSessionId) return;
      set({ isPlaying: true, isPaused: false, isLoadingAudio: false });
    };

    audio.onpause = () => {
      if (session !== loadSessionId) return;
      if (!audio.ended) {
        set({ isPlaying: false, isPaused: true });
      }
    };

    audio.onended = () => {
      advanceOnChapterEnded(session, get, set);
    };

    audio.onerror = () => {
      if (session !== loadSessionId) return;
      set({
        isLoadingAudio: false,
        isPlaying: false,
        audioError: '音频流加载失败，请重试',
      });
    };

    set({ cues });
    await audio.play();
  } catch (err: any) {
    if (session !== loadSessionId) return;
    set({
      isLoadingAudio: false,
      isPlaying: false,
      audioError: String(err?.message || '无法播放该章音频'),
    });
  }
}

const initialPrefs = loadAudioPrefs();

export const useTtsStore = create<TtsState>((set, get) => ({
  isOpen: false,
  isPlaying: false,
  isPaused: false,
  isLoadingAudio: false,
  audioError: null,
  bookId: 'gen',
  bookName: '创世记',
  chapter: 1,
  verses: [],
  currentIndex: 0,
  rate: initialPrefs.rate,
  editionId: initialPrefs.editionId,
  autoNextChapter: initialPrefs.autoNextChapter,
  playbackMode: 'normal',
  planDayTitle: '',
  planQueue: [],
  planQueueIndex: 0,
  lyricFocusMode: initialPrefs.lyricFocusMode,
  immersiveCardOpen: false,
  currentTime: 0,
  duration: 0,
  cues: [],

  startReading: ({ bookId, bookName, chapter, verses, startVerseNumber }) => {
    if (!verses || verses.length === 0) return;
    let startIdx = 0;
    if (startVerseNumber !== undefined) {
      const foundIdx = verses.findIndex((v) => v.v === startVerseNumber);
      if (foundIdx >= 0) startIdx = foundIdx;
    }

    // Check if the user is starting a chapter that belongs to the currently active planQueue
    const s = get();
    const matchInPlan =
      s.playbackMode === 'plan_loop'
        ? s.planQueue.findIndex((q) => q.bookId === bookId && q.chapter === chapter)
        : -1;

    set({
      isOpen: true,
      bookId,
      bookName,
      chapter,
      verses,
      currentIndex: startIdx,
      playbackMode: matchInPlan >= 0 ? 'plan_loop' : 'normal',
      planQueueIndex: matchInPlan >= 0 ? matchInPlan : 0,
    });

    loadAndPlayChapterAudio(get, set, verses[startIdx]?.v || 1);
  },

  startPlanDayLoop: async ({ dayEntry, startPart = 'ps' }) => {
    const queue = buildPlanDayAudioQueue(dayEntry);
    const startIdx = Math.max(
      0,
      queue.findIndex((q) => q.part === startPart)
    );
    const firstItem = queue[startIdx] || queue[0];
    const script = useSettingsStore.getState().script;
    const bookName = getBookName(firstItem.bookId, script);

    let verses = await loadChapterVerses(firstItem.bookId, firstItem.chapter, script);
    if (firstItem.verseStart !== undefined) {
      verses = verses.filter(
        (v) =>
          v.v >= (firstItem.verseStart || 1) &&
          (firstItem.verseEnd === undefined || v.v <= firstItem.verseEnd)
      );
    }

    set({
      isOpen: true,
      playbackMode: 'plan_loop',
      planDayTitle: `${dayEntry.month}月${dayEntry.day}日 · 得胜计划第${dayEntry.dayIndex}天`,
      planQueue: queue,
      planQueueIndex: startIdx,
      bookId: firstItem.bookId,
      bookName,
      chapter: firstItem.chapter,
      verses,
      currentIndex: 0,
    });

    loadAndPlayChapterAudio(
      get,
      set,
      firstItem.verseStart || 1,
      firstItem.verseEnd
    );

    return {
      targetBookId: firstItem.bookId,
      targetChapter: firstItem.chapter,
    };
  },

  jumpToPlanQueueItem: async (queueIndex) => {
    const s = get();
    if (queueIndex < 0 || queueIndex >= s.planQueue.length) return;
    const targetItem = s.planQueue[queueIndex];
    const script = useSettingsStore.getState().script;
    const bookName = getBookName(targetItem.bookId, script);
    let verses = await loadChapterVerses(targetItem.bookId, targetItem.chapter, script);
    if (targetItem.verseStart !== undefined) {
      verses = verses.filter(
        (v) =>
          v.v >= (targetItem.verseStart || 1) &&
          (targetItem.verseEnd === undefined || v.v <= targetItem.verseEnd)
      );
    }

    syncBrowserUrlToChapter(targetItem.bookId, targetItem.chapter);

    set({
      planQueueIndex: queueIndex,
      bookId: targetItem.bookId,
      bookName,
      chapter: targetItem.chapter,
      verses,
      currentIndex: 0,
    });

    loadAndPlayChapterAudio(
      get,
      set,
      targetItem.verseStart || 1,
      targetItem.verseEnd
    );
  },

  exitPlanLoopMode: () => {
    set({ playbackMode: 'normal', planQueue: [], planQueueIndex: 0 });
  },

  pauseReading: () => {
    if (activeAudio) {
      activeAudio.pause();
    }
    set({ isPlaying: false, isPaused: true });
  },

  resumeReading: () => {
    if (activeAudio && activeAudio.src) {
      activeAudio.play().catch(() => {
        loadAndPlayChapterAudio(get, set, get().verses[get().currentIndex]?.v || 1);
      });
      set({ isPlaying: true, isPaused: false });
    } else {
      loadAndPlayChapterAudio(get, set, get().verses[get().currentIndex]?.v || 1);
    }
  },

  togglePlayPause: () => {
    const s = get();
    if (s.isPlaying) {
      s.pauseReading();
    } else {
      s.resumeReading();
    }
  },

  prevVerse: () => {
    const s = get();
    const nextIdx = Math.max(0, s.currentIndex - 1);
    set({ currentIndex: nextIdx });
    const targetVerseNum = s.verses[nextIdx]?.v || 1;
    const cue = s.cues.find((c) => c.verse === targetVerseNum);
    if (activeAudio && cue) {
      activeAudio.currentTime = cue.start;
      if (activeAudio.paused) activeAudio.play().catch(() => {});
    } else if (activeAudio && s.duration > 0) {
      activeAudio.currentTime = (nextIdx / Math.max(1, s.verses.length)) * s.duration;
      if (activeAudio.paused) activeAudio.play().catch(() => {});
    } else {
      loadAndPlayChapterAudio(get, set, targetVerseNum);
    }
  },

  nextVerse: () => {
    const s = get();
    if (s.currentIndex + 1 < s.verses.length) {
      const nextIdx = s.currentIndex + 1;
      set({ currentIndex: nextIdx });
      const targetVerseNum = s.verses[nextIdx]?.v || 1;
      const cue = s.cues.find((c) => c.verse === targetVerseNum);
      if (activeAudio && cue) {
        activeAudio.currentTime = cue.start;
        if (activeAudio.paused) activeAudio.play().catch(() => {});
      } else if (activeAudio && s.duration > 0) {
        activeAudio.currentTime = (nextIdx / Math.max(1, s.verses.length)) * s.duration;
        if (activeAudio.paused) activeAudio.play().catch(() => {});
      } else {
        loadAndPlayChapterAudio(get, set, targetVerseNum);
      }
    }
  },

  jumpToVerseIndex: (idx) => {
    const s = get();
    if (idx >= 0 && idx < s.verses.length) {
      set({ currentIndex: idx });
      const targetVerseNum = s.verses[idx]?.v || 1;
      const cue = s.cues.find((c) => c.verse === targetVerseNum);
      if (activeAudio && cue) {
        activeAudio.currentTime = cue.start;
        if (activeAudio.paused) activeAudio.play().catch(() => {});
      } else {
        loadAndPlayChapterAudio(get, set, targetVerseNum);
      }
    }
  },

  seekToTime: (seconds) => {
    if (activeAudio && !isNaN(seconds)) {
      activeAudio.currentTime = Math.max(0, Math.min(activeAudio.duration || seconds, seconds));
      set({ currentTime: activeAudio.currentTime });
    }
  },

  setRate: (rate) => {
    const clamped = Math.max(0.5, Math.min(2.0, Number(rate.toFixed(2))));
    set({ rate: clamped });
    saveAudioPrefs({ rate: clamped });
    if (activeAudio) {
      activeAudio.playbackRate = clamped;
    }
  },

  setEditionId: (editionId) => {
    const s = get();
    if (s.editionId === editionId) return;
    set({ editionId });
    saveAudioPrefs({ editionId });
    if (s.isOpen) {
      const currentVerseNum = s.verses[s.currentIndex]?.v || 1;
      const activePlanItem =
        s.playbackMode === 'plan_loop' ? s.planQueue[s.planQueueIndex] : undefined;
      loadAndPlayChapterAudio(
        get,
        set,
        currentVerseNum,
        activePlanItem?.verseEnd
      );
    }
  },

  setAutoNextChapter: (enabled) => {
    set({ autoNextChapter: enabled });
    saveAudioPrefs({ autoNextChapter: enabled });
  },

  setLyricFocusMode: (enabled) => {
    set({ lyricFocusMode: enabled });
    saveAudioPrefs({ lyricFocusMode: enabled });
  },

  setImmersiveCardOpen: (open) => {
    set({ immersiveCardOpen: open });
  },

  stopAndClose: () => {
    loadSessionId++;
    cleanupAudioElement();
    set({
      isOpen: false,
      isPlaying: false,
      isPaused: false,
      isLoadingAudio: false,
      audioError: null,
      immersiveCardOpen: false,
      currentTime: 0,
      duration: 0,
    });
  },
}));
