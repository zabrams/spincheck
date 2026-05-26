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
$('analyze-btn').addEventListener('click', analyze);
$('re-analyze-btn').addEventListener('click', () => showState('idle'));
$('retry-btn').addEventListener('click', analyze);

let currentUrl = '';

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    currentUrl = tab.url || '';
    const displayUrl = currentUrl.replace(/^https?:\/\/(www\.)?/, '').substring(0, 55);
    $('page-url').textContent = displayUrl || 'Unknown page';
  }

  // Load cached result
  const key = `sc_${currentUrl}`;
  const cached = await chrome.storage.local.get(key);
  const entry = cached[key];
  if (entry && Date.now() - entry.ts < 24 * 60 * 60 * 1000) {
    renderResult(entry.data);
  }
});

async function analyze() {
  showState('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    let content, title;
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getArticleContent' });
      if (!resp?.success) throw new Error('Could not read page');
      content = resp.content;
      title = resp.title;
    } catch {
      throw new Error('Cannot read page content — try refreshing first.');
    }

    if (!content || content.length < 100) {
      throw new Error('Page has too little text to analyze.');
    }

    const apiResp = await fetch(SPINCHECK_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title, url: currentUrl }),
    });

    if (!apiResp.ok) {
      const err = await apiResp.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${apiResp.status})`);
    }

    const data = await apiResp.json();
    if (!data.success) throw new Error(data.error || 'Analysis failed');

    await chrome.storage.local.set({ [`sc_${currentUrl}`]: { data: data.data, ts: Date.now() } });
    renderResult(data.data);
  } catch (err) {
    $('error-msg').textContent = err.message || 'Unknown error';
    showState('error');
  }
}

function renderResult(a) {
  const dir = a.direction;
  const score = a.score;
  const scoreStr = dir === 'none' ? '0' : `${score}${dir === 'left' ? 'L' : 'R'}`;
  const labels = ['No Bias', 'Slightly Biased', 'Moderately Biased', 'Strongly Biased'];
  const dirLabel = dir === 'none' ? '' : dir === 'left' ? ' — Leans Left' : ' — Leans Right';

  $('score-value').textContent = scoreStr;
  $('score-value').className = `score-value ${dir}`;
  $('score-label').textContent = labels[score] + dirLabel;

  // Gauge
  const val = dir === 'none' ? 0 : dir === 'left' ? -score : score;
  const pct = ((val + 3) / 6) * 100;
  const dot = $('gauge-dot');
  dot.style.left = `${pct}%`;
  dot.style.backgroundColor = dir === 'left' ? '#3b82f6' : dir === 'right' ? '#ef4444' : '#6b7280';

  $('summary').textContent = a.summary;

  // Badges
  $('badges').innerHTML = [
    badge(a.isEditorial, '📝 Editorial', '📰 Factual', true),
    badge(!a.presentsBothSides, '✗ One-Sided', '✓ Balanced', true),
    badge(a.usesConjecture, '⚠ Conjecture', '✓ Fact-Based', true),
  ].join('');

  // Analysis
  $('section-analysis').innerHTML = `<p>${escHtml(a.analysis).replace(/\n/g, '<br>')}</p>`;

  // Evidence
  $('section-evidence').innerHTML = a.evidence.length
    ? a.evidence.map((e) => `<div class="ev-item">"${escHtml(e)}"</div>`).join('')
    : '<p>No specific evidence highlighted.</p>';

  // Steel man
  $('section-steelman').innerHTML = `
    <p style="font-size:10px;color:#475569;margin-bottom:8px">Topic: ${escHtml(a.steelMan.topic)}</p>
    <div class="sm-grid">
      <div class="sm-left"><div class="sm-head left">Progressive View</div><p>${escHtml(a.steelMan.left)}</p></div>
      <div class="sm-right"><div class="sm-head right">Conservative View</div><p>${escHtml(a.steelMan.right)}</p></div>
    </div>`;

  // Further reading
  $('section-reading').innerHTML = a.furtherReading.length
    ? a.furtherReading
        .map(
          (r) => `
      <div class="read-item">
        <div class="read-desc">${escHtml(r.description)}</div>
        <a class="read-link" href="https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}" target="_blank">
          🔍 "${escHtml(r.searchQuery)}"
        </a>
      </div>`
        )
        .join('')
    : '<p>No further reading suggested.</p>';

  switchTab('analysis');
  showState('result');
}

function badge(isActive, trueLabel, falseLabel, warnOnTrue) {
  const warn = warnOnTrue ? isActive : !isActive;
  const cls = isActive
    ? warn ? 'b-warn' : 'b-good'
    : warn ? 'b-warn' : 'b-good';
  const label = isActive ? trueLabel : falseLabel;
  return `<span class="badge ${cls}">${escHtml(label)}</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
