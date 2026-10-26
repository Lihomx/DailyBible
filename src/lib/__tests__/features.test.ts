import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePptxFile } from '../pptx';
import { computePlanDayIndex, ReadingPlanData } from '../plan';
import { tokenizeTextWithScriptureRefs } from '../linkifyRefs';

const planPath = path.resolve(process.cwd(), 'public/data/plans/desheng.json');
const plan: ReadingPlanData = JSON.parse(fs.readFileSync(planPath, 'utf-8'));

const samplePptxPath = path.resolve(
  process.cwd(),
  'public/samples/2024-12-01-works-of-the-holy-spirit.pptx'
);

describe('Desheng Plan, PPTX Parser & Scripture Auto-Linkifier', () => {
  it('has 365 days in Desheng reading plan and reuses Feb 28 on leap year Feb 29', () => {
    expect(plan.days.length).toBe(365);
    const feb28 = computePlanDayIndex(plan, 'calendar', new Date(2024, 1, 28));
    const feb29 = computePlanDayIndex(plan, 'calendar', new Date(2024, 1, 29));
    expect(feb29).toBe(feb28);
    expect(feb28).toBe(59);
  });

  it('parses the sample sermon PPTX and extracts slides and blocks cleanly', async () => {
    const buf = fs.readFileSync(samplePptxPath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const parsed = await parsePptxFile(ab);
    expect(parsed.slides.length).toBe(15);
    expect(parsed.blocks.length).toBeGreaterThan(10);
    expect(parsed.inferredTitle).toContain('聖靈的工作');
  });

  it('auto-linkifies scripture references inside sermon text', () => {
    const sample =
      '經節 約翰福音 14:16-17 我要求父，以及 哥林多後書 3:17 主就是那靈。';
    const tokens = tokenizeTextWithScriptureRefs(sample);
    const refs = tokens.filter((t) => t.type === 'ref');
    expect(refs.length).toBe(2);
    expect(refs[0].bookId).toBe('jhn');
    expect(refs[0].chapter).toBe(14);
    expect(refs[0].verseStart).toBe(16);
    expect(refs[1].bookId).toBe('2co');
    expect(refs[1].chapter).toBe(3);
    expect(refs[1].verseStart).toBe(17);
  });
});
