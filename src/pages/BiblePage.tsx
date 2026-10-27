import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize2,
  Minimize2,
  Columns,
  Type,
  Highlighter,
  StickyNote,
  Copy,
  Layers,
  Volume2,
  Check,
  X,
} from 'lucide-react';
import { BIBLE_BOOKS, BOOK_BY_ID, getBookName } from '../data/books';
import { loadChapterVerses, VerseItem } from '../lib/bible';
import { useSettingsStore, FontSizeScale } from '../stores/settingsStore';
import { useUserDataStore, HighlightColor } from '../stores/userDataStore';
import { useTtsStore } from '../stores/ttsStore';

const FONT_SIZE_CLASSES: Record<FontSizeScale, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-[19px]',
  xl: 'text-[22px]',
  '2xl': 'text-2xl',
};

const LINE_HEIGHT_CLASSES: Record<'normal' | 'relaxed' | 'loose', string> = {
  normal: 'leading-relaxed',
  relaxed: 'leading-[2.05]',
  loose: 'leading-[2.4]',
};

const HIGHLIGHT_COLORS: Array<{ color: HighlightColor; label: string; bg: string }> = [
  { color: 'yellow', label: '黄', bg: 'bg-yellow-300' },
  { color: 'green', label: '绿', bg: 'bg-green-300' },
  { color: 'blue', label: '蓝', bg: 'bg-blue-300' },
  { color: 'pink', label: '粉', bg: 'bg-pink-300' },
  { color: 'purple', label: '紫', bg: 'bg-purple-300' },
];

export const BiblePage: React.FC = () => {
  const { bookChapter = 'gen.1' } = useParams<{ bookChapter: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse URL like "gen.1" or "gen.1.cunps"
  const parts = bookChapter.split('.');
  const rawBookId = (parts[0] || 'gen').toLowerCase();
  const bookMeta = BOOK_BY_ID[rawBookId] || BOOK_BY_ID['gen'];
  const bookId = bookMeta.id;
  const chapter = Math.max(
    1,
    Math.min(bookMeta.chapters, parseInt(parts[1] || '1', 10) || 1)
  );
  const focusVerse = parseInt(searchParams.get('v') || '0', 10) || 0;

  const {
    script,
    setScript,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    showVerseNumbers,
    setShowVerseNumbers,
    readingLayout,
    setReadingLayout,
    t,
  } = useSettingsStore();

  const {
    highlights,
    notes,
    setVerseHighlight,
    saveNote,
    deleteNote,
    addBatchCopyItems,
    batchCopyItems,
  } = useUserDataStore();

  const {
    isOpen: ttsOpen,
    bookId: ttsBookId,
    chapter: ttsChapter,
    currentIndex: ttsIndex,
    verses: ttsVerses,
    startReading,
  } = useTtsStore();

  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [parallelVerses, setParallelVerses] = useState<VerseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBookId, setPickerBookId] = useState(bookId);
  const [pickerTab, setPickerTab] = useState<'OT' | 'NT'>(bookMeta.testament);
  const [typoOpen, setTypoOpen] = useState(false);
  const [parallelMode, setParallelMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected verses in current chapter (1-based verse numbers)
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>(undefined);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedVerses([]);

    Promise.all([
      loadChapterVerses(bookId, chapter, script),
      parallelMode
        ? loadChapterVerses(bookId, chapter, script === 'simp' ? 'trad' : 'simp')
        : Promise.resolve([]),
    ])
      .then(([mainV, subV]) => {
        if (cancelled) return;
        setVerses(mainV);
        setParallelVerses(subV);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, script, parallelMode]);

  // Scroll to focused verse if ?v= is present
  useEffect(() => {
    if (!loading && focusVerse > 0) {
      setSelectedVerses([focusVerse]);
      const el = document.getElementById(`verse-${focusVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, focusVerse]);

  // Auto-scroll when TTS advances verse in this chapter
  const activeTtsVerseNum =
    ttsOpen && ttsBookId === bookId && ttsChapter === chapter
      ? ttsVerses[ttsIndex]?.v
      : undefined;

  useEffect(() => {
    if (activeTtsVerseNum) {
      const el = document.getElementById(`verse-${activeTtsVerseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTtsVerseNum]);

  const navigateChapter = (targetBookId: string, targetCh: number) => {
    setPickerOpen(false);
    navigate(`/bible/${targetBookId}.${targetCh}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (chapter > 1) {
      navigateChapter(bookId, chapter - 1);
    } else if (bookMeta.index > 1) {
      const prevBook = BIBLE_BOOKS[bookMeta.index - 2];
      navigateChapter(prevBook.id, prevBook.chapters);
    }
  };

  const handleNextChapter = () => {
    if (chapter < bookMeta.chapters) {
      navigateChapter(bookId, chapter + 1);
    } else if (bookMeta.index < 66) {
      const nextBook = BIBLE_BOOKS[bookMeta.index];
      navigateChapter(nextBook.id, 1);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleSelectVerse = (vNum: number) => {
    setSelectedVerses((prev) =>
      prev.includes(vNum)
        ? prev.filter((n) => n !== vNum).sort((a, b) => a - b)
        : [...prev, vNum].sort((a, b) => a - b)
    );
  };

  const chapterNotes = notes.filter(
    (n) => n.book === bookId && n.chapter === chapter
  );

  const applyHighlightToSelected = (color: HighlightColor | null) => {
    for (const vNum of selectedVerses) {
      const vObj = verses.find((it) => it.v === vNum);
      setVerseHighlight(bookId, chapter, vNum, color, vObj?.t);
    }
    setSelectedVerses([]);
  };

  const openNoteEditorForSelected = () => {
    if (selectedVerses.length === 0) return;
    const minV = Math.min(...selectedVerses);
    const maxV = Math.max(...selectedVerses);
    const existing = chapterNotes.find(
      (n) => n.verse_start === minV && n.verse_end === maxV
    );
    setEditingNoteId(existing?.id);
    setNoteDraft(existing?.content || '');
    setNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteDraft.trim() || selectedVerses.length === 0) return;
    const minV = Math.min(...selectedVerses);
    const maxV = Math.max(...selectedVerses);
    const preview = verses
      .filter((v) => v.v >= minV && v.v <= maxV)
      .map((v) => v.t)
      .join(' ')
      .slice(0, 120);

    saveNote({
      id: editingNoteId,
      book: bookId,
      chapter,
      verse_start: minV,
      verse_end: maxV,
      versePreview: preview,
      content: noteDraft.trim(),
    });
    setNoteModalOpen(false);
    setSelectedVerses([]);
  };

  const copySelectedVerses = async (addToTray: boolean) => {
    const chosen = verses.filter((v) => selectedVerses.includes(v.v));
    if (chosen.length === 0) return;

    const items = chosen.map((v) => ({
      id: `${bookId}.${chapter}.${v.v}`,
      bookId,
      bookNameSimp: bookMeta.nameSimp,
      bookNameTrad: bookMeta.nameTrad,
      abbrSimp: bookMeta.abbrSimp,
      abbrTrad: bookMeta.abbrTrad,
      chapter,
      verse: v.v,
      text: v.t,
    }));

    if (addToTray) {
      addBatchCopyItems(items);
      setSelectedVerses([]);
      return;
    }

    const bookDisplayName = getBookName(bookId, script);
    const text =
      `${bookDisplayName} ${chapter}:${chosen.map((c) => c.v).join(',')} ` +
      chosen.map((c) => c.t).join(' ');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 1800);
  };

  // Group verses into natural paragraphs when in 'paragraph' layout mode (wd.bible default)
  const paragraphs: Array<{ heading?: string; items: VerseItem[] }> = [];
  if (readingLayout === 'paragraph' && !parallelMode) {
    for (const v of verses) {
      if (v.h || v.p || paragraphs.length === 0) {
        paragraphs.push({ heading: v.h, items: [v] });
      } else {
        paragraphs[paragraphs.length - 1].items.push(v);
      }
    }
  }

  const bookDisplayName = getBookName(bookId, script);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center">
      {/* Top Reader Action Bar (exact match to wd.bible screenshot) */}
      <div className="w-full max-w-4xl px-4 sm:px-8 pt-6 pb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Book/Chapter Selector + Version Selector */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPickerBookId(bookId);
              setPickerTab(bookMeta.testament);
              setPickerOpen(!pickerOpen);
            }}
            className="px-3.5 py-1.5 rounded-md border theme-border theme-card text-sm font-medium flex items-center gap-2 hover:border-brand transition shadow-sm"
          >
            <span>
              {bookDisplayName} {chapter}
            </span>
            <ChevronDown className="w-4 h-4 theme-text-muted" />
          </button>

          <select
            value={script}
            onChange={(e) => setScript(e.target.value as 'simp' | 'trad')}
            aria-label={t('选择译本')}
            className="px-3 py-1.5 rounded-md border theme-border theme-card text-sm font-medium hover:border-brand transition shadow-sm outline-none cursor-pointer"
          >
            <option value="simp">新标点和合本 (简)</option>
            <option value="trad">新標點和合本 (繁)</option>
          </select>
        </div>

        {/* Right: Play Audio, Fullscreen, Parallel Version, Aa Typography */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (ttsOpen && ttsBookId === bookId && ttsChapter === chapter && selectedVerses.length === 0) {
                useTtsStore.getState().togglePlayPause();
              } else {
                startReading({
                  bookId,
                  bookName: bookDisplayName,
                  chapter,
                  verses,
                  startVerseNumber: selectedVerses[0] || 1,
                });
              }
            }}
            className={`px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shadow-sm ${
              ttsOpen && ttsBookId === bookId && ttsChapter === chapter
                ? 'border-brand bg-brand/10 text-brand'
                : 'theme-border theme-card hover:border-brand hover:text-brand'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {ttsOpen && ttsBookId === bookId && ttsChapter === chapter
                ? t('朗读中')
                : t('播放')}
            </span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="hidden sm:flex px-3 py-1.5 rounded-md border theme-border theme-card text-xs sm:text-sm font-medium items-center gap-1.5 hover:border-brand hover:text-brand transition shadow-sm"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{t('全屏')}</span>
          </button>

          <button
            onClick={() => setParallelMode(!parallelMode)}
            className={`px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shadow-sm ${
              parallelMode
                ? 'border-brand bg-brand text-white'
                : 'theme-border theme-card hover:border-brand hover:text-brand'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{t('+ 版本对照')}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setTypoOpen(!typoOpen)}
              title={t('阅读排版与字号设置')}
              className="px-2.5 py-1.5 rounded-md border theme-border theme-card text-sm font-semibold hover:border-brand hover:text-brand transition shadow-sm flex items-center gap-1"
            >
              <Type className="w-4 h-4" />
              <span>Aa</span>
            </button>

            {/* Typography Popover */}
            {typoOpen && (
              <div className="absolute right-0 mt-2 w-72 theme-card border rounded-2xl shadow-2xl p-4 z-40 space-y-4 text-xs">
                <div className="flex items-center justify-between font-semibold text-sm border-b theme-border pb-2">
                  <span>{t('阅读显示设置')}</span>
                  <button onClick={() => setTypoOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Font Size 5 levels */}
                <div className="space-y-1.5">
                  <div className="theme-text-muted">{t('字号大小 (5档)')}</div>
                  <div className="grid grid-cols-5 gap-1">
                    {(['sm', 'md', 'lg', 'xl', '2xl'] as FontSizeScale[]).map(
                      (sz, idx) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`py-1.5 rounded-lg border font-medium ${
                            fontSize === sz
                              ? 'border-brand bg-brand text-white'
                              : 'theme-border hover:border-brand'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Line Height */}
                <div className="space-y-1.5">
                  <div className="theme-text-muted">{t('行距')}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['normal', '紧凑'],
                        ['relaxed', '标准'],
                        ['loose', '宽松'],
                      ] as const
                    ).map(([lh, label]) => (
                      <button
                        key={lh}
                        onClick={() => setLineHeight(lh)}
                        className={`py-1.5 rounded-lg border font-medium ${
                          lineHeight === lh
                            ? 'border-brand bg-brand text-white'
                            : 'theme-border hover:border-brand'
                        }`}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout mode: Paragraph vs Verse-by-verse */}
                <div className="space-y-1.5">
                  <div className="theme-text-muted">{t('排版方式')}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setReadingLayout('paragraph')}
                      className={`py-1.5 rounded-lg border font-medium ${
                        readingLayout === 'paragraph'
                          ? 'border-brand bg-brand text-white'
                          : 'theme-border hover:border-brand'
                      }`}
                    >
                      {t('段落连排 (微读风格)')}
                    </button>
                    <button
                      onClick={() => setReadingLayout('verse')}
                      className={`py-1.5 rounded-lg border font-medium ${
                        readingLayout === 'verse'
                          ? 'border-brand bg-brand text-white'
                          : 'theme-border hover:border-brand'
                      }`}
                    >
                      {t('逐节分行')}
                    </button>
                  </div>
                </div>

                {/* Show/Hide Verse Numbers */}
                <label className="flex items-center justify-between pt-1 cursor-pointer">
                  <span>{t('显示经文节号')}</span>
                  <input
                    type="checkbox"
                    checked={showVerseNumbers}
                    onChange={(e) => setShowVerseNumbers(e.target.checked)}
                    className="accent-brand w-4 h-4"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book & Chapter Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 p-4">
          <div className="theme-card border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPickerTab('OT')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    pickerTab === 'OT'
                      ? 'bg-brand text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {t('旧约全书 (39卷)')}
                </button>
                <button
                  onClick={() => setPickerTab('NT')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    pickerTab === 'NT'
                      ? 'bg-brand text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {t('新约全书 (27卷)')}
                </button>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
              {/* Left: Books Grid */}
              <div className="p-3 overflow-y-auto border-b md:border-b-0 md:border-r theme-border grid grid-cols-3 gap-1.5 content-start max-h-60 md:max-h-none">
                {BIBLE_BOOKS.filter((b) => b.testament === pickerTab).map((b) => {
                  const selected = b.id === pickerBookId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setPickerBookId(b.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left truncate transition ${
                        selected
                          ? 'bg-brand text-white font-semibold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {script === 'trad' ? b.nameTrad : b.nameSimp}
                    </button>
                  );
                })}
              </div>

              {/* Right: Chapters Grid */}
              <div className="p-4 overflow-y-auto">
                <div className="text-xs font-semibold theme-text-muted mb-2.5">
                  {getBookName(pickerBookId, script)} · {t('选择章数')}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from(
                    { length: BOOK_BY_ID[pickerBookId]?.chapters || 1 },
                    (_, i) => i + 1
                  ).map((chNum) => {
                    const isCurrent = pickerBookId === bookId && chNum === chapter;
                    return (
                      <button
                        key={chNum}
                        onClick={() => navigateChapter(pickerBookId, chNum)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition ${
                          isCurrent
                            ? 'bg-brand text-white border-brand'
                            : 'theme-border hover:border-brand hover:text-brand'
                        }`}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left / Right Floating Chapter Arrow Buttons (wd.bible style) */}
      <button
        onClick={handlePrevChapter}
        title={t('上一章')}
        className="hidden lg:flex fixed left-56 top-1/2 -translate-y-1/2 z-20 w-8 h-9 rounded-md theme-elevated border theme-border items-center justify-center theme-text-muted hover:text-brand hover:border-brand transition shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNextChapter}
        title={t('下一章')}
        className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-20 w-8 h-9 rounded-md theme-elevated border theme-border items-center justify-center theme-text-muted hover:text-brand hover:border-brand transition shadow-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Main Scripture Reading Container */}
      <div
        className={`w-full max-w-3xl px-5 sm:px-10 pb-24 pt-2 ${FONT_SIZE_CLASSES[fontSize]} ${LINE_HEIGHT_CLASSES[lineHeight]}`}
      >
        {loading ? (
          <div className="py-20 text-center theme-text-muted text-sm">
            {t('正在加载经文...')}
          </div>
        ) : readingLayout === 'paragraph' && !parallelMode ? (
          /* Paragraph Flow Mode (matches uploaded wd.bible screenshot 1) */
          <div className="space-y-5">
            {paragraphs.map((para, pIdx) => (
              <div key={pIdx} className="space-y-3">
                {para.heading && (
                  <h2 className="text-xl sm:text-2xl font-bold pt-2 pb-1 tracking-wide">
                    {para.heading}
                  </h2>
                )}
                <p className="text-justify">
                  {para.items.map((v, vIdx) => {
                    const hlKey = `${bookId}.${chapter}.${v.v}`;
                    const hl = highlights[hlKey];
                    const isSelected = selectedVerses.includes(v.v);
                    const isSpeaking = activeTtsVerseNum === v.v;
                    const hasNote = chapterNotes.some(
                      (n) => v.v >= n.verse_start && v.v <= n.verse_end
                    );
                    const inBatch = batchCopyItems.some((b) => b.id === hlKey);

                    return (
                      <span
                        key={`${v.v}-${vIdx}`}
                        id={`verse-${v.v}`}
                        onClick={() => toggleSelectVerse(v.v)}
                        className={`cursor-pointer transition rounded px-0.5 mr-1 ${
                          hl ? `hl-${hl.color}` : ''
                        } ${
                          isSelected
                            ? 'underline decoration-brand decoration-2 underline-offset-4 bg-brand/10'
                            : ''
                        } ${
                          isSpeaking
                            ? 'ring-2 ring-brand bg-brand/15 rounded px-1'
                            : ''
                        }`}
                      >
                        {showVerseNumbers && (
                          <sup className="verse-number">{v.v}</sup>
                        )}
                        <span>{v.t}</span>
                        {hasNote && (
                          <span
                            title={t('该节包含灵修笔记')}
                            className="inline-flex items-center text-brand ml-1 align-middle"
                          >
                            <StickyNote className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                        {inBatch && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand ml-1 align-middle" />
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Verse-by-Verse or Parallel Version Mode */
          <div className="space-y-3">
            {verses.map((v, idx) => {
              const hlKey = `${bookId}.${chapter}.${v.v}`;
              const hl = highlights[hlKey];
              const isSelected = selectedVerses.includes(v.v);
              const isSpeaking = activeTtsVerseNum === v.v;
              const parallelV = parallelVerses[idx];

              return (
                <div key={`${v.v}-${idx}`} id={`verse-${v.v}`} className="space-y-1.5">
                  {v.h && (
                    <h2 className="text-xl font-bold pt-3 pb-1">{v.h}</h2>
                  )}
                  <div
                    onClick={() => toggleSelectVerse(v.v)}
                    className={`p-2 rounded-xl cursor-pointer transition ${
                      hl ? `hl-${hl.color}` : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                    } ${
                      isSelected ? 'ring-2 ring-brand bg-brand/5' : ''
                    } ${isSpeaking ? 'ring-2 ring-brand bg-brand/15' : ''}`}
                  >
                    <div>
                      {showVerseNumbers && (
                        <span className="text-xs font-bold text-blue-500 mr-2">
                          {v.v}
                        </span>
                      )}
                      <span>{v.t}</span>
                    </div>
                    {parallelMode && parallelV && (
                      <div className="text-sm theme-text-muted pt-1 border-t theme-border mt-1">
                        <span className="text-xs mr-1.5">[{parallelV.v}]</span>
                        <span>{parallelV.t}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chapter Notes Section (if any notes exist for this chapter) */}
        {chapterNotes.length > 0 && (
          <div className="mt-10 pt-6 border-t theme-border space-y-3 text-sm">
            <h3 className="font-bold flex items-center gap-2 text-brand">
              <StickyNote className="w-4 h-4" />
              <span>
                {t('本章我的笔记')} ({chapterNotes.length})
              </span>
            </h3>
            {chapterNotes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl theme-elevated border theme-border space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs theme-text-muted">
                  <span className="font-semibold text-brand">
                    {bookDisplayName} {chapter}:
                    {n.verse_start === n.verse_end
                      ? n.verse_start
                      : `${n.verse_start}-${n.verse_end}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedVerses([n.verse_start]);
                        setEditingNoteId(n.id);
                        setNoteDraft(n.content);
                        setNoteModalOpen(true);
                      }}
                      className="hover:text-brand"
                    >
                      {t('编辑')}
                    </button>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="hover:text-red-500"
                    >
                      {t('删除')}
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Prev / Next Chapter Navigation */}
        <div className="mt-12 pt-6 border-t theme-border flex items-center justify-between text-sm">
          <button
            onClick={handlePrevChapter}
            className="px-4 py-2 rounded-xl border theme-border hover:border-brand hover:text-brand flex items-center gap-1.5 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('上一章')}</span>
          </button>

          <span className="text-xs theme-text-muted">
            {bookDisplayName} · {t('第')} {chapter} / {bookMeta.chapters} {t('章')}
          </span>

          <button
            onClick={handleNextChapter}
            className="px-4 py-2 rounded-xl border theme-border hover:border-brand hover:text-brand flex items-center gap-1.5 transition"
          >
            <span>{t('下一章')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Verses Floating Action Toolbar */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 theme-card border shadow-2xl rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 max-w-[95vw]">
          <div className="text-xs font-bold text-brand pr-2 border-r theme-border">
            {bookDisplayName} {chapter}:{selectedVerses.join(',')}
          </div>

          {/* 5 Highlight Colors */}
          <div className="flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 theme-text-muted mr-0.5" />
            {HIGHLIGHT_COLORS.map((hc) => (
              <button
                key={hc.color}
                onClick={() => applyHighlightToSelected(hc.color)}
                title={t(`高亮：${hc.label}`)}
                className={`w-5 h-5 rounded-full ${hc.bg} border border-black/15 hover:scale-110 transition`}
              />
            ))}
            <button
              onClick={() => applyHighlightToSelected(null)}
              title={t('清除高亮')}
              className="text-xs theme-text-muted hover:text-red-500 px-1"
            >
              {t('清除')}
            </button>
          </div>

          {/* Actions: Note, Copy, Batch Copy, Read from here */}
          <div className="flex items-center gap-1.5 border-l theme-border pl-2 text-xs font-medium">
            <button
              onClick={openNoteEditorForSelected}
              className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1"
            >
              <StickyNote className="w-3.5 h-3.5 text-brand" />
              <span>{t('写笔记')}</span>
            </button>

            <button
              onClick={() => copySelectedVerses(false)}
              className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1"
            >
              {copiedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">{t('已复制')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('复制')}</span>
                </>
              )}
            </button>

            <button
              onClick={() => copySelectedVerses(true)}
              className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 text-brand"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('+ 批次复制')}</span>
            </button>

            <button
              onClick={() => {
                startReading({
                  bookId,
                  bookName: bookDisplayName,
                  chapter,
                  verses,
                  startVerseNumber: selectedVerses[0],
                });
                setSelectedVerses([]);
              }}
              className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t('朗读')}</span>
            </button>

            <button
              onClick={() => setSelectedVerses([])}
              className="p-1 theme-text-muted hover:text-current"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="theme-card border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-2.5">
              <div className="font-bold text-sm flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-brand" />
                <span>
                  {bookDisplayName} {chapter}:
                  {Math.min(...selectedVerses) === Math.max(...selectedVerses)
                    ? Math.min(...selectedVerses)
                    : `${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`}{' '}
                  · {t('灵修笔记')}
                </span>
              </div>
              <button onClick={() => setNoteModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={5}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={t('记录神今天借着这段经文对你说的话...')}
              className="w-full rounded-xl border theme-border theme-elevated p-3 text-sm outline-none focus:border-brand"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl border theme-border text-xs font-medium"
              >
                {t('取消')}
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover"
              >
                {t('保存笔记')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
