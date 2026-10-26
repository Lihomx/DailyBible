import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CalendarCheck,
  Users,
  UserPlus,
  CheckCircle2,
  Circle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  loadDeshengPlan,
  computePlanDayIndex,
  ReadingPlanData,
} from '../lib/plan';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';

export const PlanPage: React.FC = () => {
  const { script, t } = useSettingsStore();
  const {
    user,
    activeGroupId,
    groups,
    joinedGroupIds,
    setActiveGroup,
    joinGroupByCode,
    progressMap,
    togglePlanPart,
    allUsers,
  } = useUserDataStore();

  const [plan, setPlan] = useState<ReadingPlanData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [planTab, setPlanTab] = useState<'group' | 'personal'>('group');
  const [inviteInput, setInviteInput] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);

  const activeGroup =
    groups.find((g) => g.id === activeGroupId) || groups[0];

  useEffect(() => {
    loadDeshengPlan().then((p) => {
      setPlan(p);
      const todayIdx = computePlanDayIndex(p, activeGroup.start_date);
      const entry = p.days[todayIdx - 1];
      if (entry) {
        setSelectedMonth(entry.month);
      }
    });
  }, [activeGroup.start_date]);

  if (!plan) {
    return (
      <div className="p-12 text-center theme-text-muted text-sm">
        {t('正在加载365天得胜读经计划表...')}
      </div>
    );
  }

  const todayDayIndex = computePlanDayIndex(plan, activeGroup.start_date);
  const monthDays = plan.days.filter((d) => d.month === selectedMonth);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await joinGroupByCode(inviteInput);
    if (res.ok && res.group) {
      setJoinFeedback({
        type: 'ok',
        msg: `${t('已成功加入共读小组：')}${res.group.name}`,
      });
      setInviteInput('');
    } else {
      setJoinFeedback({
        type: 'err',
        msg: res.error || t('加入失败'),
      });
    }
  };

  const handleToggleDayPart = (
    dayIndex: number,
    part: 'ps' | 'nt' | 'ot'
  ) => {
    const { newlyCompletedDay } = togglePlanPart(
      activeGroup.id,
      dayIndex,
      part
    );
    if (newlyCompletedDay) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    }
  };

  // Simulated + real group member completion board for today
  const todayKey = `${activeGroup.id}:${todayDayIndex}`;
  const currentUserParts = progressMap[todayKey] || [];
  const memberBoard = [
    {
      name: user ? `${user.nickname} (${t('我')})` : t('我 (本地访客)'),
      parts: currentUserParts,
      doneAll:
        currentUserParts.includes('ps') &&
        currentUserParts.includes('nt') &&
        currentUserParts.includes('ot'),
    },
    ...allUsers
      .filter((u) => u.id !== user?.id)
      .slice(0, 5)
      .map((u) => ({
        name: u.nickname,
        parts: ['ps', 'nt', 'ot'] as ('ps' | 'nt' | 'ot')[],
        doneAll: true,
      })),
  ];

  const completedMembersCount = memberBoard.filter((m) => m.doneAll).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Top Mode Switcher: Group Plan vs Personal Plan (Reserved) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b theme-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlanTab('group')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              planTab === 'group'
                ? 'bg-brand text-white shadow-sm'
                : 'theme-card border theme-border'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('共读计划（得胜读经计划）')}</span>
          </button>

          <button
            onClick={() => setPlanTab('personal')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              planTab === 'personal'
                ? 'bg-brand text-white shadow-sm'
                : 'theme-card border theme-border opacity-80'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t('个人计划')}</span>
          </button>
        </div>

        {/* Invite Code Join Form */}
        <form onSubmit={handleJoinGroup} className="flex items-center gap-2">
          <input
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder={t('输入小组邀请码 (如 ISSACHAR)')}
            className="px-3 py-1.5 rounded-xl border theme-border theme-card text-xs sm:text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('加入小组')}</span>
          </button>
        </form>
      </div>

      {joinFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            joinFeedback.type === 'ok'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
              : 'bg-red-500/15 text-red-600 border border-red-500/40'
          }`}
        >
          {joinFeedback.msg}
        </div>
      )}

      {planTab === 'personal' ? (
        <div className="theme-card border theme-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">{t('个人自定义读经计划（第二版预留入口）')}</h2>
          <p className="text-sm theme-text-muted max-w-md mx-auto leading-relaxed">
            {t(
              '当前版本全教会统一使用「得胜读经计划」共读模式。您可以随时加入公开共读或通过邀请码加入教会小组共读。'
            )}
          </p>
          <button
            onClick={() => setPlanTab('group')}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold"
          >
            {t('返回得胜共读计划')}
          </button>
        </div>
      ) : (
        <>
          {/* Group Overview & Member Today Completion Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border theme-border theme-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-brand">
                    {t('当前共读小组')} ·{' '}
                    {activeGroup.start_date === 'calendar'
                      ? t('按日历固定 (1月1日=第1天)')
                      : `${t('起始日期：')}${activeGroup.start_date}`}
                  </span>
                  <h2 className="text-lg font-bold">{t(activeGroup.name)}</h2>
                </div>

                <select
                  value={activeGroup.id}
                  onChange={(e) => setActiveGroup(e.target.value)}
                  aria-label={t('切换共读小组')}
                  className="px-3 py-1.5 rounded-xl border theme-border theme-elevated text-xs font-semibold"
                >
                  {groups
                    .filter((g) => g.is_public || joinedGroupIds.includes(g.id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {t(g.name)} ({t('邀请码')}: {g.invite_code})
                      </option>
                    ))}
                </select>
              </div>

              <p className="text-xs sm:text-sm theme-text-muted leading-relaxed">
                {t(activeGroup.description || plan.descriptionSimp)}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                <span className="px-2.5 py-1 rounded-lg theme-elevated font-medium">
                  {t('小组邀请码：')}
                  <strong className="text-brand ml-1">{activeGroup.invite_code}</strong>
                </span>
                <span className="theme-text-muted">
                  {t('闰年规则：2月29日自动复用2月28日经文，确保全年同步。')}
                </span>
              </div>
            </div>

            {/* Group Members Today Completion Rate */}
            <div className="rounded-2xl border theme-border theme-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand">
                  {t('小组成员今日完成率')}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                  {completedMembersCount} / {memberBoard.length} {t('人已完成')}
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {memberBoard.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b theme-border last:border-b-0"
                  >
                    <span className="font-medium truncate">{m.name}</span>
                    <div className="flex items-center gap-1.5">
                      {(['ps', 'nt', 'ot'] as const).map((p) => (
                        <span
                          key={p}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            m.parts.includes(p)
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'theme-elevated theme-text-muted'
                          }`}
                        >
                          {p === 'ps' ? t('诗') : p === 'nt' ? t('新') : t('旧')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 12 Months Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const mDays = plan.days.filter((d) => d.month === m);
              const doneInMonth = mDays.filter((d) => {
                const pts = progressMap[`${activeGroup.id}:${d.dayIndex}`] || [];
                return (
                  pts.includes('ps') && pts.includes('nt') && pts.includes('ot')
                );
              }).length;

              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition flex flex-col items-center ${
                    selectedMonth === m
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'theme-card theme-border hover:border-brand'
                  }`}
                >
                  <span>
                    {m} {t('月')}
                  </span>
                  <span className="text-[10px] opacity-80">
                    {doneInMonth}/{mDays.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 365-Day Schedule Table for Selected Month (with Makeup Reading Support) */}
          <div className="rounded-2xl border theme-border theme-card overflow-hidden">
            <div className="px-4 py-3 border-b theme-border flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span>
                {selectedMonth} {t('月读经计划表（点击各项即可打卡或补读）')}
              </span>
              <span className="text-xs theme-text-muted">
                {t('三段全勾 = 当日完成')}
              </span>
            </div>

            <div className="divide-y theme-border">
              {monthDays.map((d) => {
                const key = `${activeGroup.id}:${d.dayIndex}`;
                const pts = progressMap[key] || [];
                const allDone =
                  pts.includes('ps') && pts.includes('nt') && pts.includes('ot');
                const isToday = d.dayIndex === todayDayIndex;
                const isMissedPast = d.dayIndex < todayDayIndex && !allDone;

                return (
                  <div
                    key={d.dayIndex}
                    className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      allDone
                        ? 'bg-emerald-500/[0.07]'
                        : isToday
                        ? 'bg-brand/[0.06]'
                        : ''
                    }`}
                  >
                    {/* Date & Status Badge */}
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          allDone
                            ? 'bg-emerald-600 text-white'
                            : isToday
                            ? 'bg-brand text-white'
                            : 'theme-elevated theme-text-muted'
                        }`}
                      >
                        {d.day}
                      </div>
                      <div>
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          <span>
                            {d.month}{t('月')}{d.day}{t('日')}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded bg-brand text-white text-[10px]">
                              {t('今日')}
                            </span>
                          )}
                          {isMissedPast && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('待补读')}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] theme-text-muted">
                          Day {d.dayIndex}
                        </div>
                      </div>
                    </div>

                    {/* Three Checkable Segments */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      {(['ps', 'nt', 'ot'] as const).map((partKey) => {
                        const seg = d.readings[partKey];
                        const checked = pts.includes(partKey);
                        const label =
                          script === 'trad' ? seg.labelTrad : seg.labelSimp;

                        return (
                          <div
                            key={partKey}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition ${
                              checked
                                ? 'border-emerald-500/50 bg-emerald-500/10 font-semibold'
                                : 'theme-border theme-elevated'
                            }`}
                          >
                            <button
                              onClick={() => handleToggleDayPart(d.dayIndex, partKey)}
                              className="flex items-center gap-2 text-left flex-1 truncate"
                            >
                              {checked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 theme-text-muted shrink-0" />
                              )}
                              <span className="truncate">{label}</span>
                            </button>

                            <Link
                              to={`/bible/${seg.bookId}.${seg.chapterStart}`}
                              className="text-brand hover:underline ml-2 shrink-0"
                            >
                              {t('读经')}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
