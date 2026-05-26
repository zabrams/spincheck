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
      const title = document.title || '';
      sendResponse({ success: true, content, title });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
