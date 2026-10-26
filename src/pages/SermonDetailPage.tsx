import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Church,
  BookOpen,
  LayoutList,
  Presentation,
  Download,
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';
import { tokenizeTextWithScriptureRefs } from '../lib/linkifyRefs';

export const SermonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useSettingsStore();
  const { sermons } = useUserDataStore();
  const [viewMode, setViewMode] = useState<'article' | 'slides'>('article');
  const [showBoilerplateSlides, setShowBoilerplateSlides] = useState(false);

  const sermon = sermons.find((s) => s.id === id) || sermons[0];

  if (!sermon) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="theme-text-muted">{t('未找到该篇主日证道')}</p>
        <Link to="/sermons" className="text-brand underline text-sm">
          {t('返回证道列表')}
        </Link>
      </div>
    );
  }

  const renderLinkedParagraph = (rawText: string) => {
    const converted = t(rawText);
    const tokens = tokenizeTextWithScriptureRefs(converted);
    return tokens.map((tk, idx) => {
      if (tk.type === 'ref' && tk.bookId && tk.chapter) {
        const href = tk.verseStart
          ? `/bible/${tk.bookId}.${tk.chapter}?v=${tk.verseStart}`
          : `/bible/${tk.bookId}.${tk.chapter}`;
        return (
          <Link
            key={idx}
            to={href}
            className="text-brand font-semibold underline decoration-brand/50 underline-offset-4 hover:bg-brand/10 px-0.5 rounded transition"
          >
            {tk.text}
          </Link>
        );
      }
      return <React.Fragment key={idx}>{tk.text}</React.Fragment>;
    });
  };

  const visibleSlides = showBoilerplateSlides
    ? sermon.slides
    : sermon.slides.filter((s) => !s.isBoilerplate);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Top Navigation & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/sermons"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm theme-text-muted hover:text-brand transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('返回证道列表')}</span>
        </Link>

        <div className="flex items-center gap-2">
          {sermon.id === 'sermon-2024-12-01-holy-spirit-3' && (
            <a
              href="/samples/2024-12-01-works-of-the-holy-spirit.pptx"
              download
              className="px-3 py-1.5 rounded-xl border theme-border theme-card text-xs font-medium flex items-center gap-1.5 hover:border-brand hover:text-brand transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('下载原始 PPTX')}</span>
            </a>
          )}

          <div className="flex items-center rounded-xl border theme-border theme-card p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('article')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'article'
                  ? 'bg-brand text-white'
                  : 'theme-text-muted'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>{t('网页全文版')}</span>
            </button>
            <button
              onClick={() => setViewMode('slides')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'slides'
                  ? 'bg-brand text-white'
                  : 'theme-text-muted'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>
                {t('PPT 幻灯片视图')} ({sermon.slides.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sermon Title Banner */}
      <div className="rounded-2xl border theme-border theme-card p-6 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs theme-text-muted">
          <span className="inline-flex items-center gap-1 font-semibold text-brand">
            <Church className="w-4 h-4" />
            <span>{t(sermon.church)}</span>
          </span>
          {sermon.series && (
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
              {t(sermon.series)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{sermon.date}</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold leading-snug">
          {t(sermon.title)}
        </h1>

        {sermon.scripture_ref && (
          <div className="text-xs sm:text-sm flex items-center gap-1.5 pt-1">
            <BookOpen className="w-4 h-4 text-brand shrink-0" />
            <span className="font-semibold">{t('主题经节：')}</span>
            <span>{renderLinkedParagraph(sermon.scripture_ref)}</span>
          </div>
        )}

        {sermon.summary && (
          <p className="text-sm theme-text-muted leading-relaxed pt-1 border-t theme-border">
            {t(sermon.summary)}
          </p>
        )}
      </div>

      {/* Article View vs Slide-by-Slide View */}
      {viewMode === 'article' ? (
        <article className="rounded-2xl border theme-border theme-card p-6 sm:p-8 space-y-5 shadow-sm">
          {sermon.blocks.map((block) => {
            if (block.type === 'heading') {
              return (
                <div
                  key={block.id}
                  className="pt-4 first:pt-0 border-b theme-border pb-2 flex items-center justify-between gap-2"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-brand">
                    {t(block.content)}
                  </h2>
                  {block.slideNumber && (
                    <span className="text-[11px] px-2 py-0.5 rounded theme-elevated theme-text-muted shrink-0">
                      PPT #{block.slideNumber}
                    </span>
                  )}
                </div>
              );
            }

            if (block.type === 'callout') {
              return (
                <div
                  key={block.id}
                  className="p-4 rounded-xl bg-brand/10 border border-brand/30 text-sm sm:text-base font-medium leading-relaxed"
                >
                  {renderLinkedParagraph(block.content)}
                </div>
              );
            }

            if (block.type === 'scripture') {
              return (
                <blockquote
                  key={block.id}
                  className="p-4 rounded-xl theme-elevated border-l-4 border-brand space-y-2 text-sm sm:text-base leading-relaxed whitespace-pre-line"
                >
                  {renderLinkedParagraph(block.content)}
                </blockquote>
              );
            }

            if (block.type === 'image' && block.imageUrl) {
              return (
                <figure key={block.id} className="space-y-2 py-2">
                  <img
                    src={block.imageUrl}
                    alt={block.content}
                    className="max-h-96 rounded-xl border theme-border mx-auto object-contain"
                  />
                  {block.content && (
                    <figcaption className="text-center text-xs theme-text-muted">
                      {t(block.content)}
                    </figcaption>
                  )}
                </figure>
              );
            }

            return (
              <p
                key={block.id}
                className="text-base leading-relaxed whitespace-pre-line"
              >
                {renderLinkedParagraph(block.content)}
              </p>
            );
          })}
        </article>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs theme-text-muted">
            <span>
              {t('按原始 PPT 幻灯片顺序展示（经文引用已自动转为可点击链接）')}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBoilerplateSlides}
                onChange={(e) => setShowBoilerplateSlides(e.target.checked)}
                className="accent-brand"
              />
              <span>{t('包含片头教会宣言幻灯片 (第1-6页)')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {visibleSlides.map((slide) => (
              <div
                key={slide.slideNumber}
                className="rounded-2xl border theme-border theme-card p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between border-b theme-border pb-2">
                  <h3 className="font-bold text-base text-brand">
                    {t(slide.title)}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full theme-elevated text-xs font-semibold theme-text-muted">
                    Slide {slide.slideNumber}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm sm:text-base leading-relaxed">
                  {slide.paragraphs.map((p, idx) => (
                    <p key={idx}>{renderLinkedParagraph(p)}</p>
                  ))}
                </div>

                {slide.images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {slide.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Slide ${slide.slideNumber}`}
                        className="rounded-xl border theme-border max-h-64 object-contain"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
