// Service worker — runs independently of the popup so analysis survives tab switches.
importScripts('config.js');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'startAnalysis') {
    const { tabId, url } = message;
    sendResponse({ started: true });
    runAnalysis(tabId, url);
    return true;
  }
});

async function runAnalysis(tabId, url) {
  // Mark as in-progress so popup can show loading state if reopened
  await chrome.storage.local.set({ [`sc_${url}`]: { status: 'analyzing', ts: Date.now() } });

  try {
    // Extract article content via content script
    let resp;
    try {
      resp = await chrome.tabs.sendMessage(tabId, { action: 'getArticleContent' });
    } catch {
      throw new Error('Cannot read page. Try refreshing first.');
    }

    if (!resp?.success) throw new Error('Could not read page content.');
    if (!resp.content || resp.content.length < 100) throw new Error('Page has too little text to analyze.');

    // Call the SpinCheck API — read SSE stream
    const apiResp = await fetch(SPINCHECK_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: resp.content, title: resp.title, url }),
    });

    if (!apiResp.ok || !apiResp.body) {
      const err = await apiResp.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${apiResp.status})`);
    }

    // Parse SSE stream
    const reader = apiResp.body.getReader();
    const decoder = new TextDecoder();
    let result = null;

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        let event;
        try { event = JSON.parse(line.slice(6)); } catch { continue; }

        if (event.type === 'result') { result = event.data; break outer; }
        if (event.type === 'error') throw new Error(event.error || 'Analysis failed');
      }
    }

    if (!result) throw new Error('Analysis stream ended without a result.');

    await chrome.storage.local.set({
      [`sc_${url}`]: { status: 'complete', data: result, ts: Date.now() },
    });
    chrome.runtime.sendMessage({ action: 'analysisComplete', url, data: result }).catch(() => {});

  } catch (err) {
    await chrome.storage.local.set({
      [`sc_${url}`]: { status: 'error', error: err.message, ts: Date.now() },
    });
    chrome.runtime.sendMessage({ action: 'analysisError', url, error: err.message }).catch(() => {});
  }
}
