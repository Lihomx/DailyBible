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
  Maximize2,
  Minimize2,
  Sparkles,
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
    playbackMode,
    planDayTitle,
    planQueue,
    planQueueIndex,
    lyricFocusMode,
    immersiveCardOpen,
    currentTime,
    duration,
    togglePlayPause,
    prevVerse,
    nextVerse,
    jumpToPlanQueueItem,
    seekToTime,
    setRate,
    setEditionId,
    setAutoNextChapter,
    setLyricFocusMode,
    setImmersiveCardOpen,
    stopAndClose,
  } = useTtsStore();

  const { script, t } = useSettingsStore();

  if (!isOpen || verses.length === 0) return null;

  const currentVerse = verses[currentIndex] || verses[0];
  const prevVerseItem = currentIndex > 0 ? verses[currentIndex - 1] : null;
  const nextVerseItem =
    currentIndex + 1 < verses.length ? verses[currentIndex + 1] : null;

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const cycleRate = () => {
    const idx = SPEED_OPTIONS.indexOf(rate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setRate(next);
  };

  return (
    <>
      {/* Mode 4: Fullscreen Big-Character Listening Card (can be toggled anytime) */}
      {immersiveCardOpen && (
        <div className="fixed inset-0 z-50 theme-card flex flex-col justify-between p-5 sm:p-10 overflow-y-auto">
          {/* Top Bar: Edition + Mode Switch + Close */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-brand text-white text-xs font-bold flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" />
                <span>
                  {playbackMode === 'plan_loop'
                    ? t('今日计划循环听经')
                    : t('大字沉浸听经')}
                </span>
              </span>
              <span className="text-xs sm:text-sm font-bold">
                {bookName} {t('第')}{chapter}{t('章')} ({currentIndex + 1}/{verses.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setImmersiveCardOpen(false)}
                className="px-3 py-1.5 rounded-xl border theme-border text-xs font-semibold flex items-center gap-1.5 hover:border-brand hover:text-brand transition"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>{t('切换回经文页跟读 (模式1)')}</span>
              </button>
              <button
                onClick={stopAndClose}
                className="p-1.5 rounded-xl border theme-border theme-text-muted hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Plan Queue Chips when in Victorious Plan Loop Mode */}
          {playbackMode === 'plan_loop' && planQueue.length > 0 && (
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b theme-border">
              <span className="text-xs font-semibold text-brand shrink-0 mr-1">
                {t(planDayTitle || '今日待读循环')}:
              </span>
              {planQueue.map((item, idx) => {
                const active = idx === planQueueIndex;
                return (
                  <button
                    key={`${item.part}-${item.bookId}-${item.chapter}`}
                    onClick={() => jumpToPlanQueueItem(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                      active
                        ? 'bg-brand text-white shadow-sm font-bold'
                        : 'theme-elevated border theme-border opacity-75 hover:opacity-100'
                    }`}
                  >
                    {script === 'trad' ? item.labelTrad : item.labelSimp}
                  </button>
                );
              })}
            </div>
          )}

          {/* Center Big-Character Verse Display (Apple Music Lyric Style) */}
          <div className="my-auto py-8 max-w-2xl mx-auto w-full text-center space-y-6">
            {/* Previous verse preview */}
            {prevVerseItem ? (
              <div
                onClick={prevVerse}
                className="text-sm sm:text-base theme-text-muted opacity-45 hover:opacity-75 cursor-pointer transition line-clamp-2 px-4"
              >
                <sup className="mr-1">{prevVerseItem.v}</sup>
                {prevVerseItem.t.replace(/\u3000/g, ' ')}
              </div>
            ) : (
              <div className="h-8" />
            )}

            {/* Current Active Verse Card */}
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-brand/40 bg-brand/[0.06] shadow-lg space-y-3 transition-all">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-xs font-bold">
                <span>
                  {bookName} {chapter}:{currentVerse?.v || 1}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed tracking-wide">
                {currentVerse?.t.replace(/\u3000/g, ' ')}
              </p>
            </div>

            {/* Next verse preview */}
            {nextVerseItem ? (
              <div
                onClick={nextVerse}
                className="text-sm sm:text-base theme-text-muted opacity-45 hover:opacity-75 cursor-pointer transition line-clamp-2 px-4"
              >
                <sup className="mr-1">{nextVerseItem.v}</sup>
                {nextVerseItem.t.replace(/\u3000/g, ' ')}
              </div>
            ) : (
              <div className="h-8" />
            )}
          </div>

          {/* Bottom Fullscreen Controls */}
          <div className="max-w-xl mx-auto w-full space-y-4 pt-3 border-t theme-border">
            {/* Edition switcher */}
            <div className="flex items-center justify-center gap-2">
              {AUDIO_EDITIONS.map((ed) => {
                const active = editionId === ed.id;
                return (
                  <button
                    key={ed.id}
                    onClick={() => setEditionId(ed.id as AudioEditionId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      active
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'theme-border theme-text-muted'
                    }`}
                  >
                    {t(ed.label)}
                  </button>
                );
              })}
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-3 text-xs theme-text-muted">
              <span className="w-10 text-right font-mono">{formatTime(currentTime)}</span>
              <div
                onClick={(e) => {
                  if (!duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(
                    0,
                    Math.min(1, (e.clientX - rect.left) / rect.width)
                  );
                  seekToTime(ratio * duration);
                }}
                className="flex-1 h-2.5 rounded-full bg-black/10 dark:bg-white/15 cursor-pointer relative overflow-hidden"
              >
                <div
                  className="h-full bg-brand rounded-full transition-all duration-150"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="w-10 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Play / Skip / Speed buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevVerse}
                disabled={currentIndex <= 0}
                className="p-3 rounded-full border theme-border disabled:opacity-30"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg hover:bg-brand-hover transition"
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={nextVerse}
                disabled={currentIndex >= verses.length - 1}
                className="p-3 rounded-full border theme-border disabled:opacity-30"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={cycleRate}
                className="px-3 py-2 rounded-xl border theme-border text-xs font-bold flex items-center gap-1"
              >
                <Gauge className="w-4 h-4" />
                <span>{rate}x</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Floating Bottom Player Bar */}
      <div className="fixed bottom-14 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96vw] max-w-3xl theme-card border shadow-2xl rounded-2xl px-3 sm:px-4 py-2.5 transition-all space-y-1.5">
        {/* Top row: Edition Switcher + Follow Mode 1 / Mode 4 Switcher + Loop Status */}
        <div className="flex items-center justify-between gap-1.5 text-[11px] sm:text-xs border-b theme-border pb-1.5 overflow-x-auto no-scrollbar">
          {/* Edition Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <Headphones className="w-3.5 h-3.5 text-brand shrink-0 hidden sm:inline" />
            <div className="inline-flex rounded-lg border theme-border p-0.5 bg-black/[0.02] dark:bg-white/[0.03]">
              {AUDIO_EDITIONS.map((ed) => {
                const active = editionId === ed.id;
                return (
                  <button
                    key={ed.id}
                    onClick={() => setEditionId(ed.id as AudioEditionId)}
                    title={t(ed.label)}
                    className={`px-2 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                      active
                        ? 'bg-brand text-white shadow-sm'
                        : 'theme-text-muted hover:text-current'
                    }`}
                  >
                    <span className="sm:hidden">{t(ed.shortLabel)}</span>
                    <span className="hidden sm:inline">{t(ed.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right toggles: Mode 1 (Lyric Focus), Mode 4 (Big Card), Loop Mode */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mode 1: Page Lyric Focus toggle */}
            <button
              onClick={() => setLyricFocusMode(!lyricFocusMode)}
              title={t('切换模式1：页面歌词聚焦高亮')}
              className={`px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 transition whitespace-nowrap ${
                lyricFocusMode
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'theme-border theme-text-muted'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('聚焦跟读')}</span>
            </button>

            {/* Mode 4: Fullscreen Big Card toggle */}
            <button
              onClick={() => setImmersiveCardOpen(true)}
              title={t('切换模式4：全屏大字听经卡片')}
              className="px-2 py-0.5 rounded-lg border theme-border hover:border-brand hover:text-brand font-medium flex items-center gap-1 transition whitespace-nowrap"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{t('大字卡片')}</span>
            </button>

            {/* Loop Status: Plan Loop vs Normal Auto-Next Chapter */}
            {playbackMode === 'plan_loop' ? (
              <span
                title={t('当前正在循环播放今日得胜读经计划待读经文')}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 whitespace-nowrap"
              >
                <Repeat className="w-3 h-3" />
                <span>
                  {t('今日计划循环')} ({planQueueIndex + 1}/{planQueue.length})
                </span>
              </span>
            ) : (
              <button
                onClick={() => setAutoNextChapter(!autoNextChapter)}
                className={`px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 transition whitespace-nowrap ${
                  autoNextChapter
                    ? 'border-brand/50 bg-brand/10 text-brand'
                    : 'theme-border theme-text-muted hover:border-brand'
                }`}
              >
                <Repeat className="w-3 h-3" />
                <span>{autoNextChapter ? t('自动下一章') : t('读完本章停')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Audio Timeline Scrub Bar */}
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] theme-text-muted">
          <span className="w-8 text-right font-mono">{formatTime(currentTime)}</span>
          <div
            onClick={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left) / rect.width)
              );
              seekToTime(ratio * duration);
            }}
            className="flex-1 h-1.5 sm:h-2 rounded-full bg-black/10 dark:bg-white/15 cursor-pointer relative overflow-hidden"
          >
            <div
              className="h-full bg-brand rounded-full transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="w-8 font-mono">{formatTime(duration)}</span>
        </div>

        {/* Main row: Verse text + Playback controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Current reading info (clicking opens Mode 4 Big Card on mobile) */}
          <div
            onClick={() => setImmersiveCardOpen(true)}
            title={t('点击展开大字听经卡片')}
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
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
              <p className="text-xs truncate opacity-90">
                {currentVerse?.t.replace(/\u3000/g, ' ')}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prevVerse}
              disabled={currentIndex <= 0}
              title={t('上一节')}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              title={isPlaying ? t('暂停朗读') : t('继续朗读')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition shadow-sm"
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
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={cycleRate}
              title={t('切换语速')}
              className="px-2 py-1 rounded-lg text-xs font-medium border theme-border hover:border-brand hover:text-brand transition flex items-center gap-0.5"
            >
              <Gauge className="w-3 h-3 hidden sm:inline" />
              <span>{rate}x</span>
            </button>

            <button
              onClick={stopAndClose}
              title={t('关闭朗读')}
              className="p-1 rounded-lg theme-text-muted hover:text-red-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
