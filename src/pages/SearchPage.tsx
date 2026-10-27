import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  BookOpen,
  History,
} from 'lucide-react';
import { BIBLE_BOOKS } from '../data/books';
import { loadFullBibleBundle, FullBibleBundle } from '../lib/bible';
import {
  parseScriptureReference,
  executeReferenceQuery,
  MatchedVerseResult,
} from '../lib/refParser';
import { executeKeywordSearch } from '../lib/keywordSearch';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';

const PAGE_SIZE = 50;

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const QUICK_EXAMPLES = [
  { label: '太6:33', desc: '简称查经' },
  { label: '太六33', desc: '中文数字' },
  { label: '馬太福音6:33', desc: '繁体全名' },
  { label: '太1.17-2.4', desc: '跨章区间' },
  { label: '太5-7', desc: '多章连读' },
  { label: '太7.1', desc: '懒人小数点' },
  { label: '使徒7', desc: '前缀整章' },
  { label: '7:1', desc: '全圣经第7章1节' },
  { label: '耶穌 愛 我', desc: '多词精准(AND)' },
  { label: '光-暗', desc: '排除搜寻(-)' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '爱';

  const { script, setScript, t } = useSettingsStore();
  const {
    batchCopyItems,
    toggleBatchCopyItem,
    addBatchCopyItems,
    searchHistory,
    recordSearchQuery,
    recordSearchOpenedVerse,
    fetchSearchHistory,
  } = useUserDataStore();

  const [query, setQuery] = useState(initialQ);
  const [scope, setScope] = useState<string>('all'); // 'all' | 'OT' | 'NT' | bookId
  const [bundle, setBundle] = useState<FullBibleBundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(true);
  const [page, setPage] = useState(1);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const lastRecordedKeywordRef = useRef<string>('');

  useEffect(() => {
    fetchSearchHistory();
  }, [fetchSearchHistory]);

  // Record search query after 1 second of typing inactivity
  useEffect(() => {
    const clean = query.trim();
    if (!clean) return;
    const timer = window.setTimeout(() => {
      if (lastRecordedKeywordRef.current !== clean) {
        lastRecordedKeywordRef.current = clean;
        recordSearchQuery(clean);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [query, recordSearchQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoadingBundle(true);
    loadFullBibleBundle(script)
      .then((b) => {
        if (!cancelled) {
          setBundle(b);
          setLoadingBundle(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingBundle(false);
      });
    return () => {
      cancelled = true;
    };
  }, [script]);

  const searchOutcome = useMemo(() => {
    if (!bundle || !query.trim()) {
      return {
        mode: 'none' as const,
        results: [] as MatchedVerseResult[],
        highlightTerms: [] as string[],
      };
    }

    // 1. Check if input is a scripture reference (e.g. 太6:33, 太1.17-2.4, 7:1)
    const parsedRef = parseScriptureReference(query.trim());
    if (parsedRef) {
      let refResults = executeReferenceQuery(parsedRef, bundle);
      if (scope === 'OT') {
        refResults = refResults.filter(
          (r) => BIBLE_BOOKS.find((b) => b.id === r.bookId)?.testament === 'OT'
        );
      } else if (scope === 'NT') {
        refResults = refResults.filter(
          (r) => BIBLE_BOOKS.find((b) => b.id === r.bookId)?.testament === 'NT'
        );
      } else if (scope !== 'all') {
        refResults = refResults.filter((r) => r.bookId === scope);
      }

      return {
        mode:
          parsedRef.type === 'cross_bible_chapter_verse'
            ? ('cross_ref' as const)
            : ('ref' as const),
        results: refResults,
        highlightTerms: [],
      };
    }

    // 2. Otherwise run multi-keyword + exclusion search
    const kw = executeKeywordSearch(query.trim(), bundle, script, { scope });
    return {
      mode: 'keyword' as const,
      results: kw.results,
      highlightTerms: kw.highlightTerms,
    };
  }, [bundle, query, scope, script]);

  useEffect(() => {
    setPage(1);
  }, [query, scope, script]);

  const totalCount = searchOutcome.results.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pagedResults = searchOutcome.results.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Match current keyword in user's search history
  const currentKeywordRecord = useMemo(() => {
    const clean = query.trim();
    if (!clean) return null;
    return searchHistory.find((h) => h.keyword === clean) || null;
  }, [query, searchHistory]);

  const handleQuickQuery = (qText: string) => {
    setQuery(qText);
    setSearchParams({ q: qText });
    lastRecordedKeywordRef.current = qText.trim();
    recordSearchQuery(qText.trim());
  };

  const renderHighlightedText = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return text;
    const escaped = terms
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);
    if (escaped.length === 0) return text;

    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
        <span key={idx} className="text-brand font-semibold">
          {part}
        </span>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-5">
      {/* Search Input Box (matches wd.bible screenshot 2) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                lastRecordedKeywordRef.current = query.trim();
                recordSearchQuery(query.trim());
              }
            }}
            placeholder={t(
              '输入经文或关键字：如 太6:33、太六33、太1.17-2.4、7:1、耶穌 愛 我、光-暗'
            )}
            className="w-full pl-10 pr-24 py-2.5 rounded-lg border theme-border theme-card text-sm sm:text-base outline-none focus:border-brand shadow-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSearchParams({});
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs theme-text-muted hover:text-brand"
            >
              {t('清空')}
            </button>
          )}
        </div>

        {/* Previous Search Record Banner for Current Keyword */}
        {currentKeywordRecord && (
          <div className="p-3 rounded-xl border border-brand/30 bg-brand/5 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>
                  {t('关键词')}「<strong className="text-brand">{currentKeywordRecord.keyword}</strong>」
                  {t('累计已搜索')} <strong className="text-brand">{currentKeywordRecord.search_count}</strong> {t('次')}
                </span>
                <span className="theme-text-muted">·</span>
                <span className="theme-text-muted">
                  {t('本次/最后搜索：')}{formatTimestamp(currentKeywordRecord.last_searched_at)}
                </span>
                {currentKeywordRecord.previous_searched_at && (
                  <>
                    <span className="theme-text-muted">·</span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      {t('上次搜索时间：')}{formatTimestamp(currentKeywordRecord.previous_searched_at)}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowHistoryPanel((v) => !v)}
                className="inline-flex items-center gap-1 text-brand font-semibold hover:underline"
              >
                <History className="w-3.5 h-3.5" />
                <span>
                  {showHistoryPanel ? t('收起全部搜索记录') : t('查看全部搜索记录')} ({searchHistory.length})
                </span>
              </button>
            </div>

            {currentKeywordRecord.opened_verses &&
              currentKeywordRecord.opened_verses.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-brand/15">
                  <span className="inline-flex items-center gap-1 theme-text-muted">
                    <BookOpen className="w-3.5 h-3.5 text-brand" />
                    <span>{t('该词下曾打开阅读的经文：')}</span>
                  </span>
                  {currentKeywordRecord.opened_verses.map((v) => (
                    <Link
                      key={`${v.id}-${v.opened_at}`}
                      to={`/bible/${v.bookId}.${v.chapter}?v=${v.verse}`}
                      className="px-2 py-0.5 rounded-md bg-brand/15 text-brand font-medium hover:bg-brand hover:text-white transition"
                      title={`${t('打开时间：')}${formatTimestamp(v.opened_at)}`}
                    >
                      {t(v.label)}
                    </Link>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Collapsible Full Search History Panel */}
        {showHistoryPanel && searchHistory.length > 0 && (
          <div className="p-3.5 rounded-xl border theme-border theme-card space-y-2.5 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between border-b theme-border pb-2">
              <h4 className="text-xs font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-brand" />
                <span>{t('我的搜索与打开经文记录')}</span>
              </h4>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-xs theme-text-muted hover:text-brand"
              >
                {t('关闭')}
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.slice(0, 30).map((log) => (
                <div
                  key={log.id || log.keyword}
                  className="p-2.5 rounded-lg theme-elevated border theme-border text-xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleQuickQuery(log.keyword)}
                      className="font-bold text-brand hover:underline text-left"
                    >
                      {log.keyword}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 theme-text-muted text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand font-semibold">
                        {t('已搜')} {log.search_count} {t('次')}
                      </span>
                      <span>
                        {t('最后搜索：')}{formatTimestamp(log.last_searched_at)}
                      </span>
                      {log.previous_searched_at && (
                        <span>
                          {t('上次搜索：')}{formatTimestamp(log.previous_searched_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  {log.opened_verses && log.opened_verses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="theme-text-muted text-[11px]">
                        {t('打开阅读经文：')}
                      </span>
                      {log.opened_verses.map((v) => (
                        <Link
                          key={`${v.id}-${v.opened_at}`}
                          to={`/bible/${v.bookId}.${v.chapter}?v=${v.verse}`}
                          className="px-2 py-0.5 rounded bg-brand/10 text-brand hover:bg-brand hover:text-white transition text-[11px]"
                        >
                          {t(v.label)} ({formatTimestamp(v.opened_at).slice(5, 16)})
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Selects: Version, Scope, Mode Info */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={script}
              onChange={(e) => setScript(e.target.value as 'simp' | 'trad')}
              aria-label={t('选择译本')}
              className="px-3 py-1.5 rounded-md border theme-border theme-card text-xs sm:text-sm outline-none"
            >
              <option value="simp">新标点和合本 (简)</option>
              <option value="trad">新標點和合本 (繁)</option>
            </select>

            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label={t('搜索范围')}
              className="px-3 py-1.5 rounded-md border theme-border theme-card text-xs sm:text-sm outline-none"
            >
              <option value="all">{t('整本圣经 (66卷)')}</option>
              <option value="OT">{t('旧约全书 (39卷)')}</option>
              <option value="NT">{t('新约全书 (27卷)')}</option>
              {BIBLE_BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {script === 'trad' ? b.nameTrad : b.nameSimp}
                </option>
              ))}
            </select>

            {!currentKeywordRecord && searchHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryPanel((v) => !v)}
                className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border theme-border hover:border-brand text-brand"
              >
                <History className="w-3.5 h-3.5" />
                <span>{t('搜索记录')} ({searchHistory.length})</span>
              </button>
            )}
          </div>

          {/* Batch Add Current Page button */}
          {pagedResults.length > 0 && (
            <button
              onClick={() => addBatchCopyItems(pagedResults)}
              className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border theme-border hover:border-brand hover:text-brand transition"
            >
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>
                {t('将本页')} ({pagedResults.length} {t('节')}) {t('加入批次复制')}
              </span>
            </button>
          )}
        </div>

        {/* Smart Search Syntax Chips */}
        <div className="p-3 rounded-xl theme-elevated border theme-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {t('全能查经提示（点击示例即可体验，点击任意结果即可加入右下角批次复制篮）：')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleQuickQuery(ex.label)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                  query === ex.label
                    ? 'bg-brand text-white border-brand font-semibold'
                    : 'theme-card theme-border hover:border-brand'
                }`}
              >
                <span className="font-medium">{ex.label}</span>
                <span className="opacity-70 ml-1">({t(ex.desc)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm theme-text-muted border-b theme-border pb-2.5">
        <div>
          {loadingBundle ? (
            <span>{t('正在初始化离线圣经搜索引擎...')}</span>
          ) : (
            <span>
              {t('在《新标点和合本》中找到')}{' '}
              <strong className="text-brand">{totalCount}</strong>{' '}
              {t('个相关结果')}
              {searchOutcome.mode === 'ref' && (
                <span className="ml-2 px-2 py-0.5 rounded bg-brand/10 text-brand text-xs">
                  {t('经文区间直达')}
                </span>
              )}
              {searchOutcome.mode === 'cross_ref' && (
                <span className="ml-2 px-2 py-0.5 rounded bg-brand/10 text-brand text-xs">
                  {t('全圣经同章同节检索')}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="text-xs">
          {t('点击经文即可加入/移出批次复制')}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {pagedResults.map((item) => {
          const isSelectedForBatch = batchCopyItems.some((b) => b.id === item.id);
          const bookName =
            script === 'trad' ? item.bookNameTrad : item.bookNameSimp;

          return (
            <div
              key={item.id}
              onClick={() => toggleBatchCopyItem(item)}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                isSelectedForBatch
                  ? 'border-brand bg-brand/5 shadow-sm'
                  : 'theme-border theme-card hover:border-brand/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm sm:text-base leading-relaxed flex-1">
                  <span className="font-semibold mr-1.5">
                    {bookName} {item.chapter}:{item.verse}
                  </span>
                  <span className="theme-text-muted mr-1.5">-</span>
                  <span>
                    {renderHighlightedText(
                      item.text,
                      searchOutcome.highlightTerms
                    )}
                  </span>
                </div>

                <div className="shrink-0 pt-0.5">
                  {isSelectedForBatch ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('已选')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs theme-text-muted hover:text-brand">
                      <Circle className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('加入复制')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-links (matches wd.bible "查看上下文") */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-2 flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400"
              >
                <Link
                  to={`/bible/${item.bookId}.${item.chapter}?v=${item.verse}`}
                  onClick={() => {
                    const cleanKw = query.trim();
                    if (cleanKw && lastRecordedKeywordRef.current !== cleanKw) {
                      lastRecordedKeywordRef.current = cleanKw;
                      recordSearchQuery(cleanKw);
                    }
                    recordSearchOpenedVerse(cleanKw || `${bookName} ${item.chapter}:${item.verse}`, {
                      id: item.id,
                      label: `${item.bookNameSimp} ${item.chapter}:${item.verse}`,
                      bookId: item.bookId,
                      chapter: item.chapter,
                      verse: item.verse,
                    });
                  }}
                  className="hover:underline flex items-center gap-1"
                >
                  <span>{t('查看上下文')}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}

        {!loadingBundle && totalCount === 0 && (
          <div className="py-16 text-center theme-text-muted text-sm">
            {t('没有找到匹配的经文，请尝试更换关键字或经文缩写（如：太6:33、耶稣 爱）。')}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pt-6 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-xl border theme-border disabled:opacity-40 hover:border-brand flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('上一页')}</span>
          </button>

          <span className="text-xs sm:text-sm theme-text-muted">
            {t('第')} <strong className="text-current">{page}</strong> / {totalPages}{' '}
            {t('页')}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-xl border theme-border disabled:opacity-40 hover:border-brand flex items-center gap-1"
          >
            <span>{t('下一页')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
