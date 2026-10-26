export interface BookMeta {
  index: number; // 1..66
  id: string; // wd.bible style slug e.g. 'gen', 'mat'
  usfm: string; // eBible USFM code e.g. 'GEN', 'MAT'
  testament: 'OT' | 'NT';
  category: string;
  nameSimp: string;
  nameTrad: string;
  abbrSimp: string;
  abbrTrad: string;
  aliases: string[];
  chapters: number;
}

export const BIBLE_BOOKS: BookMeta[] = [
  // 旧约摩西五经
  { index: 1, id: 'gen', usfm: 'GEN', testament: 'OT', category: '摩西五经', nameSimp: '创世记', nameTrad: '創世記', abbrSimp: '创', abbrTrad: '創', aliases: ['创世纪', '創世紀', '创世'], chapters: 50 },
  { index: 2, id: 'exo', usfm: 'EXO', testament: 'OT', category: '摩西五经', nameSimp: '出埃及记', nameTrad: '出埃及記', abbrSimp: '出', abbrTrad: '出', aliases: ['出埃及'], chapters: 40 },
  { index: 3, id: 'lev', usfm: 'LEV', testament: 'OT', category: '摩西五经', nameSimp: '利未记', nameTrad: '利未記', abbrSimp: '利', abbrTrad: '利', aliases: ['利未'], chapters: 27 },
  { index: 4, id: 'num', usfm: 'NUM', testament: 'OT', category: '摩西五经', nameSimp: '民数记', nameTrad: '民數記', abbrSimp: '民', abbrTrad: '民', aliases: ['民数', '民數'], chapters: 36 },
  { index: 5, id: 'deu', usfm: 'DEU', testament: 'OT', category: '摩西五经', nameSimp: '申命记', nameTrad: '申命記', abbrSimp: '申', abbrTrad: '申', aliases: ['申命'], chapters: 34 },

  // 旧约历史书
  { index: 6, id: 'jos', usfm: 'JOS', testament: 'OT', category: '历史书', nameSimp: '约书亚记', nameTrad: '約書亞記', abbrSimp: '书', abbrTrad: '書', aliases: ['约书亚', '約書亞'], chapters: 24 },
  { index: 7, id: 'jdg', usfm: 'JDG', testament: 'OT', category: '历史书', nameSimp: '士师记', nameTrad: '士師記', abbrSimp: '士', abbrTrad: '士', aliases: ['士师', '士師'], chapters: 21 },
  { index: 8, id: 'rut', usfm: 'RUT', testament: 'OT', category: '历史书', nameSimp: '路得记', nameTrad: '路得記', abbrSimp: '得', abbrTrad: '得', aliases: ['路得'], chapters: 4 },
  { index: 9, id: '1sa', usfm: '1SA', testament: 'OT', category: '历史书', nameSimp: '撒母耳记上', nameTrad: '撒母耳記上', abbrSimp: '撒上', abbrTrad: '撒上', aliases: ['撒母耳上'], chapters: 31 },
  { index: 10, id: '2sa', usfm: '2SA', testament: 'OT', category: '历史书', nameSimp: '撒母耳记下', nameTrad: '撒母耳記下', abbrSimp: '撒下', abbrTrad: '撒下', aliases: ['撒母耳下'], chapters: 24 },
  { index: 11, id: '1ki', usfm: '1KI', testament: 'OT', category: '历史书', nameSimp: '列王纪上', nameTrad: '列王紀上', abbrSimp: '王上', abbrTrad: '王上', aliases: ['列王上', '列王记上'], chapters: 22 },
  { index: 12, id: '2ki', usfm: '2KI', testament: 'OT', category: '历史书', nameSimp: '列王纪下', nameTrad: '列王紀下', abbrSimp: '王下', abbrTrad: '王下', aliases: ['列王下', '列王记下'], chapters: 25 },
  { index: 13, id: '1ch', usfm: '1CH', testament: 'OT', category: '历史书', nameSimp: '历代志上', nameTrad: '歷代志上', abbrSimp: '代上', abbrTrad: '代上', aliases: ['历代上', '歷代上'], chapters: 29 },
  { index: 14, id: '2ch', usfm: '2CH', testament: 'OT', category: '历史书', nameSimp: '历代志下', nameTrad: '歷代志下', abbrSimp: '代下', abbrTrad: '代下', aliases: ['历代下', '歷代下'], chapters: 36 },
  { index: 15, id: 'ezr', usfm: 'EZR', testament: 'OT', category: '历史书', nameSimp: '以斯拉记', nameTrad: '以斯拉記', abbrSimp: '拉', abbrTrad: '拉', aliases: ['以斯拉'], chapters: 10 },
  { index: 16, id: 'neh', usfm: 'NEH', testament: 'OT', category: '历史书', nameSimp: '尼希米记', nameTrad: '尼希米記', abbrSimp: '尼', abbrTrad: '尼', aliases: ['尼希米'], chapters: 13 },
  { index: 17, id: 'est', usfm: 'EST', testament: 'OT', category: '历史书', nameSimp: '以斯帖记', nameTrad: '以斯帖記', abbrSimp: '斯', abbrTrad: '斯', aliases: ['以斯帖'], chapters: 10 },

  // 诗歌智慧书
  { index: 18, id: 'job', usfm: 'JOB', testament: 'OT', category: '诗歌智慧书', nameSimp: '约伯记', nameTrad: '約伯記', abbrSimp: '伯', abbrTrad: '伯', aliases: ['约伯', '約伯'], chapters: 42 },
  { index: 19, id: 'psa', usfm: 'PSA', testament: 'OT', category: '诗歌智慧书', nameSimp: '诗篇', nameTrad: '詩篇', abbrSimp: '诗', abbrTrad: '詩', aliases: ['诗篇'], chapters: 150 },
  { index: 20, id: 'pro', usfm: 'PRO', testament: 'OT', category: '诗歌智慧书', nameSimp: '箴言', nameTrad: '箴言', abbrSimp: '箴', abbrTrad: '箴', aliases: ['箴言书'], chapters: 31 },
  { index: 21, id: 'ecc', usfm: 'ECC', testament: 'OT', category: '诗歌智慧书', nameSimp: '传道书', nameTrad: '傳道書', abbrSimp: '传', abbrTrad: '傳', aliases: ['传道', '傳道'], chapters: 12 },
  { index: 22, id: 'sng', usfm: 'SNG', testament: 'OT', category: '诗歌智慧书', nameSimp: '雅歌', nameTrad: '雅歌', abbrSimp: '歌', abbrTrad: '歌', aliases: ['雅歌书'], chapters: 8 },

  // 大先知书
  { index: 23, id: 'isa', usfm: 'ISA', testament: 'OT', category: '大先知书', nameSimp: '以赛亚书', nameTrad: '以賽亞書', abbrSimp: '赛', abbrTrad: '賽', aliases: ['以赛亚', '以賽亞'], chapters: 66 },
  { index: 24, id: 'jer', usfm: 'JER', testament: 'OT', category: '大先知书', nameSimp: '耶利米书', nameTrad: '耶利米書', abbrSimp: '耶', abbrTrad: '耶', aliases: ['耶利米'], chapters: 52 },
  { index: 25, id: 'lam', usfm: 'LAM', testament: 'OT', category: '大先知书', nameSimp: '耶利米哀歌', nameTrad: '耶利米哀歌', abbrSimp: '哀', abbrTrad: '哀', aliases: ['哀歌'], chapters: 5 },
  { index: 26, id: 'ezk', usfm: 'EZK', testament: 'OT', category: '大先知书', nameSimp: '以西结书', nameTrad: '以西結書', abbrSimp: '结', abbrTrad: '結', aliases: ['以西结', '以西結'], chapters: 48 },
  { index: 27, id: 'dan', usfm: 'DAN', testament: 'OT', category: '大先知书', nameSimp: '但以理书', nameTrad: '但以理書', abbrSimp: '但', abbrTrad: '但', aliases: ['但以理'], chapters: 12 },

  // 小先知书
  { index: 28, id: 'hos', usfm: 'HOS', testament: 'OT', category: '小先知书', nameSimp: '何西阿书', nameTrad: '何西阿書', abbrSimp: '何', abbrTrad: '何', aliases: ['何西阿'], chapters: 14 },
  { index: 29, id: 'jol', usfm: 'JOL', testament: 'OT', category: '小先知书', nameSimp: '约珥书', nameTrad: '約珥書', abbrSimp: '珥', abbrTrad: '珥', aliases: ['约珥', '約珥'], chapters: 3 },
  { index: 30, id: 'amo', usfm: 'AMO', testament: 'OT', category: '小先知书', nameSimp: '阿摩司书', nameTrad: '阿摩司書', abbrSimp: '摩', abbrTrad: '摩', aliases: ['阿摩司'], chapters: 9 },
  { index: 31, id: 'oba', usfm: 'OBA', testament: 'OT', category: '小先知书', nameSimp: '俄巴底亚书', nameTrad: '俄巴底亞書', abbrSimp: '俄', abbrTrad: '俄', aliases: ['俄巴底亚', '俄巴底亞'], chapters: 1 },
  { index: 32, id: 'jon', usfm: 'JON', testament: 'OT', category: '小先知书', nameSimp: '约拿书', nameTrad: '約拿書', abbrSimp: '拿', abbrTrad: '拿', aliases: ['约拿', '約拿'], chapters: 4 },
  { index: 33, id: 'mic', usfm: 'MIC', testament: 'OT', category: '小先知书', nameSimp: '弥迦书', nameTrad: '彌迦書', abbrSimp: '弥', abbrTrad: '彌', aliases: ['弥迦', '彌迦'], chapters: 7 },
  { index: 34, id: 'nam', usfm: 'NAM', testament: 'OT', category: '小先知书', nameSimp: '那鸿书', nameTrad: '那鴻書', abbrSimp: '鸿', abbrTrad: '鴻', aliases: ['那鸿', '那鴻'], chapters: 3 },
  { index: 35, id: 'hab', usfm: 'HAB', testament: 'OT', category: '小先知书', nameSimp: '哈巴谷书', nameTrad: '哈巴谷書', abbrSimp: '哈', abbrTrad: '哈', aliases: ['哈巴谷'], chapters: 3 },
  { index: 36, id: 'zep', usfm: 'ZEP', testament: 'OT', category: '小先知书', nameSimp: '西番雅书', nameTrad: '西番雅書', abbrSimp: '番', abbrTrad: '番', aliases: ['西番雅'], chapters: 3 },
  { index: 37, id: 'hag', usfm: 'HAG', testament: 'OT', category: '小先知书', nameSimp: '哈该书', nameTrad: '哈該書', abbrSimp: '该', abbrTrad: '該', aliases: ['哈该', '哈該'], chapters: 2 },
  { index: 38, id: 'zec', usfm: 'ZEC', testament: 'OT', category: '小先知书', nameSimp: '撒迦利亚书', nameTrad: '撒迦利亞書', abbrSimp: '亚', abbrTrad: '亞', aliases: ['撒迦利亚', '撒迦利亞'], chapters: 14 },
  { index: 39, id: 'mal', usfm: 'MAL', testament: 'OT', category: '小先知书', nameSimp: '玛拉基书', nameTrad: '瑪拉基書', abbrSimp: '玛', abbrTrad: '瑪', aliases: ['玛拉基', '瑪拉基'], chapters: 4 },

  // 新约四福音与历史
  { index: 40, id: 'mat', usfm: 'MAT', testament: 'NT', category: '四福音书', nameSimp: '马太福音', nameTrad: '馬太福音', abbrSimp: '太', abbrTrad: '太', aliases: ['马太', '馬太'], chapters: 28 },
  { index: 41, id: 'mrk', usfm: 'MRK', testament: 'NT', category: '四福音书', nameSimp: '马可福音', nameTrad: '馬可福音', abbrSimp: '可', abbrTrad: '可', aliases: ['马可', '馬可'], chapters: 16 },
  { index: 42, id: 'luk', usfm: 'LUK', testament: 'NT', category: '四福音书', nameSimp: '路加福音', nameTrad: '路加福音', abbrSimp: '路', abbrTrad: '路', aliases: ['路加'], chapters: 24 },
  { index: 43, id: 'jhn', usfm: 'JHN', testament: 'NT', category: '四福音书', nameSimp: '约翰福音', nameTrad: '約翰福音', abbrSimp: '约', abbrTrad: '約', aliases: ['约翰', '約翰'], chapters: 21 },
  { index: 44, id: 'act', usfm: 'ACT', testament: 'NT', category: '新约历史书', nameSimp: '使徒行传', nameTrad: '使徒行傳', abbrSimp: '徒', abbrTrad: '徒', aliases: ['使徒', '行传', '行傳'], chapters: 28 },

  // 保罗书信
  { index: 45, id: 'rom', usfm: 'ROM', testament: 'NT', category: '保罗书信', nameSimp: '罗马书', nameTrad: '羅馬書', abbrSimp: '罗', abbrTrad: '羅', aliases: ['罗马', '羅馬'], chapters: 16 },
  { index: 46, id: '1co', usfm: '1CO', testament: 'NT', category: '保罗书信', nameSimp: '哥林多前书', nameTrad: '哥林多前書', abbrSimp: '林前', abbrTrad: '林前', aliases: ['哥林多前', '哥前'], chapters: 16 },
  { index: 47, id: '2co', usfm: '2CO', testament: 'NT', category: '保罗书信', nameSimp: '哥林多后书', nameTrad: '哥林多後書', abbrSimp: '林后', abbrTrad: '林後', aliases: ['哥林多后', '哥林多後', '哥后', '哥後'], chapters: 13 },
  { index: 48, id: 'gal', usfm: 'GAL', testament: 'NT', category: '保罗书信', nameSimp: '加拉太书', nameTrad: '加拉太書', abbrSimp: '加', abbrTrad: '加', aliases: ['加拉太'], chapters: 6 },
  { index: 49, id: 'eph', usfm: 'EPH', testament: 'NT', category: '保罗书信', nameSimp: '以弗所书', nameTrad: '以弗所書', abbrSimp: '弗', abbrTrad: '弗', aliases: ['以弗所'], chapters: 6 },
  { index: 50, id: 'php', usfm: 'PHP', testament: 'NT', category: '保罗书信', nameSimp: '腓立比书', nameTrad: '腓立比書', abbrSimp: '腓', abbrTrad: '腓', aliases: ['腓立比'], chapters: 4 },
  { index: 51, id: 'col', usfm: 'COL', testament: 'NT', category: '保罗书信', nameSimp: '歌罗西书', nameTrad: '歌羅西書', abbrSimp: '西', abbrTrad: '西', aliases: ['歌罗西', '歌羅西'], chapters: 4 },
  { index: 52, id: '1th', usfm: '1TH', testament: 'NT', category: '保罗书信', nameSimp: '帖撒罗尼迦前书', nameTrad: '帖撒羅尼迦前書', abbrSimp: '帖前', abbrTrad: '帖前', aliases: ['帖撒罗尼迦前', '帖撒羅尼迦前'], chapters: 5 },
  { index: 53, id: '2th', usfm: '2TH', testament: 'NT', category: '保罗书信', nameSimp: '帖撒罗尼迦后书', nameTrad: '帖撒羅尼迦後書', abbrSimp: '帖后', abbrTrad: '帖後', aliases: ['帖撒罗尼迦后', '帖撒羅尼迦後'], chapters: 3 },
  { index: 54, id: '1ti', usfm: '1TI', testament: 'NT', category: '保罗书信', nameSimp: '提摩太前书', nameTrad: '提摩太前書', abbrSimp: '提前', abbrTrad: '提前', aliases: ['提摩太前'], chapters: 6 },
  { index: 55, id: '2ti', usfm: '2TI', testament: 'NT', category: '保罗书信', nameSimp: '提摩太后书', nameTrad: '提摩太後書', abbrSimp: '提后', abbrTrad: '提後', aliases: ['提摩太后', '提摩太後'], chapters: 4 },
  { index: 56, id: 'tit', usfm: 'TIT', testament: 'NT', category: '保罗书信', nameSimp: '提多书', nameTrad: '提多書', abbrSimp: '多', abbrTrad: '多', aliases: ['提多'], chapters: 3 },
  { index: 57, id: 'phm', usfm: 'PHM', testament: 'NT', category: '保罗书信', nameSimp: '腓利门书', nameTrad: '腓利門書', abbrSimp: '门', abbrTrad: '門', aliases: ['腓利门', '腓利門'], chapters: 1 },

  // 普通书信与启示录
  { index: 58, id: 'heb', usfm: 'HEB', testament: 'NT', category: '普通书信', nameSimp: '希伯来书', nameTrad: '希伯來書', abbrSimp: '来', abbrTrad: '來', aliases: ['希伯来', '希伯來'], chapters: 13 },
  { index: 59, id: 'jas', usfm: 'JAS', testament: 'NT', category: '普通书信', nameSimp: '雅各书', nameTrad: '雅各書', abbrSimp: '雅', abbrTrad: '雅', aliases: ['雅各'], chapters: 5 },
  { index: 60, id: '1pe', usfm: '1PE', testament: 'NT', category: '普通书信', nameSimp: '彼得前书', nameTrad: '彼得前書', abbrSimp: '彼前', abbrTrad: '彼前', aliases: ['彼得前'], chapters: 5 },
  { index: 61, id: '2pe', usfm: '2PE', testament: 'NT', category: '普通书信', nameSimp: '彼得后书', nameTrad: '彼得後書', abbrSimp: '彼后', abbrTrad: '彼後', aliases: ['彼得后', '彼得後'], chapters: 3 },
  { index: 62, id: '1jn', usfm: '1JN', testament: 'NT', category: '普通书信', nameSimp: '约翰一书', nameTrad: '約翰一書', abbrSimp: '约一', abbrTrad: '約一', aliases: ['约翰壹书', '約翰壹書', '约壹', '約壹'], chapters: 5 },
  { index: 63, id: '2jn', usfm: '2JN', testament: 'NT', category: '普通书信', nameSimp: '约翰二书', nameTrad: '約翰二書', abbrSimp: '约二', abbrTrad: '約二', aliases: ['约翰贰书', '約翰貳書', '约贰', '約貳'], chapters: 1 },
  { index: 64, id: '3jn', usfm: '3JN', testament: 'NT', category: '普通书信', nameSimp: '约翰三书', nameTrad: '約翰三書', abbrSimp: '约三', abbrTrad: '約三', aliases: ['约翰叁书', '約翰叁書', '约叁', '約叁'], chapters: 1 },
  { index: 65, id: 'jud', usfm: 'JUD', testament: 'NT', category: '普通书信', nameSimp: '犹大书', nameTrad: '猶大書', abbrSimp: '犹', abbrTrad: '猶', aliases: ['犹大', '猶大'], chapters: 1 },
  { index: 66, id: 'rev', usfm: 'REV', testament: 'NT', category: '预言书', nameSimp: '启示录', nameTrad: '啟示錄', abbrSimp: '启', abbrTrad: '啟', aliases: ['启示', '啟示'], chapters: 22 },
];

export const BOOK_BY_ID: Record<string, BookMeta> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.id, b])
);

export function getBookName(bookId: string, script: 'simp' | 'trad' = 'simp'): string {
  const b = BOOK_BY_ID[bookId];
  if (!b) return bookId;
  return script === 'trad' ? b.nameTrad : b.nameSimp;
}

export function getBookAbbr(bookId: string, script: 'simp' | 'trad' = 'simp'): string {
  const b = BOOK_BY_ID[bookId];
  if (!b) return bookId;
  return script === 'trad' ? b.abbrTrad : b.abbrSimp;
}

/**
 * Match a book from user input string (supports full name, abbr, alias, prefix)
 */
export function matchBookByName(rawInput: string): BookMeta | null {
  const q = rawInput.trim().replace(/\s+/g, '');
  if (!q) return null;

  // 1. Exact match on full name, abbr, id, or aliases
  for (const b of BIBLE_BOOKS) {
    if (
      b.id.toLowerCase() === q.toLowerCase() ||
      b.usfm.toLowerCase() === q.toLowerCase() ||
      b.nameSimp === q ||
      b.nameTrad === q ||
      b.abbrSimp === q ||
      b.abbrTrad === q ||
      b.aliases.includes(q)
    ) {
      return b;
    }
  }

  // 2. Prefix match on full name (e.g. "使徒" -> 使徒行传)
  if (q.length >= 2) {
    const prefixMatches = BIBLE_BOOKS.filter(
      (b) =>
        b.nameSimp.startsWith(q) ||
        b.nameTrad.startsWith(q) ||
        b.aliases.some((a) => a.startsWith(q))
    );
    if (prefixMatches.length === 1) {
      return prefixMatches[0];
    }
    // Special case: "约翰" without 一/二/三 defaults to Gospel of John
    if (q === '约翰' || q === '約翰') {
      return BOOK_BY_ID['jhn'];
    }
    if (prefixMatches.length > 0) {
      return prefixMatches[0];
    }
  }

  return null;
}
