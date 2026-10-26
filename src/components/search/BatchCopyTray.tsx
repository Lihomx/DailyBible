import React, { useState } from 'react';
import { Copy, Check, Trash2, ChevronUp, ChevronDown, X, Layers } from 'lucide-react';
import { useUserDataStore } from '../../stores/userDataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatBatchCopyVerses } from '../../lib/refParser';

export const BatchCopyTray: React.FC = () => {
  const { batchCopyItems, removeBatchCopyItem, clearBatchCopy } = useUserDataStore();
  const { script, t } = useSettingsStore();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (batchCopyItems.length === 0) return null;

  const formattedText = formatBatchCopyVerses(batchCopyItems, script);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = formattedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 z-40 w-[92vw] sm:w-96 theme-card border shadow-2xl rounded-2xl overflow-hidden transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-brand text-white">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium flex-1 text-left"
        >
          <Layers className="w-4 h-4" />
          <span>
            {t('批次复制篮')} ({batchCopyItems.length} {t('节')})
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 ml-1" />
          ) : (
            <ChevronUp className="w-4 h-4 ml-1" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-brand text-xs font-semibold hover:bg-brand-light transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700">{t('已复制')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('一键复制')}</span>
              </>
            )}
          </button>

          <button
            onClick={clearBatchCopy}
            title={t('清空')}
            className="p-1 rounded hover:bg-white/20 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable list & preview */}
      {expanded && (
        <div className="p-3 max-h-72 overflow-y-auto space-y-2 text-xs">
          <div className="theme-text-muted flex items-center justify-between pb-1 border-b theme-border">
            <span>{t('自动按书卷章节排序并合并连续经文')}</span>
          </div>
          {batchCopyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 p-2 rounded-lg theme-elevated"
            >
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-brand mr-1.5">
                  {script === 'trad' ? item.bookNameTrad : item.bookNameSimp}{' '}
                  {item.chapter}:{item.verse}
                </span>
                <span className="opacity-90">{item.text}</span>
              </div>
              <button
                onClick={() => removeBatchCopyItem(item.id)}
                className="theme-text-muted hover:text-red-500 p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
