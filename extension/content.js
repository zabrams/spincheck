/**
 * Extracts the article headline and body text from the current page.
 *
 * This file is NOT registered as a passive content_script in manifest.json.
 * Instead, the service worker injects it on-demand via
 * chrome.scripting.executeScript({ files: ['content.js'] }) when the user
 * clicks the extension icon. The activeTab permission grants access only
 * to the user's current tab for that one invocation — no broad host
 * permissions are required.
 *
 * The last expression in this file becomes the return value of the
 * executeScript call (i.e. results[0].result).
 */
function getArticleHeadline() {
  const article =
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('main');

  if (article) {
    const h1 = article.querySelector('h1');
    if (h1 && h1.innerText && h1.innerText.trim().length >= 5) {
      return h1.innerText.trim();
    }
  }

  const pageH1 = document.querySelector('h1');
  if (pageH1 && pageH1.innerText && pageH1.innerText.trim().length >= 5) {
    return pageH1.innerText.trim();
  }

  const og = document.querySelector('meta[property="og:title"]');
  if (og) {
    const v = og.getAttribute('content');
    if (v && v.trim().length >= 5) return v.trim();
  }

  const tw = document.querySelector('meta[name="twitter:title"]');
  if (tw) {
    const v = tw.getAttribute('content');
    if (v && v.trim().length >= 5) return v.trim();
  }

  let title = (document.title || '').trim();
  title = title.replace(/\s*[|\-—–]\s*[^|\-—–]{1,40}$/, '').trim();
  return title;
}

function extractArticleContent() {
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.article-body',
    '.article-content',
    '.post-content',
    '.post-body',
    '.entry-content',
    '.story-body',
    '.article__body',
    '#article-body',
    '#main-content',
  ];

  let container = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 200) {
      container = el;
      break;
    }
  }
  if (!container) container = document.body;

  const cloned = container.cloneNode(true);

  const removeSelectors = [
    'nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript',
    '.ad', '.ads', '.advertisement', '.sidebar', '.menu', '.navigation',
    '.comments', '.comment-section', '.related', '.share-buttons',
    '.social', '.newsletter', '.popup', '.modal', '.cookie-banner',
    '[aria-label="advertisement"]', '[data-ad]',
  ];
  removeSelectors.forEach((sel) => {
    cloned.querySelectorAll(sel).forEach((el) => el.remove());
  });

  const text = cloned.innerText || cloned.textContent || '';
  return text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

// The expression here is the return value for chrome.scripting.executeScript:
({
  content: extractArticleContent(),
  title: getArticleHeadline(),
});
