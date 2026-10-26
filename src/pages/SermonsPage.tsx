import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  BookOpen,
  Upload,
  ChevronRight,
  Search,
  Church,
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';

export const SermonsPage: React.FC = () => {
  const { t } = useSettingsStore();
  const { sermons, user } = useUserDataStore();
  const [filterText, setFilterText] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('all');

  const seriesList = Array.from(
    new Set(sermons.map((s) => s.series).filter(Boolean))
  );

  const filtered = sermons.filter((s) => {
    if (selectedSeries !== 'all' && s.series !== selectedSeries) return false;
    if (!filterText.trim()) return true;
    const q = filterText.trim().toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.scripture_ref.toLowerCase().includes(q) ||
      s.blocks.some((b) => b.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Header & Admin Upload Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b theme-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand" />
            <span>{t('教会周日主日证道题目与全文')}</span>
          </h1>
          <p className="text-xs sm:text-sm theme-text-muted mt-1">
            {t(
              '由管理员上传主日证道 PPTX 自动提取文字、经文与配图转化为网页版，方便弟兄姊妹温习查考。'
            )}
          </p>
        </div>

        {user?.role === 'admin' ? (
          <Link
            to="/admin?tab=sermons"
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>{t('上传主日证道 PPTX')}</span>
          </Link>
        ) : (
          <Link
            to="/me"
            className="px-3.5 py-1.5 rounded-xl border theme-border text-xs theme-text-muted hover:border-brand hover:text-brand transition"
          >
            {t('管理员登录可上传 PPTX')}
          </Link>
        )}
      </div>

      {/* Search & Series Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t('搜索证道题目、主题经文或正文内容...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border theme-border theme-card text-sm outline-none focus:border-brand"
          />
        </div>

        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          aria-label={t('按证道系列筛选')}
          className="px-3 py-2 rounded-xl border theme-border theme-card text-xs sm:text-sm outline-none"
        >
          <option value="all">{t('全部证道系列')}</option>
          {seriesList.map((sr) => (
            <option key={sr} value={sr}>
              {t(sr)}
            </option>
          ))}
        </select>
      </div>

      {/* Sermon Cards List */}
      <div className="space-y-4">
        {filtered.map((s) => (
          <Link
            key={s.id}
            to={`/sermons/${s.id}`}
            className="block rounded-2xl border theme-border theme-card p-5 hover:border-brand transition shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs theme-text-muted">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-semibold text-brand">
                  <Church className="w-3.5 h-3.5" />
                  <span>{t(s.church)}</span>
                </span>
                {s.series && (
                  <span className="px-2 py-0.5 rounded bg-brand/10 text-brand font-medium">
                    {t(s.series)}
                  </span>
                )}
              </div>

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{s.date}</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold">{t(s.title)}</h2>

            {s.scripture_ref && (
              <div className="text-xs font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {t('主题经文：')}
                  {t(s.scripture_ref)}
                </span>
              </div>
            )}

            {s.summary && (
              <p className="text-sm theme-text-muted leading-relaxed line-clamp-2">
                {t(s.summary)}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-brand">
              <span>
                {t('共')} {s.blocks.length} {t('段讲道内容')} / {s.slides.length}{' '}
                {t('页 PPT')}
              </span>
              <span className="flex items-center gap-1">
                <span>{t('阅读证道全文')}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center theme-text-muted text-sm">
            {t('暂无匹配的证道信息')}
          </div>
        )}
      </div>
    </div>
  );
};
