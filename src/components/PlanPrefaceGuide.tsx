import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, CheckCircle2, HeartHandshake } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export const PlanPrefaceGuide: React.FC = () => {
  const { t } = useSettingsStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border theme-border theme-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-brand/[0.04] transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>{t('📖 读经计划序言与使用建议（提后 3:16 读经默想指南）')}</span>
            </div>
            <div className="text-xs theme-text-muted">
              {t('了解本计划的三大特点、错过补读建议，以及每日读经后的四步祷告法')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-brand shrink-0">
          <span>{open ? t('收起指南') : t('展开阅读')}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="p-4 sm:p-6 border-t theme-border space-y-5 text-xs sm:text-sm leading-relaxed">
          {/* Intro */}
          <div className="p-3.5 rounded-xl theme-elevated border theme-border space-y-1.5">
            <p className="font-semibold text-brand">
              {t('「我何等爱慕你的律法，终日不住地思想。」—— 诗篇 119:97')}
            </p>
            <p className="theme-text-muted">
              {t(
                '欢迎加入一年读完一遍圣经的行列！这套读经计划（源自麦基弗 James McKeever《得力读经计划》）将在未来一年成为你的好伙伴，帮助你更认识神，并明白祂在你个人身上的计划。'
              )}
            </p>
          </div>

          {/* 3 Features */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-brand">
              <Sparkles className="w-4 h-4" />
              <span>{t('一、本读经计划的三个特点')}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border theme-border theme-elevated space-y-1">
                <div className="font-bold">{t('a. 每日读一篇诗篇或箴言')}</div>
                <p className="text-xs theme-text-muted">
                  {t(
                    '诗篇是向神的赞美，能提升我们的灵性，与神有更亲密的交通；箴言则是神赐下的智慧，使我们知道如何用智慧与人相处。一年内你会读完诗篇两次、箴言一次。'
                  )}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border theme-border theme-elevated space-y-1">
                <div className="font-bold">{t('b. 一年读福音书两次')}</div>
                <p className="text-xs theme-text-muted">
                  {t(
                    '借着马太→使徒→马可→罗马→路加→哥林多等福音书与书信穿插研读，使你在一年中持续默想耶稣的生平与教训，让耶稣基督活在我们的生命中。'
                  )}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border theme-border theme-elevated space-y-1">
                <div className="font-bold">{t('c. 按着年代次序读旧约')}</div>
                <p className="text-xs theme-text-muted">
                  {t(
                    '按历史发生次序编排旧约（例如：列王纪下读到先知约拿时接读约拿书；被掳时期读但以理书与以西结书；归回重建时读以斯拉记），帮助你清晰拼合整个旧约历史脉络。'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Suggestions */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-brand">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('二、帮助你得着最大益处的四项使用建议')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border theme-border space-y-1">
                <div className="font-bold">{t('1. 随时开始')}</div>
                <p className="text-xs theme-text-muted">
                  {t('不必等到一月一日才开始，从今天的日期直接跟上读经进度即可，坚持一年同样能完整读完圣经。')}
                </p>
              </div>
              <div className="p-3 rounded-xl border theme-border space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {t('2. 假如错过一天（重要建议！）')}
                </div>
                <p className="text-xs theme-text-muted">
                  {t(
                    '假如因故错过一天，隔天不要强行回头一次读两天的份量（一旦落后两三天很容易因负担过重而灰心放弃）。建议先跳过错过的日子直接读当天的经文，等周末或有空时再回头补读！'
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl border theme-border space-y-1">
                <div className="font-bold">{t('3. 记下重要经节与背诵')}</div>
                <p className="text-xs theme-text-muted">
                  {t('当圣灵借某节经文向你说话时，请点击经文高亮或收藏；每周至少挑选一处感动你的经文背诵下来。')}
                </p>
              </div>
              <div className="p-3 rounded-xl border theme-border space-y-1">
                <div className="font-bold">{t('4. 记录神当月的带领')}</div>
                <p className="text-xs theme-text-muted">
                  {t('将神透过经文向你显明的应许、提醒或代祷事项记录在灵修笔记中，年底回顾时必成为极大的祝福。')}
                </p>
              </div>
            </div>
          </div>

          {/* 2 Timothy 3:16 4-Step Prayer Guide */}
          <div className="p-4 rounded-2xl border border-brand/30 bg-brand/[0.04] space-y-2.5">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-brand">
              <HeartHandshake className="w-4 h-4" />
              <span>{t('三、每日读经后的四步默想祷告（提摩太后书 3:16）')}</span>
            </h3>
            <p className="text-xs theme-text-muted">
              {t(
                '「圣经都是神所默示的，于教训、督责、使人归正、教导人学义都是有益的。」每当读完一段经文，请安静向神祷告求问这四件事：'
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-xl theme-card border theme-border">
                <div className="font-bold text-brand">{t('a. 教训')}</div>
                <div className="text-xs font-semibold mt-0.5">{t('我要相信的事')}</div>
                <p className="text-[11px] theme-text-muted mt-1">
                  {t('神在这段经文中启示了什么真理，是我应当相信并持守的？')}
                </p>
              </div>
              <div className="p-3 rounded-xl theme-card border theme-border">
                <div className="font-bold text-brand">{t('b. 督责')}</div>
                <div className="text-xs font-semibold mt-0.5">{t('我要停止做的事')}</div>
                <p className="text-[11px] theme-text-muted mt-1">
                  {t('圣灵借着经文光照我哪些心思或行为不讨神喜悦，需要悔改停止？')}
                </p>
              </div>
              <div className="p-3 rounded-xl theme-card border theme-border">
                <div className="font-bold text-brand">{t('c. 归正')}</div>
                <div className="text-xs font-semibold mt-0.5">{t('我可以做得更好的事')}</div>
                <p className="text-[11px] theme-text-muted mt-1">
                  {t('我目前正在做的事中，有哪些方向、态度或做法可以调整得更合神心意？')}
                </p>
              </div>
              <div className="p-3 rounded-xl theme-card border theme-border">
                <div className="font-bold text-brand">{t('d. 使人学义')}</div>
                <div className="text-xs font-semibold mt-0.5">{t('我开始要做的事')}</div>
                <p className="text-[11px] theme-text-muted mt-1">
                  {t('神今天呼召我踏出哪一步顺服的行动，开始去行公义、好怜悯？')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
