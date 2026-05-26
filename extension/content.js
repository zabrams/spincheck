function getArticleHeadline() {
  // 1. Prefer the actual <h1> inside the article container — most reliable
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

  // 2. Any prominent h1 on the page
  const pageH1 = document.querySelector('h1');
  if (pageH1 && pageH1.innerText && pageH1.innerText.trim().length >= 5) {
    return pageH1.innerText.trim();
  }

  // 3. OpenGraph title — set explicitly by most news sites
  const og = document.querySelector('meta[property="og:title"]');
  if (og) {
    const v = og.getAttribute('content');
    if (v && v.trim().length >= 5) return v.trim();
  }

  // 4. Twitter card title
  const tw = document.querySelector('meta[name="twitter:title"]');
  if (tw) {
    const v = tw.getAttribute('content');
    if (v && v.trim().length >= 5) return v.trim();
  }

  // 5. Fallback: document.title with common site suffixes stripped
  let title = (document.title || '').trim();
  // Strip patterns like " - The New York Times", " | CNN", " — Bloomberg"
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getArticleContent') {
    try {
      const content = extractArticleContent();
      const title = getArticleHeadline();
      sendResponse({ success: true, content, title });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
