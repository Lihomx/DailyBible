import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { BIBLE_BOOKS } from '../src/data/books';

export interface VerseItem {
  v: number; // verse number 1-based
  t: string; // verse text
  h?: string; // optional section heading before this verse (e.g. "神的创造")
  p?: boolean; // true if this verse starts a new paragraph
}

export interface BookBibleData {
  id: string;
  name: string;
  chapters: VerseItem[][]; // 0-indexed array of chapters (chapter 1 is index 0)
}

const SOURCES = [
  {
    code: 'cunps',
    script: 'simp' as const,
    url: 'https://ebible.org/Scriptures/cmn-cu89s_usfm.zip',
  },
  {
    code: 'cunpt',
    script: 'trad' as const,
    url: 'https://ebible.org/Scriptures/cmn-cu89t_usfm.zip',
  },
];

function cleanUsfmText(raw: string): string {
  return raw
    // Remove footnotes \f ... \f* and cross references \x ... \x*
    .replace(/\\f\s+[\s\S]*?\\f\*/g, '')
    .replace(/\\x\s+[\s\S]*?\\x\*/g, '')
    // Remove strong's numbers or word attributes like |strong="H1234"
    .replace(/\|[a-zA-Z0-9_="-]+/g, '')
    // Remove character formatting tags like \wj \wj* \add \add* \nd \nd* \qs \qs* \bk \bk* \pn \pn*
    .replace(/\\\+?[a-z0-9]+\*/g, '')
    .replace(/\\\+?[a-z0-9]+\s?/g, '')
    // Collapse multiple spaces (preserve full-width space \u3000 for 　神)
    .replace(/[ \t\r\n]+/g, ' ')
    .trim();
}

function parseUsfmBook(usfmContent: string, expectedChapters: number): VerseItem[][] {
  const chapters: VerseItem[][] = [];
  const lines = usfmContent.split(/\r?\n/);

  let currentChapter: VerseItem[] = [];
  let currentChapterNum = 0;
  let pendingHeading = '';
  let pendingParagraph = true;
  let currentVerse: VerseItem | null = null;

  const flushVerse = () => {
    if (currentVerse) {
      currentVerse.t = cleanUsfmText(currentVerse.t);
      if (currentVerse.t || currentVerse.v > 0) {
        currentChapter.push(currentVerse);
      }
      currentVerse = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('\\c ')) {
      flushVerse();
      const chNum = parseInt(line.slice(3).trim(), 10);
      if (!isNaN(chNum)) {
        if (currentChapterNum > 0) {
          chapters[currentChapterNum - 1] = currentChapter;
        }
        currentChapterNum = chNum;
        currentChapter = [];
        pendingHeading = '';
        pendingParagraph = true;
      }
      continue;
    }

    if (currentChapterNum === 0) continue;

    // Section headings: \s, \s1, \s2, \ms, \d (Psalm title)
    if (/^\\(s[123]?|ms[12]?|d)\b/.test(line)) {
      flushVerse();
      const text = cleanUsfmText(line.replace(/^\\[a-z0-9]+\s*/, ''));
      if (text) {
        pendingHeading = pendingHeading ? `${pendingHeading} · ${text}` : text;
      }
      pendingParagraph = true;
      continue;
    }

    // Paragraph or poetry break markers
    if (/^\\(p|m|nb|q[123]?|b|pi|pc|pm)\b/.test(line)) {
      const rest = line.replace(/^\\[a-z0-9]+\s*/, '').trim();
      pendingParagraph = true;
      if (!rest) continue;
      // Sometimes a \v or continuation text follows on the same line after \p or \q1
      if (rest.startsWith('\\v ')) {
        processVerseLine(rest);
      } else if (currentVerse) {
        currentVerse.t += ' ' + rest;
      }
      continue;
    }

    if (line.startsWith('\\v ')) {
      processVerseLine(line);
      continue;
    }

    // Ignore metadata tags
    if (/^\\(id|ide|h|toc[123]|mt[123]|cl|rem|r)\b/.test(line)) {
      continue;
    }

    // Continuation of current verse text
    if (currentVerse) {
      currentVerse.t += ' ' + line;
    }
  }

  function processVerseLine(vLine: string) {
    flushVerse();
    // Match \v 1 or \v 1-2
    const m = vLine.match(/^\\v\s+(\d+)(?:-\d+)?\s*(.*)$/);
    if (!m) return;
    const vNum = parseInt(m[1], 10);
    const vText = m[2] || '';
    currentVerse = {
      v: vNum,
      t: vText,
    };
    if (pendingHeading) {
      currentVerse.h = pendingHeading;
      pendingHeading = '';
    }
    if (pendingParagraph) {
      currentVerse.p = true;
      pendingParagraph = false;
    }
  }

  flushVerse();
  if (currentChapterNum > 0) {
    chapters[currentChapterNum - 1] = currentChapter;
  }

  // Ensure no empty slots up to expectedChapters
  for (let i = 0; i < expectedChapters; i++) {
    if (!chapters[i]) {
      chapters[i] = [];
    }
  }

  return chapters;
}

async function buildBible() {
  const cacheDir = path.resolve(process.cwd(), '.cache');
  fs.mkdirSync(cacheDir, { recursive: true });

  for (const src of SOURCES) {
    console.log(`\n=== Building ${src.code} (${src.url}) ===`);
    const zipPath = path.join(cacheDir, `${src.code}.zip`);

    if (!fs.existsSync(zipPath)) {
      console.log(`Downloading ${src.url} ...`);
      const res = await fetch(src.url);
      if (!res.ok) {
        throw new Error(`Failed to download ${src.url}: ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(zipPath, buf);
    }

    const zipBuf = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(zipBuf);
    const fileNames = Object.keys(zip.files);

    const outDir = path.resolve(process.cwd(), 'public', 'data', 'bible', src.code);
    fs.mkdirSync(outDir, { recursive: true });

    const allBundle: Record<string, VerseItem[][]> = {};
    let totalVerses = 0;

    for (const book of BIBLE_BOOKS) {
      // Find matching USFM file in zip (e.g. "01-GENcmn-cu89s.usfm" or "*GEN*.usfm")
      const matchFile = fileNames.find(
        (f) =>
          f.toUpperCase().includes(book.usfm.toUpperCase()) &&
          (f.endsWith('.usfm') || f.endsWith('.SFM') || f.endsWith('.sfm'))
      );

      if (!matchFile) {
        throw new Error(`Missing USFM file for book ${book.id} (${book.usfm}) in ${src.code}`);
      }

      const content = await zip.files[matchFile].async('string');
      const chapters = parseUsfmBook(content, book.chapters);

      const bookData: BookBibleData = {
        id: book.id,
        name: src.script === 'trad' ? book.nameTrad : book.nameSimp,
        chapters,
      };

      for (const ch of chapters) {
        totalVerses += ch.length;
      }

      fs.writeFileSync(
        path.join(outDir, `${book.id}.json`),
        JSON.stringify(bookData),
        'utf-8'
      );
      allBundle[book.id] = chapters;
    }

    fs.writeFileSync(path.join(outDir, '_all.json'), JSON.stringify(allBundle), 'utf-8');
    console.log(
      `✓ ${src.code}: Generated 66 book JSONs + _all.json (${totalVerses} verses total)`
    );
  }
}

buildBible().catch((err) => {
  console.error(err);
  process.exit(1);
});
