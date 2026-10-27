import { create } from 'zustand';
import { VerseItem } from '../lib/bible';

export interface TtsState {
  isOpen: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: VerseItem[];
  currentIndex: number; // index into verses array
  rate: number; // 0.5 .. 2.0

  startReading: (params: {
    bookId: string;
    bookName: string;
    chapter: number;
    verses: VerseItem[];
    startVerseNumber?: number;
  }) => void;
  pauseReading: () => void;
  resumeReading: () => void;
  togglePlayPause: () => void;
  prevVerse: () => void;
  nextVerse: () => void;
  jumpToVerseIndex: (idx: number) => void;
  setRate: (rate: number) => void;
  stopAndClose: () => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let speakSessionId = 0;

function stopActivePlayback() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.src = '';
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  activeUtterance = null;
}

function pickChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === 'zh-CN' && v.name.includes('Natural')) ||
    voices.find((v) => v.lang === 'zh-CN' && v.localService) ||
    voices.find((v) => v.lang === 'zh-CN') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ||
    null
  );
}

function playCloudTtsFallback(
  textToSpeak: string,
  session: number,
  get: () => TtsState,
  set: (partial: Partial<TtsState>) => void
) {
  const state = get();
  const encoded = encodeURIComponent(textToSpeak.slice(0, 180));
  const urls = [
    `https://dict.youdao.com/dictvoice?audio=${encoded}&le=zh`,
    `https://fanyi.baidu.com/gettts?lan=zh&text=${encoded}&spd=5&source=web`,
  ];

  let urlIndex = 0;

  const tryPlayNextUrl = () => {
    if (session !== speakSessionId) return;
    if (urlIndex >= urls.length) {
      set({ isPlaying: false, isPaused: false });
      return;
    }

    const audio = new Audio(urls[urlIndex++]);
    audio.playbackRate = state.rate;
    activeAudio = audio;

    audio.onended = () => {
      if (session !== speakSessionId) return;
      const latest = get();
      if (!latest.isPlaying || latest.isPaused) return;
      if (latest.currentIndex + 1 < latest.verses.length) {
        set({ currentIndex: latest.currentIndex + 1 });
        speakCurrentVerse(get, set);
      } else {
        set({ isPlaying: false, isPaused: false });
      }
    };

    audio.onerror = () => {
      if (session !== speakSessionId) return;
      tryPlayNextUrl();
    };

    audio.play().catch(() => {
      if (session !== speakSessionId) return;
      tryPlayNextUrl();
    });
  };

  tryPlayNextUrl();
}

function speakCurrentVerse(get: () => TtsState, set: (partial: Partial<TtsState>) => void) {
  if (typeof window === 'undefined') return;

  const session = ++speakSessionId;
  stopActivePlayback();

  const state = get();
  if (!state.isOpen || state.currentIndex < 0 || state.currentIndex >= state.verses.length) {
    set({ isPlaying: false, isPaused: false });
    return;
  }

  const verse = state.verses[state.currentIndex];
  const cleanText = verse.t.replace(/\u3000/g, '').trim();
  const textToSpeak =
    state.currentIndex === 0
      ? `${state.bookName} 第${state.chapter}章。 ${cleanText}`
      : cleanText;

  set({ isPlaying: true, isPaused: false });

  if (!('speechSynthesis' in window)) {
    playCloudTtsFallback(textToSpeak, session, get, set);
    return;
  }

  const startUtterance = () => {
    if (session !== speakSessionId) return;
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = 'zh-CN';
    utter.rate = state.rate;
    const voice = pickChineseVoice();
    if (voice) {
      utter.voice = voice;
    }

    let started = false;
    utter.onstart = () => {
      started = true;
    };

    utter.onend = () => {
      if (session !== speakSessionId) return;
      const latest = get();
      if (!latest.isPlaying || latest.isPaused) return;
      if (latest.currentIndex + 1 < latest.verses.length) {
        set({ currentIndex: latest.currentIndex + 1 });
        speakCurrentVerse(get, set);
      } else {
        set({ isPlaying: false, isPaused: false });
      }
    };

    utter.onerror = (ev) => {
      if (session !== speakSessionId) return;
      if (ev.error === 'canceled' || ev.error === 'interrupted') return;
      playCloudTtsFallback(textToSpeak, session, get, set);
    };

    activeUtterance = utter;
    window.speechSynthesis.speak(utter);

    // Watchdog: if browser speechSynthesis fails to start within 1200ms (e.g. missing OS Chinese voice pack), fallback to online TTS audio
    setTimeout(() => {
      if (session !== speakSessionId) return;
      const latest = get();
      if (!latest.isPlaying || latest.isPaused) return;
      if (!started && !window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
        playCloudTtsFallback(textToSpeak, session, get, set);
      }
    }, 1200);
  };

  // Delay 40ms after cancel() to avoid Chrome/Edge Windows bug where cancel()+speak() in same tick drops utterance
  setTimeout(startUtterance, 40);
}

export const useTtsStore = create<TtsState>((set, get) => ({
  isOpen: false,
  isPlaying: false,
  isPaused: false,
  bookId: 'gen',
  bookName: '创世记',
  chapter: 1,
  verses: [],
  currentIndex: 0,
  rate: 1.0,

  startReading: ({ bookId, bookName, chapter, verses, startVerseNumber }) => {
    if (!verses || verses.length === 0) return;
    let startIdx = 0;
    if (startVerseNumber !== undefined) {
      const foundIdx = verses.findIndex((v) => v.v === startVerseNumber);
      if (foundIdx >= 0) startIdx = foundIdx;
    }

    set({
      isOpen: true,
      isPlaying: true,
      isPaused: false,
      bookId,
      bookName,
      chapter,
      verses,
      currentIndex: startIdx,
    });

    speakCurrentVerse(get, set);
  },

  pauseReading: () => {
    speakSessionId++;
    stopActivePlayback();
    set({ isPlaying: false, isPaused: true });
  },

  resumeReading: () => {
    set({ isPlaying: true, isPaused: false });
    speakCurrentVerse(get, set);
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
    set({ currentIndex: nextIdx, isPlaying: true, isPaused: false });
    speakCurrentVerse(get, set);
  },

  nextVerse: () => {
    const s = get();
    if (s.currentIndex + 1 < s.verses.length) {
      set({ currentIndex: s.currentIndex + 1, isPlaying: true, isPaused: false });
      speakCurrentVerse(get, set);
    }
  },

  jumpToVerseIndex: (idx) => {
    const s = get();
    if (idx >= 0 && idx < s.verses.length) {
      set({ currentIndex: idx, isPlaying: true, isPaused: false });
      speakCurrentVerse(get, set);
    }
  },

  setRate: (rate) => {
    const clamped = Math.max(0.5, Math.min(2.0, Number(rate.toFixed(2))));
    set({ rate: clamped });
    if (get().isPlaying) {
      speakCurrentVerse(get, set);
    }
  },

  stopAndClose: () => {
    speakSessionId++;
    stopActivePlayback();
    set({ isOpen: false, isPlaying: false, isPaused: false });
  },
}));
