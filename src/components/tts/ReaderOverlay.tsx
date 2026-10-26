import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Gauge,
} from 'lucide-react';
import { useTtsStore } from '../../stores/ttsStore';
import { useSettingsStore } from '../../stores/settingsStore';

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const ReaderOverlay: React.FC = () => {
  const {
    isOpen,
    isPlaying,
    bookName,
    chapter,
    verses,
    currentIndex,
    rate,
    togglePlayPause,
    prevVerse,
    nextVerse,
    setRate,
    stopAndClose,
  } = useTtsStore();

  const { t } = useSettingsStore();

  if (!isOpen || verses.length === 0) return null;

  const currentVerse = verses[currentIndex] || verses[0];

  const cycleRate = () => {
    const idx = SPEED_OPTIONS.indexOf(rate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setRate(next);
  };

  return (
    <div className="fixed bottom-16 md:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl theme-card border shadow-xl rounded-2xl px-4 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Current reading info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <span>
                {bookName} {chapter}:{currentVerse?.v || 1}
              </span>
              <span className="theme-text-muted font-normal">
                ({currentIndex + 1}/{verses.length})
              </span>
            </div>
            <p className="text-xs sm:text-sm truncate opacity-90">
              {currentVerse?.t.replace(/\u3000/g, ' ')}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={prevVerse}
            disabled={currentIndex <= 0}
            title={t('上一节')}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            title={isPlaying ? t('暂停朗读') : t('继续朗读')}
            className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={nextVerse}
            disabled={currentIndex >= verses.length - 1}
            title={t('下一节')}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={cycleRate}
            title={t('切换语速')}
            className="px-2 py-1 rounded-lg text-xs font-medium border theme-border hover:border-brand hover:text-brand transition flex items-center gap-1"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{rate}x</span>
          </button>

          <button
            onClick={stopAndClose}
            title={t('关闭朗读')}
            className="p-1.5 rounded-lg theme-text-muted hover:text-red-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
