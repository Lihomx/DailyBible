import JSZip from 'jszip';

export interface ExtractedSlide {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  images: string[]; // Data URLs or uploaded R2 URLs
  isBoilerplate: boolean;
}

export interface SermonBlock {
  id: string;
  type: 'heading' | 'scripture' | 'paragraph' | 'image' | 'callout';
  content: string;
  imageUrl?: string;
  slideNumber?: number;
}

export interface ParsedPptxResult {
  inferredTitle: string;
  inferredDate: string;
  inferredSeries: string;
  inferredChurch: string;
  inferredScriptureRef: string;
  slides: ExtractedSlide[];
  blocks: SermonBlock[];
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

/**
 * Parse a .pptx ArrayBuffer/File in the browser using JSZip.
 * Extracts text paragraphs, headings, and embedded media images from each slide,
 * and converts them into clean web sermon blocks.
 */
export async function parsePptxFile(buffer: ArrayBuffer): Promise<ParsedPptxResult> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find all slide XML files and sort by slide number
  const slideFiles = Object.keys(zip.files)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  // 2. Preload embedded images in ppt/media/* as Data URLs
  const mediaDataUrls: Record<string, string> = {};
  const mediaFiles = Object.keys(zip.files).filter((k) =>
    /^ppt\/media\/.+\.(png|jpe?g|gif|webp|svg)$/i.test(k)
  );
  for (const mediaPath of mediaFiles) {
    try {
      const base64 = await zip.files[mediaPath].async('base64');
      const mime = getMimeType(mediaPath);
      const fileName = mediaPath.split('/').pop() || mediaPath;
      mediaDataUrls[fileName] = `data:${mime};base64,${base64}`;
    } catch {
      // ignore corrupted media
    }
  }

  const slides: ExtractedSlide[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const slideNumber =
      parseInt(slidePath.match(/slide(\d+)\.xml/i)?.[1] || String(i + 1), 10);
    const xml = await zip.files[slidePath].async('string');

    // Check slide relationships for linked images
    const relPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    const slideImages: string[] = [];
    if (zip.files[relPath]) {
      const relXml = await zip.files[relPath].async('string');
      const targetMatches = relXml.matchAll(/Target="\.\.\/media\/([^"]+)"/gi);
      for (const tm of targetMatches) {
        const mediaName = tm[1];
        if (mediaDataUrls[mediaName] && !slideImages.includes(mediaDataUrls[mediaName])) {
          slideImages.push(mediaDataUrls[mediaName]);
        }
      }
    }

    // Extract paragraphs (<a:p> ... </a:p>)
    const rawParas: string[] = [];
    const pMatches = xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g);
    for (const pm of pMatches) {
      const pContent = pm[1];
      const runs: string[] = [];
      const tMatches = pContent.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g);
      for (const tm of tMatches) {
        runs.push(decodeXmlEntities(tm[1]));
      }
      const line = runs.join('').replace(/\s+/g, ' ').trim();
      if (line) {
        rawParas.push(line);
      }
    }

    // Filter repeated church header lines like "南 橙 縣 以 薩 迦 靈 糧 堂_2024_12_01"
    const cleanedParas: string[] = [];
    for (const p of rawParas) {
      if (!cleanedParas.includes(p)) {
        cleanedParas.push(p);
      }
    }

    const title = cleanedParas[0] || `第 ${slideNumber} 页`;
    const bodyParas = cleanedParas.slice(1);

    const joined = cleanedParas.join(' ');
    const isBoilerplate =
      /充滿熱愛的教會|代代相傳的教會|滿有憐憫的教會|注重宣教的教會|這是一個值得你參與的教會|信心宣言/.test(
        joined
      );

    slides.push({
      slideNumber,
      title,
      paragraphs: bodyParas,
      images: slideImages,
      isBoilerplate,
    });
  }

  // Infer sermon metadata
  let inferredTitle = '主日證道信息';
  let inferredDate = new Date().toISOString().slice(0, 10);
  let inferredSeries = '';
  let inferredChurch = '南橙縣以薩迦靈糧堂';
  let inferredScriptureRef = '';

  const allText = slides.flatMap((s) => [s.title, ...s.paragraphs]).join('\n');
  const dateMatch = allText.match(/(20\d{2})[_/\-.](\d{1,2})[_/\-.](\d{1,2})/);
  if (dateMatch) {
    inferredDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
  }

  for (const s of slides) {
    if (s.isBoilerplate) continue;
    const candidates = [s.title, ...s.paragraphs];
    for (const c of candidates) {
      if (c.includes('系列') || c.includes('聖靈的工作') || c.includes('Works of')) {
        inferredTitle = c.replace(/\s+/g, ' ').trim();
        const seriesMatch = c.match(/(系列[-\s]*\d+)/);
        if (seriesMatch) {
          inferredSeries = seriesMatch[1];
        }
        break;
      }
    }
  }

  const blocks = convertSlidesToBlocks(slides, true);

  // Find first scripture reference
  const refMatch = allText.match(
    /(約翰福音|约翰福音|哥林多後書|哥林多后书|以賽亞書|以赛亚书|羅馬書|罗马书|以弗所書|以弗所书)\s*\d+:\d+(?:-\d+)?/
  );
  if (refMatch) {
    inferredScriptureRef = refMatch[0];
  }

  return {
    inferredTitle,
    inferredDate,
    inferredSeries,
    inferredChurch,
    inferredScriptureRef,
    slides,
    blocks,
  };
}

export function convertSlidesToBlocks(
  slides: ExtractedSlide[],
  skipBoilerplate: boolean = true
): SermonBlock[] {
  const blocks: SermonBlock[] = [];
  let counter = 1;

  for (const slide of slides) {
    if (skipBoilerplate && slide.isBoilerplate) continue;

    // Remove church header stamp if title is just the church date stamp
    const isHeaderStamp = /靈\s*糧\s*堂.*20\d{2}/.test(slide.title);
    if (!isHeaderStamp && slide.title) {
      blocks.push({
        id: `blk-${counter++}`,
        type: 'heading',
        content: slide.title,
        slideNumber: slide.slideNumber,
      });
    }

    for (const p of slide.paragraphs) {
      if (/靈\s*糧\s*堂.*20\d{2}/.test(p)) continue;
      if (p.startsWith('■') || /^([一二三四五六七八九十]+、|\d+\.)/.test(p)) {
        blocks.push({
          id: `blk-${counter++}`,
          type: 'heading',
          content: p,
          slideNumber: slide.slideNumber,
        });
      } else if (
        /(福音|書|記|傳|篇|箴言|啟示錄)\s*\d+:\d+/.test(p) ||
        /(John|Corinthians|Isaiah|Mark|Romans|Hebrews|Ephesians)\s*\d+:\d+/i.test(p)
      ) {
        blocks.push({
          id: `blk-${counter++}`,
          type: 'scripture',
          content: p,
          slideNumber: slide.slideNumber,
        });
      } else {
        blocks.push({
          id: `blk-${counter++}`,
          type: 'paragraph',
          content: p,
          slideNumber: slide.slideNumber,
        });
      }
    }

    for (const img of slide.images) {
      blocks.push({
        id: `blk-${counter++}`,
        type: 'image',
        content: `幻灯片 ${slide.slideNumber} 配图`,
        imageUrl: img,
        slideNumber: slide.slideNumber,
      });
    }
  }

  return blocks;
}
