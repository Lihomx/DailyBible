import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Volume2,
  PartyPopper,
  Calendar,
  Users,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import {
  loadDeshengPlan,
  computePlanDayIndex,
  getPlanDayByIndex,
  ReadingPlanData,
  PlanReadingSegment,
} from '../lib/plan';
import { loadChapterVerses, VerseItem } from '../lib/bible';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useTtsStore } from '../stores/ttsStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { script, t } = useSettingsStore();
  const {
    user,
    activeGroupId,
    groups,
    joinedGroupIds,
    setActiveGroup,
    progressMap,
    togglePlanPart,
    markAllDayPartsDone,
    sermons,
  } = useUserDataStore();
  const { startPlanDayLoop } = useTtsStore();

  const [plan, setPlan] = useState<ReadingPlanData | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [todayDayIndex, setTodayDayIndex] = useState<number>(1);
  const [celebrating, setCelebrating] = useState(false);
  const [copiedCheckinText, setCopiedCheckinText] = useState<string>('');

  // Inline expanded segment reader
  const [expandedPart, setExpandedPart] = useState<'ps' | 'nt' | 'ot' | null>(null);
  const [inlineVerses, setInlineVerses] = useState<
    Array<{ chapter: number; verses: VerseItem[] }>
  >([]);
  const [loadingInline, setLoadingInline] = useState(false);

  const activeGroup =
    groups.find((g) => g.id === activeGroupId) || groups[0];

  useEffect(() => {
    loadDeshengPlan().then((p) => {
      setPlan(p);
      const idx = computePlanDayIndex(p, activeGroup?.start_date || 'calendar');
      setTodayDayIndex(idx);
      setSelectedDayIndex(idx);
    });
  }, [activeGroup?.start_date]);

  const triggerCelebration = () => {
    setCelebrating(true);
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore if canvas unavailable in headless test
    }
    setTimeout(() => setCelebrating(false), 4500);
  };

  if (!plan) {
    return (
      <div className="p-12 text-center theme-text-muted text-sm">
        {t('正在加载今日得胜读经计划...')}
      </div>
    );
  }

  const dayEntry = getPlanDayByIndex(plan, selectedDayIndex);
  const progressKey = `${activeGroup.id}:${dayEntry.dayIndex}`;
  const doneParts = progressMap[progressKey] || [];
  const isAllDone =
    doneParts.includes('ps') &&
    doneParts.includes('nt') &&
    doneParts.includes('ot');

  // Compute total completed days in this group
  const completedDaysCount = Object.entries(progressMap).filter(
    ([k, parts]) =>
      k.startsWith(`${activeGroup.id}:`) &&
      parts.includes('ps') &&
      parts.includes('nt') &&
      parts.includes('ot')
  ).length;

  const copyCheckinMessage = async () => {
    const checkinName = (
      user?.checkin_name ||
      user?.nickname ||
      '主内肢体'
    ).trim();
    const text = `${checkinName}打卡，已读今日经文`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older mobile webviews
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(ta);
    }
    setCopiedCheckinText(text);
    setTimeout(() => setCopiedCheckinText(''), 4000);
  };

  const handleTogglePart = (part: 'ps' | 'nt' | 'ot') => {
    const { newlyCompletedDay } = togglePlanPart(
      activeGroup.id,
      dayEntry.dayIndex,
      part
    );
    if (newlyCompletedDay) {
      triggerCelebration();
      copyCheckinMessage();
    }
  };

  const handleCompleteAllToday = async () => {
    const { newlyCompletedDay } = markAllDayPartsDone(
      activeGroup.id,
      dayEntry.dayIndex
    );
    if (newlyCompletedDay) {
      triggerCelebration();
    }
    await copyCheckinMessage();
  };

  const handleExpandSegment = async (seg: PlanReadingSegment) => {
    if (expandedPart === seg.part) {
      setExpandedPart(null);
      return;
    }
    setExpandedPart(seg.part);
    setLoadingInline(true);
    const loaded: Array<{ chapter: number; verses: VerseItem[] }> = [];
    for (let ch = seg.chapterStart; ch <= seg.chapterEnd; ch++) {
      let chVerses = await loadChapterVerses(seg.bookId, ch, script);
      if (seg.verseSpec) {
        const [vStart, vEnd] = seg.verseSpec.split('-').map((n) => parseInt(n, 10));
        if (!isNaN(vStart)) {
          chVerses = chVerses.filter(
            (v) => v.v >= vStart && (isNaN(vEnd) || v.v <= vEnd)
          );
        }
      }
      loaded.push({ chapter: ch, verses: chVerses });
    }
    setInlineVerses(loaded);
    setLoadingInline(false);
  };

  const handleListenSegment = async (seg: PlanReadingSegment) => {
    const { targetBookId, targetChapter } = await startPlanDayLoop({
      dayEntry,
      startPart: seg.part,
    });
    navigate(`/bible/${targetBookId}.${targetChapter}`);
  };

  const handlePlayAllTodayPlan = async () => {
    const { targetBookId, targetChapter } = await startPlanDayLoop({
      dayEntry,
      startPart: 'ps',
    });
    navigate(`/bible/${targetBookId}.${targetChapter}`);
  };

  const segments: Array<{
    key: 'ps' | 'nt' | 'ot';
    tag: string;
    seg: PlanReadingSegment;
  }> = [
    { key: 'ps', tag: '诗篇 / 智慧', seg: dayEntry.readings.ps },
    { key: 'nt', tag: '新约经文', seg: dayEntry.readings.nt },
    { key: 'ot', tag: '旧约经文', seg: dayEntry.readings.ot },
  ];

  const latestSermon = sermons[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Top Group Selector & Streak Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand" />
          <span className="text-xs sm:text-sm font-semibold theme-text-muted">
            {t('当前共读小组：')}
          </span>
          <select
            value={activeGroup.id}
            onChange={(e) => setActiveGroup(e.target.value)}
            aria-label={t('选择共读小组')}
            className="px-3 py-1.5 rounded-xl border theme-border theme-card text-xs sm:text-sm font-semibold outline-none focus:border-brand"
          >
            {groups
              .filter((g) => g.is_public || joinedGroupIds.includes(g.id))
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {t(g.name)}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold">
            {t('已完成')} {completedDaysCount} / 365 {t('天')}
          </span>
          <Link
            to="/plan"
            className="text-brand font-medium hover:underline flex items-center gap-0.5"
          >
            <span>{t('全年表 / 补读')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Today's Reading Plan Hero Card (Turns Green with Celebration when All 3 Parts Done) */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
          isAllDone
            ? 'border-emerald-500/70 bg-emerald-500/10 dark:bg-emerald-500/15'
            : 'theme-card theme-border'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b theme-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isAllDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand text-white'
                }`}
              >
                {selectedDayIndex === todayDayIndex
                  ? t('今日待读')
                  : `${t('第')} ${selectedDayIndex} ${t('天')}`}
              </span>
              <span className="text-xs theme-text-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {dayEntry.month}{t('月')}{dayEntry.day}{t('日')}（{t('得胜计划第')}{' '}
                  {dayEntry.dayIndex} {t('天')}）
                </span>
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 pt-1">
              <span>{t('得胜读经计划 · 每日三段灵粮')}</span>
              {isAllDone && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  <PartyPopper className="w-4 h-4" />
                  <span>{t('今日已完成！')}</span>
                </span>
              )}
            </h1>
          </div>

          {/* Day switcher & Play All Today Loop */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePlayAllTodayPlan}
              className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t('循环播放今日经文')}</span>
            </button>

            <button
              onClick={() =>
                setSelectedDayIndex((d) => (d > 1 ? d - 1 : 365))
              }
              className="px-2.5 py-1 rounded-lg border theme-border text-xs hover:border-brand"
            >
              {t('前一天')}
            </button>
            {selectedDayIndex !== todayDayIndex && (
              <button
                onClick={() => setSelectedDayIndex(todayDayIndex)}
                className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-semibold"
              >
                {t('回到今天')}
              </button>
            )}
            <button
              onClick={() =>
                setSelectedDayIndex((d) => (d < 365 ? d + 1 : 1))
              }
              className="px-2.5 py-1 rounded-lg border theme-border text-xs hover:border-brand"
            >
              {t('后一天')}
            </button>
          </div>
        </div>

        {/* Celebration Banner when newly completed */}
        {celebrating && (
          <div className="my-4 p-3.5 rounded-xl bg-emerald-600 text-white flex items-center justify-between text-sm font-medium animate-bounce">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5" />
              <span>
                {t('哈利路亚！你已完成今日全部得胜读经计划，进度已自动保存！')}
              </span>
            </div>
          </div>
        )}

        {/* Three Daily Reading Segments */}
        <div className="mt-4 space-y-3">
          {segments.map(({ key, tag, seg }) => {
            const done = doneParts.includes(key);
            const isExpanded = expandedPart === key;
            const segLabel = script === 'trad' ? seg.labelTrad : seg.labelSimp;

            return (
              <div
                key={key}
                className={`rounded-xl border transition overflow-hidden ${
                  done
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'theme-border theme-elevated'
                }`}
              >
                <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  {/* Checkbox + Title */}
                  <div
                    onClick={() => handleTogglePart(key)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-[200px]"
                  >
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 theme-text-muted hover:text-brand shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 theme-text-muted">
                          {t(tag)}
                        </span>
                        {done && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {t('已读完')}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-base sm:text-lg font-bold mt-0.5 ${
                          done ? 'line-through opacity-80' : ''
                        }`}
                      >
                        {segLabel}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions: Expand inline, Listen TTS, Open in Bible Reader */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExpandSegment(seg)}
                      className="px-3 py-1.5 rounded-lg border theme-border theme-card text-xs font-medium flex items-center gap-1 hover:border-brand hover:text-brand transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isExpanded ? t('收起经文') : t('展开阅读')}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleListenSegment(seg)}
                      title={t('边听边读')}
                      className="px-3 py-1.5 rounded-lg border theme-border theme-card text-xs font-medium flex items-center gap-1 hover:border-brand hover:text-brand transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-brand" />
                      <span>{t('朗读')}</span>
                    </button>

                    <Link
                      to={`/bible/${seg.bookId}.${seg.chapterStart}`}
                      className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition"
                    >
                      {t('进入章节')}
                    </Link>
                  </div>
                </div>

                {/* Inline Expanded Scripture Content */}
                {isExpanded && (
                  <div className="p-4 border-t theme-border theme-card space-y-4">
                    {loadingInline ? (
                      <div className="text-xs theme-text-muted py-4 text-center">
                        {t('正在加载经文...')}
                      </div>
                    ) : (
                      inlineVerses.map((chBlock) => (
                        <div key={chBlock.chapter} className="space-y-2">
                          <div className="text-xs font-bold text-brand">
                            {script === 'trad'
                              ? seg.bookNameTrad
                              : seg.bookNameSimp}{' '}
                            {t('第')} {chBlock.chapter} {t('章')}
                          </div>
                          <div className="text-base leading-relaxed space-y-1">
                            {chBlock.verses.map((v) => (
                              <span key={v.v} className="mr-1.5">
                                <sup className="verse-number">{v.v}</sup>
                                <span>{v.t}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          if (!done) handleTogglePart(key);
                          setExpandedPart(null);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {done ? t('已完成本段') : t('标记本段已读完')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Copied Checkin Message Toast */}
        {copiedCheckinText && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                {t('已自动复制打卡文字：')}
                <strong className="underline ml-1">{copiedCheckinText}</strong>
              </span>
            </div>
            <span className="text-[11px] opacity-90 shrink-0">
              {t('可直接粘贴到微信群')}
            </span>
          </div>
        )}

        {/* Footer bar of Today Card */}
        <div className="mt-5 pt-4 border-t theme-border flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs theme-text-muted">
            {t(
              '提示：点击右侧按钮可一键完成今日三段读经，并自动复制「打卡名字打卡，已读今日经文」。'
            )}
          </p>

          <div className="flex items-center gap-2">
            {!isAllDone ? (
              <button
                onClick={handleCompleteAllToday}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('一键完成今日三段读经')}</span>
              </button>
            ) : (
              <button
                onClick={copyCheckinMessage}
                className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-500/10 transition flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>{t('复制今日打卡文字')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Feature Cards: Search & Latest Sunday Sermon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Versatile Bible Search Card */}
        <div className="rounded-2xl border theme-border theme-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand font-bold">
              <Search className="w-4 h-4" />
              <span>{t('全能经文搜索 · 怎么打都找得到')}</span>
            </div>
            <p className="text-xs theme-text-muted leading-relaxed">
              {t(
                '支持 太6:33 / 太六33 / 太1.17-2.4 / 全圣经 7:1 / 多词「耶穌 愛 我」/ 排除「光-暗」，并支持跨模式批次复制。'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {['太6:33', '太1.17-2.4', '7:1', '耶穌 愛 我', '光-暗'].map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                className="px-2.5 py-1 rounded-lg border theme-border text-xs hover:border-brand hover:text-brand transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Latest Sunday Sermon Card */}
        {latestSermon && (
          <div className="rounded-2xl border theme-border theme-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs theme-text-muted">
                <span className="font-semibold text-brand flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('最新主日证道')}</span>
                </span>
                <span>{latestSermon.date}</span>
              </div>
              <h3 className="font-bold text-base line-clamp-1">
                {t(latestSermon.title)}
              </h3>
              <p className="text-xs theme-text-muted line-clamp-2 leading-relaxed">
                {t(latestSermon.summary)}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs theme-text-muted">
                {t(latestSermon.church)}
              </span>
              <Link
                to={`/sermons/${latestSermon.id}`}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('阅读证道全文与经文')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
