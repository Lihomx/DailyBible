import React from 'react';
import { X, ShieldCheck, BookOpen } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

interface CopyrightModalProps {
  open: boolean;
  onClose: () => void;
}

export const CopyrightModal: React.FC<CopyrightModalProps> = ({ open, onClose }) => {
  const { t } = useSettingsStore();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="theme-card border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b theme-border pb-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-brand" />
            <span>{t('圣经译本版权与授权说明')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>1. {t('译本与数据源说明')}：</strong>
            <br />
            {t(
              '本站所使用的中文圣经经文源自《官话和合本圣经》（Chinese Union Version，1919 年出版，已进入公共领域 Public Domain），数字化文本与标点分段取自 eBible.org 收录之公开领域档案（cmn-cu89s 简体 / cmn-cu89t 繁体）。'
            )}
          </p>

          <p>
            <strong>2. {t('联合圣经公会 / 香港圣经公会权益声明')}：</strong>
            <br />
            {t(
              '《新标点和合本》（CUNP，1988 年出版）之专有修订与排版版权归联合圣经公会（United Bible Societies, UBS）及香港圣经公会（Hong Kong Bible Society）所有。若教会或机构将本系统部署于公共互联网并需正式冠名「新标点和合本 (CUNP)」，建议向当地圣经公会或香港圣经公会申请非商业电子事工授权。'
            )}
          </p>

          <p>
            <strong>3. {t('教会非营利事工用途')}：</strong>
            <br />
            {t(
              '本读经助手仅供教会弟兄姊妹日常读经打卡、查经学习、个人灵修笔记与主日证道回顾使用，完全免费且不含任何商业广告或营利行为。'
            )}
          </p>

          <p>
            <strong>4. {t('得胜读经计划说明')}：</strong>
            <br />
            {t(
              '本站内置之 365 天「得胜读经计划」（Victorious Bible Reading Plan）由雅各·麦凯文（J. McKeever）发起，每天包含一篇诗篇或箴言、一章新约、两章旧约，一年内读完两遍福音书及一遍全本圣经。'
            )}
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('我已知晓')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
