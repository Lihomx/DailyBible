import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseScriptureReference,
  executeReferenceQuery,
  formatBatchCopyVerses,
} from '../refParser';
import { executeKeywordSearch } from '../keywordSearch';
import { FullBibleBundle } from '../bible';

const bundlePath = path.resolve(process.cwd(), 'public/data/bible/cunps/_all.json');
const bundle: FullBibleBundle = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));

describe('Versatile Scripture Reference Parser & Search', () => {
  it('supports 太6:33 / 太六33 / 馬太6:33 / 馬太福音6:33', () => {
    const inputs = ['太6:33', '太六33', '馬太6:33', '馬太福音6:33'];
    for (const q of inputs) {
      const parsed = parseScriptureReference(q);
      expect(parsed).not.toBeNull();
      const res = executeReferenceQuery(parsed!, bundle);
      expect(res.length).toBe(1);
      expect(res[0].bookId).toBe('mat');
      expect(res[0].chapter).toBe(6);
      expect(res[0].verse).toBe(33);
      expect(res[0].text).toContain('你们要先求他的国和他的义');
    }
  });

  it('supports cross-chapter range 太1.17-2.4 and chapter range 太5-7', () => {
    const parsedCross = parseScriptureReference('太1.17-2.4');
    expect(parsedCross).not.toBeNull();
    const resCross = executeReferenceQuery(parsedCross!, bundle);
    // Matt 1 has 25 verses -> 1:17..25 is 9 verses, plus 2:1..4 is 4 verses = 13 verses
    expect(resCross.length).toBe(13);
    expect(resCross[0].id).toBe('mat.1.17');
    expect(resCross[resCross.length - 1].id).toBe('mat.2.4');

    const parsedChRange = parseScriptureReference('太5-7');
    expect(parsedChRange).not.toBeNull();
    const resChRange = executeReferenceQuery(parsedChRange!, bundle);
    expect(resChRange.length).toBeGreaterThan(100);
    expect(resChRange[0].id).toBe('mat.5.1');
  });

  it('supports lazy inputs 太7.1 and 使徒7', () => {
    const p1 = parseScriptureReference('太7.1');
    const r1 = executeReferenceQuery(p1!, bundle);
    expect(r1.length).toBe(1);
    expect(r1[0].id).toBe('mat.7.1');

    const p2 = parseScriptureReference('使徒7');
    const r2 = executeReferenceQuery(p2!, bundle);
    expect(r2.length).toBeGreaterThan(50);
    expect(r2[0].bookId).toBe('act');
    expect(r2[0].chapter).toBe(7);
  });

  it('supports full-Bible chapter:verse search 7:1', () => {
    const p = parseScriptureReference('7:1');
    expect(p?.type).toBe('cross_bible_chapter_verse');
    const r = executeReferenceQuery(p!, bundle);
    // 39 books in the Bible have at least 7 chapters
    expect(r.length).toBe(39);
    expect(r.every((v) => v.chapter === 7 && v.verse === 1)).toBe(true);
  });

  it('supports multi-keyword AND search (耶穌 愛 我) and exclusion search (光-暗)', () => {
    const multi = executeKeywordSearch('耶穌 愛 我', bundle, 'simp');
    expect(multi.results.length).toBeGreaterThan(10);
    for (const item of multi.results) {
      expect(item.text).toContain('耶稣');
      expect(item.text).toContain('爱');
      expect(item.text).toContain('我');
    }

    const excl = executeKeywordSearch('光-暗', bundle, 'simp');
    expect(excl.results.length).toBeGreaterThan(50);
    for (const item of excl.results) {
      expect(item.text).toContain('光');
      expect(item.text).not.toContain('暗');
    }
  });

  it('sorts and merges contiguous verses in batch copy', () => {
    const p = parseScriptureReference('约14:16-17');
    const verses = executeReferenceQuery(p!, bundle);
    const formatted = formatBatchCopyVerses(verses, 'simp');
    expect(formatted).toContain('约翰福音 14:16-17');
  });
});
