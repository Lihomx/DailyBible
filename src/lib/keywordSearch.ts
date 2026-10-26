import { BIBLE_BOOKS } from '../data/books';
import { FullBibleBundle } from './bible';
import { toSimplified, toTraditional } from './opencc';
import { MatchedVerseResult } from './refParser';

export interface ParsedKeywordQuery {
  includeTerms: string[];
  excludeTerms: string[];
}

export interface KeywordSearchOptions {
  scope?: 'all' | 'OT' | 'NT' | string; // 'all', 'OT', 'NT', or specific bookId
}

/**
 * Parse multi-keyword search with exclusion support:
 * - "耶穌 愛 我" -> include: ["耶穌", "愛", "我"], exclude: []
 * - "光-暗" or "光 -暗" -> include: ["光"], exclude: ["暗"]
 */
export function parseKeywordQuery(raw: string): ParsedKeywordQuery {
  const includeTerms: string[] = [];
  const excludeTerms: string[] = [];

  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('-') && token.length > 1) {
      excludeTerms.push(token.slice(1));
    } else if (token.includes('-')) {
      const parts = token.split('-').map((p) => p.trim());
      if (parts[0]) includeTerms.push(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        if (parts[i]) excludeTerms.push(parts[i]);
      }
    } else {
      includeTerms.push(token);
    }
  }

  return { includeTerms, excludeTerms };
}

/**
 * Execute multi-keyword and exclusion search across the full Bible bundle.
 * Supports searching in either Simplified or Traditional input regardless of current display script.
 */
export function executeKeywordSearch(
  rawQuery: string,
  bundle: FullBibleBundle,
  script: 'simp' | 'trad',
  options: KeywordSearchOptions = {}
): {
  results: MatchedVerseResult[];
  highlightTerms: string[];
} {
  const { includeTerms, excludeTerms } = parseKeywordQuery(rawQuery);
  if (includeTerms.length === 0) {
    return { results: [], highlightTerms: [] };
  }

  // Convert terms to target bundle script so Traditional input works on Simplified bundle and vice-versa
  const convert = script === 'trad' ? toTraditional : toSimplified;
  const normIncludes = includeTerms.map((t) => ({
    orig: t,
    target: convert(t),
  }));
  const normExcludes = excludeTerms.map((t) => ({
    orig: t,
    target: convert(t),
  }));

  const scope = options.scope || 'all';
  const results: MatchedVerseResult[] = [];

  for (const book of BIBLE_BOOKS) {
    if (scope === 'OT' && book.testament !== 'OT') continue;
    if (scope === 'NT' && book.testament !== 'NT') continue;
    if (scope !== 'all' && scope !== 'OT' && scope !== 'NT' && book.id !== scope) continue;

    const chapters = bundle[book.id];
    if (!chapters) continue;

    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const verses = chapters[chIdx];
      if (!verses) continue;

      for (const v of verses) {
        if (!v.t) continue;
        const textNoSpace = v.t.replace(/\u3000/g, '');

        const matchesAllIncludes = normIncludes.every(
          (inc) =>
            v.t.includes(inc.target) ||
            v.t.includes(inc.orig) ||
            textNoSpace.includes(inc.target) ||
            textNoSpace.includes(inc.orig)
        );
        if (!matchesAllIncludes) continue;

        const matchesAnyExclude = normExcludes.some(
          (exc) =>
            v.t.includes(exc.target) ||
            v.t.includes(exc.orig) ||
            textNoSpace.includes(exc.target) ||
            textNoSpace.includes(exc.orig)
        );
        if (matchesAnyExclude) continue;

        results.push({
          id: `${book.id}.${chIdx + 1}.${v.v}`,
          bookId: book.id,
          bookNameSimp: book.nameSimp,
          bookNameTrad: book.nameTrad,
          abbrSimp: book.abbrSimp,
          abbrTrad: book.abbrTrad,
          chapter: chIdx + 1,
          verse: v.v,
          text: v.t,
        });
      }
    }
  }

  const highlightTerms = Array.from(
    new Set(normIncludes.flatMap((i) => [i.target, i.orig]).filter(Boolean))
  );

  return { results, highlightTerms };
}
