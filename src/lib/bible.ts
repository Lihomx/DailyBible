import { get as idbGet, set as idbSet } from 'idb-keyval';
import { BOOK_BY_ID, getBookName } from '../data/books';

export interface VerseItem {
  v: number;
  t: string;
  h?: string;
  p?: boolean;
}

export interface BookBibleData {
  id: string;
  name: string;
  chapters: VerseItem[][];
}

export type FullBibleBundle = Record<string, VerseItem[][]>;

const memoryBookCache: Record<string, BookBibleData> = {};
const memoryBundleCache: Record<string, FullBibleBundle> = {};
const bundlePromiseCache: Record<string, Promise<FullBibleBundle> | undefined> = {};

function getVersionCode(script: 'simp' | 'trad'): 'cunps' | 'cunpt' {
  return script === 'trad' ? 'cunpt' : 'cunps';
}

export async function loadBookBible(
  bookId: string,
  script: 'simp' | 'trad'
): Promise<BookBibleData> {
  const ver = getVersionCode(script);
  const cacheKey = `${ver}:${bookId}`;

  if (memoryBookCache[cacheKey]) {
    return memoryBookCache[cacheKey];
  }

  // If full bundle is already in memory, slice from it
  if (memoryBundleCache[ver] && memoryBundleCache[ver][bookId]) {
    const bookData: BookBibleData = {
      id: bookId,
      name: getBookName(bookId, script),
      chapters: memoryBundleCache[ver][bookId],
    };
    memoryBookCache[cacheKey] = bookData;
    return bookData;
  }

  // Check IndexedDB book cache or full bundle cache
  try {
    const cachedBundle = await idbGet<FullBibleBundle>(`bible_bundle_${ver}_v1`);
    if (cachedBundle && cachedBundle[bookId]) {
      memoryBundleCache[ver] = cachedBundle;
      const bookData: BookBibleData = {
        id: bookId,
        name: getBookName(bookId, script),
        chapters: cachedBundle[bookId],
      };
      memoryBookCache[cacheKey] = bookData;
      return bookData;
    }

    const cachedBook = await idbGet<BookBibleData>(`bible_book_${cacheKey}_v1`);
    if (cachedBook) {
      memoryBookCache[cacheKey] = cachedBook;
      return cachedBook;
    }
  } catch {
    // IndexedDB unavailable in non-browser or private mode
  }

  const res = await fetch(`/data/bible/${ver}/${bookId}.json`);
  if (!res.ok) {
    throw new Error(`无法加载经文数据: ${bookId}`);
  }
  const data = (await res.json()) as BookBibleData;
  memoryBookCache[cacheKey] = data;

  try {
    await idbSet(`bible_book_${cacheKey}_v1`, data);
  } catch {
    // ignore
  }

  return data;
}

export async function loadChapterVerses(
  bookId: string,
  chapter: number,
  script: 'simp' | 'trad'
): Promise<VerseItem[]> {
  const book = await loadBookBible(bookId, script);
  const meta = BOOK_BY_ID[bookId];
  const chIdx = Math.max(0, Math.min((meta?.chapters || book.chapters.length) - 1, chapter - 1));
  return book.chapters[chIdx] || [];
}

/**
 * Load entire 66-book Bible bundle (cached in IndexedDB for instant offline search).
 */
export async function loadFullBibleBundle(script: 'simp' | 'trad'): Promise<FullBibleBundle> {
  const ver = getVersionCode(script);
  if (memoryBundleCache[ver]) {
    return memoryBundleCache[ver];
  }

  if (bundlePromiseCache[ver]) {
    return bundlePromiseCache[ver]!;
  }

  const promise = (async () => {
    try {
      const cached = await idbGet<FullBibleBundle>(`bible_bundle_${ver}_v1`);
      if (cached && Object.keys(cached).length >= 66) {
        memoryBundleCache[ver] = cached;
        return cached;
      }
    } catch {
      // ignore IDB error
    }

    const res = await fetch(`/data/bible/${ver}/_all.json`);
    if (!res.ok) {
      throw new Error(`无法加载全本圣经数据包 (${ver})`);
    }
    const bundle = (await res.json()) as FullBibleBundle;
    memoryBundleCache[ver] = bundle;

    try {
      await idbSet(`bible_bundle_${ver}_v1`, bundle);
    } catch {
      // ignore IDB error
    }
    return bundle;
  })();

  bundlePromiseCache[ver] = promise;
  return promise;
}

/**
 * Preload full Bible bundle in the background after initial page render for offline availability.
 */
export function preloadBibleForOffline(script: 'simp' | 'trad') {
  if (typeof window === 'undefined') return;
  const timer = setTimeout(() => {
    loadFullBibleBundle(script).catch(() => {});
  }, 1500);
  return () => clearTimeout(timer);
}
