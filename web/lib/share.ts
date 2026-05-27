import LZString from 'lz-string';
import type { BiasAnalysis } from '@/types/analysis';

export interface ShareData {
  analysis: BiasAnalysis;
  url?: string;
  title?: string;
}

const SITE_ORIGIN = 'https://spincheck.app';

/** Compress and URL-encode the analysis for a sharable /view link. */
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${SITE_ORIGIN}/view#d=${compressed}`;
}

/** Reverse of encodeShareData — used client-side on the /view page. */
export function decodeShareData(fragment: string): ShareData | null {
  // Accept a full hash like "#d=..." or just the encoded portion
  const cleaned = fragment.replace(/^#?d=/, '');
  if (!cleaned) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(cleaned);
    if (!json) return null;
    return JSON.parse(json) as ShareData;
  } catch {
    return null;
  }
}
