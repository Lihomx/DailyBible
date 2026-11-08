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

export const BIBLE_CACHE_VERSION = 'v2';

export function sanitizeBibleText(text: string, script: 'simp' | 'trad'): string {
  if (script === 'simp') {
    return text
      .replace(/「/g, '“')
      .replace(/」/g, '”')
      .replace(/『/g, '‘')
      .replace(/』/g, '’')
      .replace(/:\s*“/g, '：“')
      .replace(/:\s*‘/g, '：‘');
  }
  return text;
}

function sanitizeBookData(data: BookBibleData, script: 'simp' | 'trad'): BookBibleData {
  if (script !== 'simp') return data;
  return {
    ...data,
    chapters: data.chapters.map((ch) =>
      ch.map((v) => ({
        ...v,
        t: sanitizeBibleText(v.t, script),
      }))
    ),
  };
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
    const bookData: BookBibleData = sanitizeBookData({
      id: bookId,
      name: getBookName(bookId, script),
      chapters: memoryBundleCache[ver][bookId],
    }, script);
    memoryBookCache[cacheKey] = bookData;
    return bookData;
  }

  // Check IndexedDB book cache or full bundle cache
  try {
    const cachedBundle = await idbGet<FullBibleBundle>(`bible_bundle_${ver}_${BIBLE_CACHE_VERSION}`);
    if (cachedBundle && cachedBundle[bookId]) {
      memoryBundleCache[ver] = cachedBundle;
      const bookData: BookBibleData = sanitizeBookData({
        id: bookId,
        name: getBookName(bookId, script),
        chapters: cachedBundle[bookId],
      }, script);
      memoryBookCache[cacheKey] = bookData;
      return bookData;
    }

    const cachedBook = await idbGet<BookBibleData>(`bible_book_${cacheKey}_${BIBLE_CACHE_VERSION}`);
    if (cachedBook) {
      const sanitized = sanitizeBookData(cachedBook, script);
      memoryBookCache[cacheKey] = sanitized;
      return sanitized;
    }
  } catch {
    // IndexedDB unavailable in non-browser or private mode
  }

  const res = await fetch(`/data/bible/${ver}/${bookId}.json`);
  if (!res.ok) {
    throw new Error(`无法加载经文数据: ${bookId}`);
  }
  const rawData = (await res.json()) as BookBibleData;
  const data = sanitizeBookData(rawData, script);
  memoryBookCache[cacheKey] = data;

  try {
    await idbSet(`bible_book_${cacheKey}_${BIBLE_CACHE_VERSION}`, data);
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
      const cached = await idbGet<FullBibleBundle>(`bible_bundle_${ver}_${BIBLE_CACHE_VERSION}`);
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
      await idbSet(`bible_bundle_${ver}_${BIBLE_CACHE_VERSION}`, bundle);
    } catch {
      // ignore IDB error
    }
    return bundle;
  })();

  bundlePromiseCache[ver] = promise;
  return promise;
}

export interface OfflineBibleStatus {
  cunps: boolean; // Simp downloaded
  cunpt: boolean; // Trad downloaded
  cunpsSize: number; // approximate bytes
  cunptSize: number;
}

/**
 * Check which Bible bundles are currently stored in IndexedDB
 */
export async function checkOfflineBibleStatus(): Promise<OfflineBibleStatus> {
  let cunps = false;
  let cunpt = false;
  let cunpsSize = 0;
  let cunptSize = 0;

  try {
    const sBundle = await idbGet<FullBibleBundle>(`bible_bundle_cunps_${BIBLE_CACHE_VERSION}`);
    if (sBundle && Object.keys(sBundle).length >= 66) {
      cunps = true;
      cunpsSize = 4.3 * 1024 * 1024; // ~4.3MB
    }
  } catch {
    // ignore
  }

  try {
    const tBundle = await idbGet<FullBibleBundle>(`bible_bundle_cunpt_${BIBLE_CACHE_VERSION}`);
    if (tBundle && Object.keys(tBundle).length >= 66) {
      cunpt = true;
      cunptSize = 4.4 * 1024 * 1024; // ~4.4MB
    }
  } catch {
    // ignore
  }

  return { cunps, cunpt, cunpsSize, cunptSize };
}

/**
 * Download a Bible bundle with progress callback (0..100)
 */
export async function downloadBibleBundleWithProgress(
  script: 'simp' | 'trad',
  onProgress?: (percent: number) => void
): Promise<void> {
  const ver = getVersionCode(script);
  if (onProgress) onProgress(10);

  const res = await fetch(`/data/bible/${ver}/_all.json`);
  if (!res.ok) {
    throw new Error(`下载圣经数据包失败 (${ver})`);
  }

  if (onProgress) onProgress(45);

  const bundle = (await res.json()) as FullBibleBundle;
  memoryBundleCache[ver] = bundle;

  if (onProgress) onProgress(75);

  await idbSet(`bible_bundle_${ver}_${BIBLE_CACHE_VERSION}`, bundle);

  if (onProgress) onProgress(100);
}

/**
 * Clear cached Bible bundle from IndexedDB
 */
export async function clearOfflineBibleBundle(script?: 'simp' | 'trad'): Promise<void> {
  const { del: idbDel } = await import('idb-keyval');
  if (!script) {
    delete memoryBundleCache['cunps'];
    delete memoryBundleCache['cunpt'];
    delete bundlePromiseCache['cunps'];
    delete bundlePromiseCache['cunpt'];
    await idbDel(`bible_bundle_cunps_${BIBLE_CACHE_VERSION}`);
    await idbDel(`bible_bundle_cunpt_${BIBLE_CACHE_VERSION}`);
    await idbDel('bible_bundle_cunps_v1');
    await idbDel('bible_bundle_cunpt_v1');
  } else {
    const ver = getVersionCode(script);
    delete memoryBundleCache[ver];
    delete bundlePromiseCache[ver];
    await idbDel(`bible_bundle_${ver}_${BIBLE_CACHE_VERSION}`);
    await idbDel(`bible_bundle_${ver}_v1`);
  }
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
