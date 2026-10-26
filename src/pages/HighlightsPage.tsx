import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Highlighter,
  Trash2,
  Download,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { BOOK_BY_ID, getBookName } from '../data/books';
import { loadChapterVerses } from '../lib/bible';
import { useSettingsStore } from '../stores/settingsStore';
import {
  useUserDataStore,
  HighlightColor,
  HighlightRecord,
} from '../stores/userDataStore';

const COLOR_LABELS: Record<HighlightColor, { name: string; dot: string }> = {
  yellow: { name: '黄色高亮', dot: 'bg-yellow-300' },
  green: { name: '绿色高亮', dot: 'bg-green-300' },
  blue: { name: '蓝色高亮', dot: 'bg-blue-300' },
  pink: { name: '粉色高亮', dot: 'bg-pink-300' },
  purple: { name: '紫色高亮', dot: 'bg-purple-300' },
};

export const HighlightsPage: React.FC = () => {
  const { script, t } = useSettingsStore();
  const { highlights, setVerseHighlight } = useUserDataStore();
  const [colorFilter, setColorFilter] = useState<'all' | HighlightColor>('all');
  const [resolvedTexts, setResolvedTexts] = useState<Record<string, string>>({});

  const list: HighlightRecord[] = Object.values(highlights).sort(
    (a, b) => b.updated_at - a.updated_at
  );

  // Backfill verseText if any highlight was saved without text or in another script
  useEffect(() => {
    let cancelled = false;
    async function resolveAll() {
      const map: Record<string, string> = {};
      for (const item of list) {
        const key = `${item.book}.${item.chapter}.${item.verse}`;
        try {
          const chVerses = await loadChapterVerses(
            item.book,
            item.chapter,
            script
          );
          const found = chVerses.find((v) => v.v === item.verse);
          if (found) map[key] = found.t;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setResolvedTexts(map);
    }
    if (list.length > 0) resolveAll();
    return () => {
      cancelled = true;
    };
  }, [highlights, script]);

  const filtered = list.filter((item) =>
    colorFilter === 'all' ? true : item.color === colorFilter
  );

  const handleExportTxt = () => {
    const lines = filtered.map((item) => {
      const key = `${item.book}.${item.chapter}.${item.verse}`;
      const bName = getBookName(item.book, script);
      const vText = resolvedTexts[key] || item.verseText || '';
      return `${bName} ${item.chapter}:${item.verse} [${t(
        COLOR_LABELS[item.color].name
      )}]\n${vText}`;
    });
    const blob = new Blob([lines.join('\n\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-bible-highlights-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Highlighter className="w-6 h-6 text-brand" />
            <span>
              {t('我的高亮经文')} ({filtered.length})
            </span>
          </h1>
          <p className="text-xs sm:text-sm theme-text-muted mt-1">
            {t('在阅读圣经时点击任意经文即可标记 5 种颜色高亮，支持按颜色筛选与导出。')}
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            onClick={handleExportTxt}
            className="px-3.5 py-2 rounded-xl border theme-border theme-card text-xs font-semibold flex items-center gap-1.5 hover:border-brand hover:text-brand transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('导出高亮经文')}</span>
          </button>
        )}
      </div>

      {/* Color Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 theme-text-muted font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>{t('按颜色筛选：')}</span>
        </span>
        <button
          onClick={() => setColorFilter('all')}
          className={`px-3 py-1.5 rounded-xl border font-semibold ${
            colorFilter === 'all'
              ? 'bg-brand text-white border-brand'
              : 'theme-card theme-border'
          }`}
        >
          {t('全部')} ({list.length})
        </button>

        {(Object.keys(COLOR_LABELS) as HighlightColor[]).map((c) => (
          <button
            key={c}
            onClick={() => setColorFilter(c)}
            className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 ${
              colorFilter === c
                ? 'border-brand ring-2 ring-brand/20 font-semibold'
                : 'theme-card theme-border'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full ${COLOR_LABELS[c].dot} border border-black/15`} />
            <span>{t(COLOR_LABELS[c].name)}</span>
          </button>
        ))}
      </div>

      {/* Highlight List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const key = `${item.book}.${item.chapter}.${item.verse}`;
          const bookName = getBookName(item.book, script);
          const text = resolvedTexts[key] || item.verseText || '';

          return (
            <div
              key={item.id}
              className="rounded-2xl border theme-border theme-card p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      COLOR_LABELS[item.color]?.dot || 'bg-yellow-300'
                    }`}
                  />
                  <Link
                    to={`/bible/${item.book}.${item.chapter}?v=${item.verse}`}
                    className="font-bold text-sm text-brand hover:underline flex items-center gap-1"
                  >
                    <span>
                      {bookName} {item.chapter}:{item.verse}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex items-center gap-3 theme-text-muted">
                  <span>
                    {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() =>
                      setVerseHighlight(item.book, item.chapter, item.verse, null)
                    }
                    title={t('移除高亮')}
                    className="hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className={`p-2.5 rounded-xl hl-${item.color} text-sm sm:text-base leading-relaxed`}>
                {text}
              </p>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center theme-card border theme-border rounded-2xl space-y-3">
            <p className="text-sm theme-text-muted">
              {t('暂无高亮经文。去阅读圣经并点击任意经文即可添加高亮标记！')}
            </p>
            <Link
              to="/bible/gen.1"
              className="inline-block px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold"
            >
              {t('前往阅读圣经')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
