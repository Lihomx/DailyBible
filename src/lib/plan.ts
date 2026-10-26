export interface PlanReadingSegment {
  part: 'ps' | 'nt' | 'ot';
  bookId: string;
  bookNameSimp: string;
  bookNameTrad: string;
  chapterStart: number;
  chapterEnd: number;
  verseSpec?: string;
  labelSimp: string;
  labelTrad: string;
}

export interface PlanDayEntry {
  dayIndex: number; // 1..365
  month: number; // 1..12
  day: number; // 1..31
  readings: {
    ps: PlanReadingSegment;
    nt: PlanReadingSegment;
    ot: PlanReadingSegment;
  };
}

export interface ReadingPlanData {
  id: string;
  nameSimp: string;
  nameTrad: string;
  descriptionSimp: string;
  descriptionTrad: string;
  totalDays: number;
  days: PlanDayEntry[];
}

let cachedPlan: ReadingPlanData | null = null;

export async function loadDeshengPlan(): Promise<ReadingPlanData> {
  if (cachedPlan) return cachedPlan;
  const res = await fetch('/data/plans/desheng.json');
  if (!res.ok) {
    throw new Error('无法加载得胜读经计划数据');
  }
  cachedPlan = (await res.json()) as ReadingPlanData;
  return cachedPlan;
}

/**
 * Given a Date and a group's start_date ('calendar' or 'YYYY-MM-DD'),
 * return the corresponding dayIndex (1..365).
 * Rule confirmed with user: On leap year Feb 29, reuse Feb 28 (dayIndex 59).
 */
export function computePlanDayIndex(
  plan: ReadingPlanData,
  startDateMode: string = 'calendar',
  targetDate: Date = new Date()
): number {
  const m = targetDate.getMonth() + 1;
  let d = targetDate.getDate();

  // Leap year Feb 29 -> reuse Feb 28
  if (m === 2 && d === 29) {
    d = 28;
  }

  if (!startDateMode || startDateMode === 'calendar') {
    const found = plan.days.find((entry) => entry.month === m && entry.day === d);
    return found ? found.dayIndex : 1;
  }

  // Custom group start_date 'YYYY-MM-DD'
  const parts = startDateMode.split('-').map((n) => parseInt(n, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    const startUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const targetUtc = Date.UTC(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    const diffDays = Math.floor((targetUtc - startUtc) / (1000 * 60 * 60 * 24));
    const mod = ((diffDays % 365) + 365) % 365;
    return mod + 1;
  }

  return 1;
}

export function getPlanDayByIndex(
  plan: ReadingPlanData,
  dayIndex: number
): PlanDayEntry {
  const clamped = Math.max(1, Math.min(365, dayIndex));
  return plan.days[clamped - 1] || plan.days[0];
}
