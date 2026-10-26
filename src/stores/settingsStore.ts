import { create } from 'zustand';
import { convertByScript } from '../lib/opencc';

export type ThemeMode = 'light' | 'dark' | 'sepia';
export type ScriptMode = 'simp' | 'trad';
export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ReadingLayoutMode = 'paragraph' | 'verse';

interface SettingsState {
  theme: ThemeMode;
  script: ScriptMode;
  fontSize: FontSizeScale;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  showVerseNumbers: boolean;
  readingLayout: ReadingLayoutMode;
  sidebarCollapsed: boolean;

  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  setScript: (script: ScriptMode) => void;
  toggleScript: () => void;
  setFontSize: (fontSize: FontSizeScale) => void;
  setLineHeight: (lh: 'normal' | 'relaxed' | 'loose') => void;
  setShowVerseNumbers: (show: boolean) => void;
  setReadingLayout: (layout: ReadingLayoutMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  t: (simpText: string) => string;
}

const STORAGE_KEY = 'dailybible_settings_v1';

function loadInitialSettings() {
  if (typeof window === 'undefined') {
    return {
      theme: 'light' as ThemeMode,
      script: 'simp' as ScriptMode,
      fontSize: 'lg' as FontSizeScale,
      lineHeight: 'relaxed' as const,
      showVerseNumbers: true,
      readingLayout: 'paragraph' as ReadingLayoutMode,
      sidebarCollapsed: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: (parsed.theme as ThemeMode) || 'light',
        script: (parsed.script as ScriptMode) || 'simp',
        fontSize: (parsed.fontSize as FontSizeScale) || 'lg',
        lineHeight: parsed.lineHeight || 'relaxed',
        showVerseNumbers: parsed.showVerseNumbers ?? true,
        readingLayout: (parsed.readingLayout as ReadingLayoutMode) || 'paragraph',
        sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
      };
    }
  } catch {
    // ignore
  }
  return {
    theme: 'light' as ThemeMode,
    script: 'simp' as ScriptMode,
    fontSize: 'lg' as FontSizeScale,
    lineHeight: 'relaxed' as const,
    showVerseNumbers: true,
    readingLayout: 'paragraph' as ReadingLayoutMode,
    sidebarCollapsed: false,
  };
}

function applyDomTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

const initial = loadInitialSettings();
applyDomTheme(initial.theme);

function saveToStorage(state: Partial<SettingsState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {
    // ignore
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,

  setTheme: (theme) => {
    applyDomTheme(theme);
    saveToStorage({ theme });
    set({ theme });
  },

  cycleTheme: () => {
    const order: ThemeMode[] = ['light', 'sepia', 'dark'];
    const next = order[(order.indexOf(get().theme) + 1) % order.length];
    get().setTheme(next);
  },

  setScript: (script) => {
    saveToStorage({ script });
    set({ script });
  },

  toggleScript: () => {
    const next: ScriptMode = get().script === 'simp' ? 'trad' : 'simp';
    get().setScript(next);
  },

  setFontSize: (fontSize) => {
    saveToStorage({ fontSize });
    set({ fontSize });
  },

  setLineHeight: (lineHeight) => {
    saveToStorage({ lineHeight });
    set({ lineHeight });
  },

  setShowVerseNumbers: (showVerseNumbers) => {
    saveToStorage({ showVerseNumbers });
    set({ showVerseNumbers });
  },

  setReadingLayout: (readingLayout) => {
    saveToStorage({ readingLayout });
    set({ readingLayout });
  },

  setSidebarCollapsed: (sidebarCollapsed) => {
    saveToStorage({ sidebarCollapsed });
    set({ sidebarCollapsed });
  },

  t: (simpText: string) => {
    return convertByScript(simpText, get().script);
  },
}));
