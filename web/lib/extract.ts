import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
  content: string;
  title: string;
}

/**
 * Fetch an article URL and extract the main content using Mozilla Readability
 * (the same library Firefox/Safari Reader View uses). Uses linkedom for ~5x
 * faster DOM parsing vs jsdom.
 */
export async function fetchAndExtract(url: string): Promise<ExtractedArticle> {
  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL.');
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('Only http(s) URLs are supported.');
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Version/17.0 Safari/605.1.15 SpinCheck/1.0',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Could not fetch the page (HTTP ${response.status}).`);
  }

  const html = await response.text();
  if (!html || html.length < 500) {
    throw new Error('Page returned no usable content.');
  }

  const { document } = parseHTML(html);
  // Readability expects a real Document; linkedom is close enough
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reader = new Readability(document as any);
  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new Error('Could not extract article content from this page.');
  }

  const content = article.textContent.replace(/\n{3,}/g, '\n\n').trim();
  if (content.length < 100) {
    throw new Error('Extracted article is too short to analyze.');
  }

  return {
    content,
    title: (article.title || '').trim(),
  };
}
