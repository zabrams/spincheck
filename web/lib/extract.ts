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

  // X/Twitter aggressively blocks server-side requests and returns near-empty HTML.
  // Fail fast with a helpful message instead of letting Readability return garbage.
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (
    host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com' ||
    host.endsWith('.twitter.com') || host.endsWith('.x.com')
  ) {
    throw new Error(
      'X/Twitter blocks server-side requests. Paste the tweet text directly using the "paste article text" option below.'
    );
  }

  // 15s timeout — some sites hang on server-side requests (paywalls, anti-bot, slow CDNs).
  // Without this, the Vercel function ties up until its own 60s maxDuration, which iOS
  // Shortcuts perceives as "The network connection was lost."
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
          '(KHTML, like Gecko) Version/17.0 Safari/605.1.15 SpinCheck/1.0',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('That page took too long to load. It may block bots or require a login.');
    }
    throw new Error('Could not reach that page. Check the URL and try again.');
  }

  if (!response.ok) {
    // 401/403 = paywall or login wall
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'That article is behind a paywall or login. Try the Chrome extension or iOS Shortcuts — they read content from your own logged-in browser.'
      );
    }
    // 429 = rate-limited / anti-bot block (NYT, WaPo, X, etc. often do this)
    if (response.status === 429) {
      throw new Error(
        'That site is blocking automated requests from our server. Use the Chrome extension or iOS Shortcuts instead — they read directly from your browser, so the site doesn\'t see us.'
      );
    }
    // 451 = legal block; 503 = often Cloudflare-style anti-bot
    if (response.status === 451 || response.status === 503) {
      throw new Error(
        'That site is blocking our server (anti-bot protection). The Chrome extension or iOS Shortcuts will work — they read content from your own browser.'
      );
    }
    if (response.status === 404) {
      throw new Error('That URL doesn\'t exist (404). Double-check the link.');
    }
    throw new Error(
      `Could not fetch the page (HTTP ${response.status}). Try the Chrome extension or iOS Shortcuts — they may work where the website can\'t.`
    );
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
  if (content.length < 50) {
    throw new Error('Extracted article is too short to analyze. The page may be paywalled or behind a login.');
  }

  return {
    content,
    title: (article.title || '').trim(),
  };
}
