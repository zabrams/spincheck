const $ = (id) => document.getElementById(id);

const states = {
  idle: $('idle-state'),
  loading: $('loading-state'),
  result: $('result-state'),
  error: $('error-state'),
};

function showState(name) {
  Object.entries(states).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
}

function switchTab(section) {
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.section === section)
  );
  document.querySelectorAll('.section').forEach((s) => {
    s.classList.toggle('hidden', !s.id.endsWith(section));
    s.classList.toggle('active', s.id.endsWith(section));
  });
}

document.querySelectorAll('.tab').forEach((t) =>
  t.addEventListener('click', () => switchTab(t.dataset.section))
);

let currentUrl = '';
let currentTabId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    currentUrl = tab.url || '';
    currentTabId = tab.id;
    const displayUrl = currentUrl.replace(/^https?:\/\/(www\.)?/, '').substring(0, 55);
    $('page-url').textContent = displayUrl || 'Unknown page';
  }

  // Check storage to resume any in-flight or completed analysis
  const key = `sc_${currentUrl}`;
  const stored = (await chrome.storage.local.get(key))[key];
  const age = stored ? Date.now() - stored.ts : Infinity;
  const FIVE_MIN = 5 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (stored?.status === 'complete' && age < ONE_DAY) {
    renderResult(stored.data);
  } else if (stored?.status === 'analyzing' && age < FIVE_MIN) {
    // Background is still working — show loading and wait for its message
    showState('loading');
    listenForCompletion();
  } else if (stored?.status === 'error' && age < FIVE_MIN) {
    $('error-msg').textContent = stored.error;
    showState('error');
  } else {
    showState('idle');
  }
});

function listenForCompletion() {
  function handler(message) {
    if (message.url !== currentUrl) return;
    chrome.runtime.onMessage.removeListener(handler);
    if (message.action === 'analysisComplete') {
      renderResult(message.data);
    } else if (message.action === 'analysisError') {
      $('error-msg').textContent = message.error;
      showState('error');
    }
  }
  chrome.runtime.onMessage.addListener(handler);
}

$('analyze-btn').addEventListener('click', async () => {
  if (!currentTabId || !currentUrl) return;
  showState('loading');
  listenForCompletion();
  chrome.runtime.sendMessage({ action: 'startAnalysis', tabId: currentTabId, url: currentUrl });
});

$('re-analyze-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove(`sc_${currentUrl}`);
  showState('idle');
});

$('retry-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove(`sc_${currentUrl}`);
  showState('idle');
});

function renderResult(a) {
  const dir = a.direction;
  const score = a.score;
  const scoreStr = dir === 'none' ? '0' : `${score}${dir === 'left' ? 'L' : 'R'}`;
  const labels = ['No Bias', 'Slightly Biased', 'Moderately Biased', 'Strongly Biased'];
  const dirLabel = dir === 'none' ? '' : dir === 'left' ? ' — Leans Left' : ' — Leans Right';

  $('score-value').textContent = scoreStr;
  $('score-value').className = `score-value ${dir}`;
  $('score-label').textContent = labels[score] + dirLabel;

  const val = dir === 'none' ? 0 : dir === 'left' ? -score : score;
  const pct = ((val + 3) / 6) * 100;
  const dot = $('gauge-dot');
  dot.style.left = `${pct}%`;
  dot.style.backgroundColor = dir === 'left' ? '#3b82f6' : dir === 'right' ? '#ef4444' : '#6b7280';

  $('summary').textContent = a.summary;

  $('badges').innerHTML = [
    badge(a.isEditorial, '📝 Editorial', '📰 Factual', true),
    badge(!a.presentsBothSides, '✗ One-Sided', '✓ Balanced', true),
    badge(a.usesConjecture, '⚠ Conjecture', '✓ Fact-Based', true),
  ].join('');

  $('section-analysis').innerHTML = `<p>${escHtml(a.analysis).replace(/\n/g, '<br>')}</p>`;

  $('section-evidence').innerHTML = a.evidence?.length
    ? a.evidence.map((e) => `<div class="ev-item">"${escHtml(e)}"</div>`).join('')
    : '<p>No specific evidence highlighted.</p>';

  $('section-steelman').innerHTML = `
    <p style="font-size:10px;color:#475569;margin-bottom:8px">Topic: ${escHtml(a.steelMan.topic)}</p>
    <div class="sm-grid">
      <div class="sm-left"><div class="sm-head left">Progressive</div><p>${escHtml(a.steelMan.left)}</p></div>
      <div class="sm-right"><div class="sm-head right">Conservative</div><p>${escHtml(a.steelMan.right)}</p></div>
    </div>`;

  $('section-reading').innerHTML = a.furtherReading?.length
    ? a.furtherReading.map((r) => `
        <div class="read-item">
          <div class="read-desc">${escHtml(r.description)}</div>
          <a class="read-link" href="https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}" target="_blank">
            🔍 "${escHtml(r.searchQuery)}"
          </a>
        </div>`).join('')
    : '<p>No further reading suggested.</p>';

  switchTab('analysis');
  showState('result');
}

function badge(isActive, trueLabel, falseLabel, warnOnTrue) {
  const warn = warnOnTrue ? isActive : !isActive;
  const cls = warn ? 'b-warn' : 'b-good';
  return `<span class="badge ${cls}">${escHtml(isActive ? trueLabel : falseLabel)}</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
