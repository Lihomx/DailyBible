import { BIBLE_BOOKS } from '../data/books';
import { parseScriptureReference } from './refParser';

export interface TextOrRefToken {
  type: 'text' | 'ref';
  text: string;
  bookId?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
}

// Build regex matching all Chinese book names (full + common multi-char names) followed by chapter:verse
const BOOK_NAMES_SORTED = Array.from(
  new Set(
    BIBLE_BOOKS.flatMap((b) => [
      b.nameSimp,
      b.nameTrad,
      ...b.aliases,
      b.abbrSimp.length >= 2 ? b.abbrSimp : '',
      b.abbrTrad.length >= 2 ? b.abbrTrad : '',
    ]).filter(Boolean)
  )
).sort((a, b) => b.length - a.length);

const ESCAPED_BOOK_NAMES = BOOK_NAMES_SORTED.map((n) =>
  n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
).join('|');

const REF_REGEX = new RegExp(
  `((?:${ESCAPED_BOOK_NAMES})\\s*\\d{1,3}(?:\\s*[:：.]\\s*\\d{1,3}(?:\\s*[-—–~～]\\s*(?:\\d{1,3}\\s*[:：.]\\s*)?\\d{1,3})?[abAB]?)?)`,
  'g'
);

/**
 * Split a paragraph into plain text and interactive scripture reference tokens.
 */
export function tokenizeTextWithScriptureRefs(text: string): TextOrRefToken[] {
  if (!text) return [];
  const tokens: TextOrRefToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(REF_REGEX)) {
    const matchText = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, index),
      });
    }

    const parsed = parseScriptureReference(matchText);
    if (parsed && parsed.type === 'single_or_range') {
      tokens.push({
        type: 'ref',
        text: matchText,
        bookId: parsed.book.id,
        chapter: parsed.startChapter,
        verseStart: parsed.startVerse,
        verseEnd: parsed.endVerse,
      });
    } else {
      tokens.push({
        type: 'text',
        text: matchText,
      });
    }

    lastIndex = index + matchText.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      text: text.slice(lastIndex),
    });
  }

  return tokens;
}
