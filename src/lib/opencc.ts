import * as OpenCC from 'opencc-js';

let s2tConverter: ((text: string) => string) | null = null;
let t2sConverter: ((text: string) => string) | null = null;

function getS2T() {
  if (!s2tConverter) {
    s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
  }
  return s2tConverter;
}

function getT2S() {
  if (!t2sConverter) {
    t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });
  }
  return t2sConverter;
}

export function toTraditional(text: string): string {
  if (!text) return '';
  try {
    return getS2T()(text);
  } catch {
    return text;
  }
}

export function toSimplified(text: string): string {
  if (!text) return '';
  try {
    return getT2S()(text);
  } catch {
    return text;
  }
}

export function convertByScript(text: string, script: 'simp' | 'trad'): string {
  if (!text) return '';
  return script === 'trad' ? toTraditional(text) : toSimplified(text);
}
