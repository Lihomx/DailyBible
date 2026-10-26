const CN_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  壹: 1,
  二: 2,
  两: 2,
  兩: 2,
  贰: 2,
  貳: 2,
  三: 3,
  叁: 3,
  弎: 3,
  四: 4,
  肆: 4,
  五: 5,
  伍: 5,
  六: 6,
  陆: 6,
  陸: 6,
  七: 7,
  柒: 7,
  八: 8,
  捌: 8,
  九: 9,
  玖: 9,
};

const CN_UNITS: Record<string, number> = {
  十: 10,
  拾: 10,
  廿: 20,
  卅: 30,
  卌: 40,
  百: 100,
  佰: 100,
};

/**
 * Parse a Chinese or Arabic number string (1..150) into an integer.
 * Supports: "6", "六", "十六", "二十三", "廿四", "卅一", "一百一十九", "一一九"
 */
export function parseChineseOrArabicNumber(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }

  // Pure digit sequence like "一一九" or "六"
  if ([...s].every((ch) => ch in CN_DIGITS)) {
    let val = 0;
    for (const ch of s) {
      val = val * 10 + CN_DIGITS[ch];
    }
    return val;
  }

  let total = 0;
  let currentDigit = 0;
  let hasAny = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch in CN_DIGITS) {
      currentDigit = CN_DIGITS[ch];
      hasAny = true;
    } else if (ch in CN_UNITS) {
      const unit = CN_UNITS[ch];
      hasAny = true;
      if (unit === 20 || unit === 30 || unit === 40) {
        total += unit;
        currentDigit = 0;
      } else if (unit === 10) {
        total += (currentDigit === 0 ? 1 : currentDigit) * 10;
        currentDigit = 0;
      } else if (unit === 100) {
        total += (currentDigit === 0 ? 1 : currentDigit) * 100;
        currentDigit = 0;
      }
    } else {
      return null;
    }
  }

  total += currentDigit;
  return hasAny ? total : null;
}

/**
 * Replace Chinese numeral segments inside a scripture query with Arabic numerals,
 * while preserving Chinese numerals that are part of book names (e.g. 约翰一书, 约翰二书, 约翰三书).
 */
export function normalizeChineseNumbersInRef(input: string): string {
  // Temporarily protect book names with Chinese numbers
  const protectedMap: Array<[string, string]> = [
    ['约翰一书', '__BOOK_1JN_S__'],
    ['約翰一書', '__BOOK_1JN_T__'],
    ['约翰壹书', '__BOOK_1JN_S__'],
    ['約翰壹書', '__BOOK_1JN_T__'],
    ['约一', '__BOOK_1JN_AS__'],
    ['約一', '__BOOK_1JN_AT__'],
    ['约翰二书', '__BOOK_2JN_S__'],
    ['約翰二書', '__BOOK_2JN_T__'],
    ['约翰贰书', '__BOOK_2JN_S__'],
    ['約翰貳書', '__BOOK_2JN_T__'],
    ['约二', '__BOOK_2JN_AS__'],
    ['約二', '__BOOK_2JN_AT__'],
    ['约翰三书', '__BOOK_3JN_S__'],
    ['約翰三書', '__BOOK_3JN_T__'],
    ['约翰叁书', '__BOOK_3JN_S__'],
    ['約翰叁書', '__BOOK_3JN_T__'],
    ['约三', '__BOOK_3JN_AS__'],
    ['約三', '__BOOK_3JN_AT__'],
  ];

  let work = input;
  for (const [orig, token] of protectedMap) {
    work = work.split(orig).join(token);
  }

  // Convert patterns like "太六33" -> "太6:33" or "创世记一章二节" -> "创世记1:2"
  work = work.replace(
    /([零〇一壹二两兩贰貳三叁弎四肆五伍六陆陸七柒八捌九玖十拾廿卅卌百佰]+)\s*[章篇]\s*([零〇一壹二两兩贰貳三叁弎四肆五伍六陆陸七柒八捌九玖十拾廿卅卌百佰\d]+)\s*节?/g,
    (_, chPart, vPart) => {
      const c = parseChineseOrArabicNumber(chPart);
      const v = parseChineseOrArabicNumber(vPart);
      if (c !== null && v !== null) return `${c}:${v}`;
      return _;
    }
  );

  // Convert "太六33" (Chinese number immediately followed by Arabic number) -> "太6:33"
  work = work.replace(
    /([零〇一壹二两兩贰貳三叁弎四肆五伍六陆陸七柒八捌九玖十拾廿卅卌百佰]+)(\d+)/g,
    (full, cnPart, arPart) => {
      const c = parseChineseOrArabicNumber(cnPart);
      if (c !== null) return `${c}:${arPart}`;
      return full;
    }
  );

  // Convert remaining standalone Chinese number sequences
  work = work.replace(
    /[零〇一壹二两兩贰貳三叁弎四肆五伍六陆陸七柒八捌九玖十拾廿卅卌百佰]+/g,
    (match) => {
      const n = parseChineseOrArabicNumber(match);
      return n !== null ? String(n) : match;
    }
  );

  for (const [orig, token] of protectedMap) {
    work = work.split(token).join(orig);
  }

  return work;
}
