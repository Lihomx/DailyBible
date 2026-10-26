import { BIBLE_BOOKS, BOOK_BY_ID, BookMeta, matchBookByName } from '../data/books';
import { normalizeChineseNumbersInRef } from './chineseNum';
import { FullBibleBundle } from './bible';

export type ParsedReferenceQuery =
  | {
      type: 'single_or_range';
      book: BookMeta;
      startChapter: number;
      startVerse?: number;
      endChapter: number;
      endVerse?: number;
    }
  | {
      type: 'cross_bible_chapter_verse';
      chapter: number;
      verse: number;
    };

export interface MatchedVerseResult {
  id: string; // e.g. "mat.6.33"
  bookId: string;
  bookNameSimp: string;
  bookNameTrad: string;
  abbrSimp: string;
  abbrTrad: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Parse versatile user reference input:
 * 1. 太6:33 / 太六33 / 馬太6:33 / 馬太福音6:33
 * 2. 區間搜尋：太1.17-2.4、太5-7、太6:31-34
 * 3. 懶人輸入：太7.1、使徒7
 * 4. 全聖經搜尋：7:1 or 7.1（找所有第7章第1節）
 */
export function parseScriptureReference(rawQuery: string): ParsedReferenceQuery | null {
  if (!rawQuery) return null;
  let q = rawQuery.trim();
  if (!q) return null;

  // Normalize full-width punctuation
  q = q
    .replace(/[：]/g, ':')
    .replace(/[．。、]/g, '.')
    .replace(/[—–～~]/g, '-')
    .replace(/第/g, '');

  // Case 4: Cross-Bible search like "7:1" or "7.1" (no book prefix)
  const crossMatch = q.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (crossMatch) {
    const chapter = parseInt(crossMatch[1], 10);
    const verse = parseInt(crossMatch[2], 10);
    if (chapter >= 1 && chapter <= 150 && verse >= 1 && verse <= 176) {
      return {
        type: 'cross_bible_chapter_verse',
        chapter,
        verse,
      };
    }
  }

  // Normalize Chinese numbers like "太六33" -> "太6:33", "使徒七" -> "使徒7"
  const norm = normalizeChineseNumbersInRef(q)
    .replace(/[章篇]/g, ':')
    .replace(/节/g, '')
    .replace(/:\s*$/g, '')
    .trim();

  // Separate book name prefix from numeric reference part
  // Book names can start with 1/2/3 in English (1co), but in Chinese they are non-digits
  const m = norm.match(/^([^\d:.\-]+?)\s*(\d[\d:.\-\s]*[abAB]?)$/);
  if (!m) {
    return null;
  }

  const bookRaw = m[1].trim();
  const refRaw = m[2].replace(/[abAB]/g, '').replace(/\s+/g, '');

  const book = matchBookByName(bookRaw);
  if (!book) {
    return null;
  }

  // Pattern A: Cross-chapter verse range: "1:17-2:4" or "1.17-2.4"
  const crossChVerse = refRaw.match(/^(\d+)[:.](\d+)-(\d+)[:.](\d+)$/);
  if (crossChVerse) {
    const startChapter = parseInt(crossChVerse[1], 10);
    const startVerse = parseInt(crossChVerse[2], 10);
    const endChapter = parseInt(crossChVerse[3], 10);
    const endVerse = parseInt(crossChVerse[4], 10);
    return {
      type: 'single_or_range',
      book,
      startChapter,
      startVerse,
      endChapter,
      endVerse,
    };
  }

  // Pattern B: Same-chapter verse range: "6:31-34" or "6.31-34"
  const sameChVerseRange = refRaw.match(/^(\d+)[:.](\d+)-(\d+)$/);
  if (sameChVerseRange) {
    const ch = parseInt(sameChVerseRange[1], 10);
    const startVerse = parseInt(sameChVerseRange[2], 10);
    const endVerse = parseInt(sameChVerseRange[3], 10);
    return {
      type: 'single_or_range',
      book,
      startChapter: ch,
      startVerse,
      endChapter: ch,
      endVerse,
    };
  }

  // Pattern C: Single chapter & verse: "6:33" or "7.1"
  const singleChVerse = refRaw.match(/^(\d+)[:.](\d+)$/);
  if (singleChVerse) {
    const ch = parseInt(singleChVerse[1], 10);
    const v = parseInt(singleChVerse[2], 10);
    return {
      type: 'single_or_range',
      book,
      startChapter: ch,
      startVerse: v,
      endChapter: ch,
      endVerse: v,
    };
  }

  // Pattern D: Chapter range: "5-7" (e.g. 太5-7)
  const chapterRange = refRaw.match(/^(\d+)-(\d+)$/);
  if (chapterRange) {
    const startChapter = parseInt(chapterRange[1], 10);
    const endChapter = parseInt(chapterRange[2], 10);
    return {
      type: 'single_or_range',
      book,
      startChapter,
      endChapter,
    };
  }

  // Pattern E: Whole chapter: "7" (e.g. 使徒7)
  const singleChapter = refRaw.match(/^(\d+)$/);
  if (singleChapter) {
    const ch = parseInt(singleChapter[1], 10);
    return {
      type: 'single_or_range',
      book,
      startChapter: ch,
      endChapter: ch,
    };
  }

  return null;
}

/**
 * Execute a parsed reference query against the loaded Bible bundle.
 */
export function executeReferenceQuery(
  parsed: ParsedReferenceQuery,
  bundle: FullBibleBundle
): MatchedVerseResult[] {
  const results: MatchedVerseResult[] = [];

  if (parsed.type === 'cross_bible_chapter_verse') {
    for (const book of BIBLE_BOOKS) {
      const bookChapters = bundle[book.id];
      if (!bookChapters || parsed.chapter > bookChapters.length) continue;
      const chVerses = bookChapters[parsed.chapter - 1];
      if (!chVerses) continue;
      const found = chVerses.find((item) => item.v === parsed.verse);
      if (found && found.t) {
        results.push({
          id: `${book.id}.${parsed.chapter}.${found.v}`,
          bookId: book.id,
          bookNameSimp: book.nameSimp,
          bookNameTrad: book.nameTrad,
          abbrSimp: book.abbrSimp,
          abbrTrad: book.abbrTrad,
          chapter: parsed.chapter,
          verse: found.v,
          text: found.t,
        });
      }
    }
    return results;
  }

  const { book, startChapter, startVerse, endChapter, endVerse } = parsed;
  const bookChapters = bundle[book.id];
  if (!bookChapters) return results;

  const minCh = Math.max(1, Math.min(startChapter, endChapter));
  const maxCh = Math.min(bookChapters.length, Math.max(startChapter, endChapter));

  for (let ch = minCh; ch <= maxCh; ch++) {
    const chVerses = bookChapters[ch - 1] || [];
    for (const item of chVerses) {
      if (!item.t) continue;
      if (ch === minCh && startVerse !== undefined && item.v < startVerse) {
        continue;
      }
      if (ch === maxCh && endVerse !== undefined && item.v > endVerse) {
        continue;
      }
      results.push({
        id: `${book.id}.${ch}.${item.v}`,
        bookId: book.id,
        bookNameSimp: book.nameSimp,
        bookNameTrad: book.nameTrad,
        abbrSimp: book.abbrSimp,
        abbrTrad: book.abbrTrad,
        chapter: ch,
        verse: item.v,
        text: item.t,
      });
    }
  }

  return results;
}

/**
 * Format a list of selected verses into a neatly sorted and merged copy text.
 * Consecutive verses in the same book & chapter are merged nicely.
 */
export function formatBatchCopyVerses(
  verses: MatchedVerseResult[],
  script: 'simp' | 'trad'
): string {
  if (verses.length === 0) return '';

  // Deduplicate by id and sort by book index -> chapter -> verse
  const uniqueMap = new Map<string, MatchedVerseResult>();
  for (const v of verses) {
    uniqueMap.set(v.id, v);
  }

  const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
    const idxA = BOOK_BY_ID[a.bookId]?.index ?? 999;
    const idxB = BOOK_BY_ID[b.bookId]?.index ?? 999;
    if (idxA !== idxB) return idxA - idxB;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  // Group contiguous verses in the same book and chapter
  interface ContiguousGroup {
    bookId: string;
    bookName: string;
    chapter: number;
    startVerse: number;
    endVerse: number;
    items: MatchedVerseResult[];
  }

  const groups: ContiguousGroup[] = [];
  for (const v of sorted) {
    const bookName = script === 'trad' ? v.bookNameTrad : v.bookNameSimp;
    const last = groups[groups.length - 1];
    if (
      last &&
      last.bookId === v.bookId &&
      last.chapter === v.chapter &&
      last.endVerse + 1 === v.verse
    ) {
      last.endVerse = v.verse;
      last.items.push(v);
    } else {
      groups.push({
        bookId: v.bookId,
        bookName,
        chapter: v.chapter,
        startVerse: v.verse,
        endVerse: v.verse,
        items: [v],
      });
    }
  }

  return groups
    .map((g) => {
      const refHeader =
        g.startVerse === g.endVerse
          ? `${g.bookName} ${g.chapter}:${g.startVerse}`
          : `${g.bookName} ${g.chapter}:${g.startVerse}-${g.endVerse}`;
      const body =
        g.items.length === 1
          ? g.items[0].text
          : g.items.map((it) => `${it.verse}${it.text}`).join(' ');
      return `${refHeader} ${body}`;
    })
    .join('\n\n');
}
