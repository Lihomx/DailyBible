import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  StickyNote,
  Trash2,
  Edit3,
  Download,
  ExternalLink,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { BIBLE_BOOKS, getBookName } from '../data/books';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore, NoteRecord } from '../stores/userDataStore';

export const NotesPage: React.FC = () => {
  const { script, t } = useSettingsStore();
  const { notes, saveNote, deleteNote } = useUserDataStore();

  const [searchQ, setSearchQ] = useState('');
  const [bookFilter, setBookFilter] = useState('all');

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [formBook, setFormBook] = useState('mat');
  const [formChapter, setFormChapter] = useState(6);
  const [formVerseStart, setFormVerseStart] = useState(33);
  const [formVerseEnd, setFormVerseEnd] = useState(33);
  const [formContent, setFormContent] = useState('');

  const filtered = notes.filter((n) => {
    if (bookFilter !== 'all' && n.book !== bookFilter) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.trim().toLowerCase();
    return (
      n.content.toLowerCase().includes(q) ||
      (n.versePreview || '').toLowerCase().includes(q)
    );
  });

  const openNewNoteModal = () => {
    setEditingNote(null);
    setFormBook('mat');
    setFormChapter(6);
    setFormVerseStart(33);
    setFormVerseEnd(33);
    setFormContent('');
    setModalOpen(true);
  };

  const openEditModal = (n: NoteRecord) => {
    setEditingNote(n);
    setFormBook(n.book);
    setFormChapter(n.chapter);
    setFormVerseStart(n.verse_start);
    setFormVerseEnd(n.verse_end);
    setFormContent(n.content);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;
    saveNote({
      id: editingNote?.id,
      book: formBook,
      chapter: formChapter,
      verse_start: formVerseStart,
      verse_end: Math.max(formVerseStart, formVerseEnd),
      versePreview: editingNote?.versePreview,
      content: formContent.trim(),
    });
    setModalOpen(false);
  };

  const handleExportNotes = () => {
    const md = filtered
      .map((n) => {
        const bName = getBookName(n.book, script);
        const range =
          n.verse_start === n.verse_end
            ? `${n.verse_start}`
            : `${n.verse_start}-${n.verse_end}`;
        return `### ${bName} ${n.chapter}:${range} (${new Date(
          n.updated_at
        ).toLocaleDateString()})\n${
          n.versePreview ? `> ${n.versePreview}\n\n` : ''
        }${n.content}`;
      })
      .join('\n\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-bible-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-brand" />
            <span>
              {t('我的灵修笔记')} ({filtered.length})
            </span>
          </h1>
          <p className="text-xs sm:text-sm theme-text-muted mt-1">
            {t('记录读经亮光、神的话语与主日领受，支持按书卷检索与导出 Markdown。')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={handleExportNotes}
              className="px-3.5 py-2 rounded-xl border theme-border theme-card text-xs font-semibold flex items-center gap-1.5 hover:border-brand"
            >
              <Download className="w-4 h-4" />
              <span>{t('导出笔记')}</span>
            </button>
          )}
          <button
            onClick={openNewNoteModal}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('新建笔记')}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t('搜索笔记内容...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border theme-border theme-card text-sm outline-none focus:border-brand"
          />
        </div>

        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          aria-label={t('按书卷筛选')}
          className="px-3 py-2 rounded-xl border theme-border theme-card text-xs sm:text-sm outline-none"
        >
          <option value="all">{t('全部书卷')}</option>
          {BIBLE_BOOKS.map((b) => (
            <option key={b.id} value={b.id}>
              {script === 'trad' ? b.nameTrad : b.nameSimp}
            </option>
          ))}
        </select>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filtered.map((n) => {
          const bName = getBookName(n.book, script);
          const vRange =
            n.verse_start === n.verse_end
              ? `${n.verse_start}`
              : `${n.verse_start}-${n.verse_end}`;

          return (
            <div
              key={n.id}
              className="rounded-2xl border theme-border theme-card p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <Link
                  to={`/bible/${n.book}.${n.chapter}?v=${n.verse_start}`}
                  className="font-bold text-sm text-brand hover:underline flex items-center gap-1"
                >
                  <span>
                    {bName} {n.chapter}:{vRange}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-3 theme-text-muted">
                  <span>{new Date(n.updated_at).toLocaleString()}</span>
                  <button
                    onClick={() => openEditModal(n)}
                    className="hover:text-brand flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('编辑')}</span>
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('删除')}</span>
                  </button>
                </div>
              </div>

              {n.versePreview && (
                <blockquote className="text-xs theme-text-muted border-l-2 border-brand pl-3 py-0.5">
                  {t(n.versePreview)}
                </blockquote>
              )}

              <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                {t(n.content)}
              </p>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center theme-card border theme-border rounded-2xl space-y-3">
            <p className="text-sm theme-text-muted">
              {t('还没有灵修笔记。您可以在阅读经文时点击经文添加笔记，或点击右上角「新建笔记」。')}
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="theme-card border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b theme-border pb-2.5">
              <h3 className="font-bold text-base">
                {editingNote ? t('编辑灵修笔记') : t('新建灵修笔记')}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block theme-text-muted mb-1">{t('书卷')}</label>
                <select
                  value={formBook}
                  onChange={(e) => setFormBook(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border theme-border theme-elevated"
                >
                  {BIBLE_BOOKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {script === 'trad' ? b.nameTrad : b.nameSimp}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block theme-text-muted mb-1">{t('章')}</label>
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={formChapter}
                  onChange={(e) => setFormChapter(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-2 rounded-xl border theme-border theme-elevated"
                />
              </div>
              <div>
                <label className="block theme-text-muted mb-1">{t('节')}</label>
                <input
                  type="number"
                  min={1}
                  max={176}
                  value={formVerseStart}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setFormVerseStart(v);
                    setFormVerseEnd(v);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border theme-border theme-elevated"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs theme-text-muted mb-1">
                {t('笔记内容')}
              </label>
              <textarea
                rows={5}
                required
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t('写下你的读经心得、亮光或代祷事项...')}
                className="w-full rounded-xl border theme-border theme-elevated p-3 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border theme-border text-xs font-medium"
              >
                {t('取消')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover"
              >
                {t('保存笔记')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
