import fs from 'node:fs';
import path from 'node:path';
import { matchBookByName, getBookName } from '../src/data/books';

export interface PlanReadingSegment {
  part: 'ps' | 'nt' | 'ot'; // ps = 诗篇/箴言, nt = 新约, ot = 旧约
  bookId: string;
  bookNameSimp: string;
  bookNameTrad: string;
  chapterStart: number;
  chapterEnd: number;
  verseSpec?: string; // e.g. "1-80" for Psalm 119 splits if any
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

const MONTH_MAP: Record<string, number> = {
  一月: 1,
  二月: 2,
  三月: 3,
  四月: 4,
  五月: 5,
  六月: 6,
  七月: 7,
  八月: 8,
  九月: 9,
  十月: 10,
  十一月: 11,
  十二月: 12,
};

function normalizeBookName(raw: string): string {
  return raw
    .replace(/^道书$/, '传道书')
    .replace(/约珥记/g, '约珥书')
    .replace(/约拿记/g, '约拿书')
    .replace(/但以理记/g, '但以理书')
    .replace(/何西阿记/g, '何西阿书')
    .replace(/阿摩司记/g, '阿摩司书')
    .replace(/俄巴底亚记/g, '俄巴底亚书')
    .replace(/弥迦记/g, '弥迦书')
    .replace(/那鸿记/g, '那鸿书')
    .replace(/哈巴谷记/g, '哈巴谷书')
    .replace(/西番雅记/g, '西番雅书')
    .replace(/哈该记/g, '哈该书')
    .replace(/撒迦利亚记/g, '撒迦利亚书')
    .replace(/玛拉基记/g, '玛拉基书')
    .replace(/列王记上/g, '列王纪上')
    .replace(/列王记下/g, '列王纪下')
    .replace(/约翰壹书/g, '约翰一书')
    .replace(/约翰贰书/g, '约翰二书')
    .replace(/约翰叁书/g, '约翰三书')
    .replace(/希伯来$/, '希伯来书')
    .replace(/阿摩司$/, '阿摩司书')
    .replace(/俄巴底亚$/, '俄巴底亚书')
    .replace(/撒迦利亚$/, '撒迦利亚书')
    .replace(/玛拉基$/, '玛拉基书')
    .replace(/哈巴谷$/, '哈巴谷书')
    .replace(/西番雅$/, '西番雅书')
    .replace(/以西结$/, '以西结书')
    .replace(/但以理$/, '但以理书')
    .replace(/耶利米$/, '耶利米书')
    .replace(/以赛亚$/, '以赛亚书')
    .replace(/何西阿$/, '何西阿书')
    .replace(/腓利门$/, '腓利门书')
    .replace(/歌罗西$/, '歌罗西书')
    .replace(/腓立比$/, '腓立比书')
    .replace(/以弗所$/, '以弗所书')
    .replace(/加拉太$/, '加拉太书')
    .replace(/犹大$/, '犹大书')
    .replace(/雅各$/, '雅各书')
    .replace(/约拿$/, '约拿书')
    .replace(/弥迦$/, '弥迦书')
    .replace(/那鸿$/, '那鸿书')
    .replace(/哈该$/, '哈该书')
    .replace(/约珥$/, '约珥书')
    .replace(/提多$/, '提多书')
    .trim();
}

function parseSegmentToken(
  part: 'ps' | 'nt' | 'ot',
  bookRaw: string,
  rangeRaw: string
): PlanReadingSegment {
  const cleanName = normalizeBookName(bookRaw);
  const book = matchBookByName(cleanName);
  if (!book) {
    throw new Error(`Unrecognized book name in plan: "${bookRaw}" (normalized: "${cleanName}")`);
  }

  // Range can be: "1", "1-2", "119:1-88", "119：89-176", "全"
  const normRange = rangeRaw
    .replace(/：/g, ':')
    .replace(/—|--|～|~/g, '-')
    .trim();

  let chapterStart = 1;
  let chapterEnd = 1;
  let verseSpec: string | undefined;

  if (normRange.includes(':')) {
    const [chStr, vPart] = normRange.split(':');
    chapterStart = parseInt(chStr, 10) || 1;
    chapterEnd = chapterStart;
    verseSpec = vPart;
  } else if (normRange.includes('-')) {
    const [s, e] = normRange.split('-').map((n) => parseInt(n, 10));
    chapterStart = s || 1;
    chapterEnd = e || chapterStart;
  } else {
    const n = parseInt(normRange, 10);
    chapterStart = isNaN(n) ? 1 : n;
    chapterEnd = chapterStart;
  }

  const rangeLabel =
    chapterStart === chapterEnd
      ? verseSpec
        ? `${chapterStart}:${verseSpec}`
        : `${chapterStart}章`
      : `${chapterStart}-${chapterEnd}章`;

  const bookSimp = getBookName(book.id, 'simp');
  const bookTrad = getBookName(book.id, 'trad');

  return {
    part,
    bookId: book.id,
    bookNameSimp: bookSimp,
    bookNameTrad: bookTrad,
    chapterStart,
    chapterEnd,
    verseSpec,
    labelSimp: `${bookSimp} ${rangeLabel}`,
    labelTrad: `${bookTrad} ${rangeLabel.replace('章', '章')}`,
  };
}

async function buildPlan() {
  console.log('\n=== Building Desheng Reading Plan ===');
  const url = 'https://blog.wenxuecity.com/myblog/68903/201509/170475.html';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch plan from ${url}: ${res.status}`);
  }
  const html = await res.text();
  const idx = html.indexOf('得胜读经计划内容');
  const slice = idx >= 0 ? html.slice(idx) : html;

  // Strip tags into lines
  const text = slice
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<wbr[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;|&rdquo;/g, '"');

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u3000\s]+/g, ' ').trim())
    .filter(Boolean);

  let currentMonth = 0;
  const days: PlanDayEntry[] = [];

  for (const line of lines) {
    if (MONTH_MAP[line]) {
      currentMonth = MONTH_MAP[line];
      continue;
    }

    if (currentMonth === 0) continue;

    // Match day row e.g.:
    // "1. 诗篇 1 马太福音 1 创世记 1-2"
    // or "18. 诗篇 119:1-88 路加福音 7 约书亚记 1-2"
    // or books with 1 chapter like "腓利门书" or "俄巴底亚书" or "犹大书" or "约翰二书"
    const m = line.match(
      /^(\d{1,2})\.\s*([^\d\s]+)\s*([\d:：\-\*]+)?\s+([^\d\s]+)\s*([\d:：\-\*]+)?\s+([^\d\s]+)\s*([\d:：\-\*]+)?/
    );
    if (m) {
      const dayNum = parseInt(m[1], 10);
      if (dayNum < 1 || dayNum > 31) continue;

      // Avoid duplicate month/day if page has footer noise
      if (days.some((d) => d.month === currentMonth && d.day === dayNum)) {
        continue;
      }

      const psBook = m[2];
      const psRange = m[3] || '1';
      const ntBook = m[4];
      const ntRange = m[5] || '1';
      const otBook = m[6];
      const otRange = m[7] || '1';

      const dayIndex = days.length + 1;
      days.push({
        dayIndex,
        month: currentMonth,
        day: dayNum,
        readings: {
          ps: parseSegmentToken('ps', psBook, psRange),
          nt: parseSegmentToken('nt', ntBook, ntRange),
          ot: parseSegmentToken('ot', otBook, otRange),
        },
      });
    }
  }

  console.log(`Parsed ${days.length} days from Wenxuecity Desheng plan.`);
  if (days.length !== 365) {
    throw new Error(`Expected 365 days, got ${days.length}`);
  }

  const outData: ReadingPlanData = {
    id: 'desheng',
    nameSimp: '得胜读经计划',
    nameTrad: '得勝讀經計劃',
    descriptionSimp:
      '每天读一篇诗篇或箴言、一章新约（一年读两遍福音书）、两章旧约（按年代次序通读），一年读完整本圣经。',
    descriptionTrad:
      '每天讀一篇詩篇或箴言、一章新約（一年讀兩遍福音書）、兩章舊約（按年代次序通讀），一年讀完整本聖經。',
    totalDays: 365,
    days,
  };

  const outDir = path.resolve(process.cwd(), 'public', 'data', 'plans');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'desheng.json'),
    JSON.stringify(outData, null, 2),
    'utf-8'
  );
  console.log('✓ Saved public/data/plans/desheng.json (365 days)');
}

buildPlan().catch((err) => {
  console.error(err);
  process.exit(1);
});
