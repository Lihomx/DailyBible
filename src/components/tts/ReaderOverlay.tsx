import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Gauge,
  Repeat,
  Loader2,
  Headphones,
} from 'lucide-react';
import {
  useTtsStore,
  AUDIO_EDITIONS,
  AudioEditionId,
} from '../../stores/ttsStore';
import { useSettingsStore } from '../../stores/settingsStore';

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ReaderOverlay: React.FC = () => {
  const {
    isOpen,
    isPlaying,
    isLoadingAudio,
    audioError,
    bookName,
    chapter,
    verses,
    currentIndex,
    rate,
    editionId,
    autoNextChapter,
    currentTime,
    duration,
    togglePlayPause,
    prevVerse,
    nextVerse,
    seekToTime,
    setRate,
    setEditionId,
    setAutoNextChapter,
    stopAndClose,
  } = useTtsStore();

  const { t } = useSettingsStore();

  if (!isOpen || verses.length === 0) return null;

  const currentVerse = verses[currentIndex] || verses[0];
  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const cycleRate = () => {
    const idx = SPEED_OPTIONS.indexOf(rate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setRate(next);
  };

  return (
    <div className="fixed bottom-16 md:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-3xl theme-card border shadow-2xl rounded-2xl px-4 py-3 transition-all space-y-2">
      {/* Top row: Edition Switcher + Progress Bar + Auto-Next Chapter Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b theme-border pb-2">
        {/* Audio Edition Selector: 和合本100周年朗读版 vs 和合本(新旧约)磐石聆听版 */}
        <div className="flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-brand shrink-0" />
          <div className="inline-flex rounded-lg border theme-border p-0.5 bg-black/[0.02] dark:bg-white/[0.03]">
            {AUDIO_EDITIONS.map((ed) => {
              const active = editionId === ed.id;
              return (
                <button
                  key={ed.id}
                  onClick={() => setEditionId(ed.id as AudioEditionId)}
                  title={t(ed.label)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    active
                      ? 'bg-brand text-white shadow-sm'
                      : 'theme-text-muted hover:text-current'
                  }`}
                >
                  {t(ed.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-advance Next Chapter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoNextChapter(!autoNextChapter)}
            title={
              autoNextChapter
                ? t('当前：读完本章自动连播下一章（点击切换为读完本章停止）')
                : t('当前：读完本章自动停止（点击切换为自动连播下一章）')
            }
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
              autoNextChapter
                ? 'border-brand/50 bg-brand/10 text-brand'
                : 'theme-border theme-text-muted hover:border-brand'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {autoNextChapter ? t('自动下一章') : t('读完本章停')}
            </span>
          </button>
        </div>
      </div>

      {/* Audio Timeline Scrub Bar */}
      <div className="flex items-center gap-2.5 text-[11px] theme-text-muted">
        <span className="w-9 text-right font-mono">{formatTime(currentTime)}</span>
        <div
          onClick={(e) => {
            if (!duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seekToTime(ratio * duration);
          }}
          className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/15 cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-brand rounded-full transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="w-9 font-mono">{formatTime(duration)}</span>
      </div>

      {/* Main row: Verse text + Playback controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Current reading info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            {isLoadingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <span>
                {bookName} {chapter}:{currentVerse?.v || 1}
              </span>
              <span className="theme-text-muted font-normal">
                ({currentIndex + 1}/{verses.length})
              </span>
              {audioError && (
                <span className="text-red-500 font-normal truncate">
                  · {t(audioError)}
                </span>
              )}
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
            {isLoadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
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
