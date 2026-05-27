const $ = (id) => document.getElementById(id);

const PHASE_MESSAGES = {
  reading: 'Reading the article…',
  assessing: 'Assessing political bias…',
  writing_analysis: 'Writing detailed analysis…',
  gathering_evidence: 'Gathering evidence from the text…',
  finding_omissions: 'Looking for what\'s missing…',
  finding_sources: 'Finding sources for balance…',
  perspectives: 'Steel-manning both sides…',
  common_ground: 'Looking for common ground…',
};

function updatePhase(phase) {
  const el = $('loading-phase');
  if (el && PHASE_MESSAGES[phase]) {
    el.textContent = PHASE_MESSAGES[phase];
    // brief fade-in animation
    el.style.opacity = '0';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 250ms ease';
      el.style.opacity = '1';
    });
  }
}

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
    // Background is still working — show loading with last known phase
    showState('loading');
    if (stored.phase) updatePhase(stored.phase);
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
    if (message.action === 'analysisPhase') {
      updatePhase(message.phase);
      return; // don't remove listener — more events coming
    }
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
  updatePhase('reading');
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
  const scoreStr = dir === 'left' ? `${score}L` : dir === 'right' ? `${score}R` : `${score}`;
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
    badge(a.usesEmotionalLanguage, '⚠ Emotional Language', '✓ Neutral Tone', true),
    badge(a.hasSelectiveSourcing, '⚠ Selective Sourcing', '✓ Diverse Sources', true),
    badge(a.hasMisleadingHeadline, '⚠ Misleading Headline', '✓ Accurate Headline', true),
  ].join('');

  // Append confidence pill to score label
  if (a.confidence) {
    $('score-label').innerHTML = `${escHtml(labels[score] + dirLabel)} <span class="conf-pill conf-${a.confidence}">${a.confidence}</span>`;
  }

  const framingHtml = a.framingEvidence?.length
    ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #1e2533">
        <div style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">How the article frames things</div>
        ${a.framingEvidence.map((e) => `<div class="ev-item">"${escHtml(e)}"</div>`).join('')}
       </div>`
    : '';

  const omissionHtml = a.omissionEvidence?.length
    ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #1e2533">
        <div style="font-size:10px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">What's missing or downplayed</div>
        ${a.omissionEvidence.map((e) => `<div class="ev-item" style="font-style:normal;border-left-color:rgba(245,158,11,0.4)">${escHtml(e)}</div>`).join('')}
       </div>`
    : '';

  $('section-analysis').innerHTML = `<p>${escHtml(a.analysis).replace(/\n/g, '<br>')}</p>${framingHtml}${omissionHtml}`;

  const p = a.perspectives;
  const articleLabel = a.direction === 'left' ? 'Progressive Perspective'
    : a.direction === 'right' ? 'Conservative Perspective' : "Article's View";
  const opposingLabel = a.direction === 'left' ? 'Conservative Counter-Argument'
    : a.direction === 'right' ? 'Progressive Counter-Argument' : 'Opposing View';

  const hasPerspectiveContent = !!p.opposingView || !!p.commonGround;

  if (!hasPerspectiveContent && a.direction === 'none') {
    $('section-steelman').innerHTML = `
      <div style="text-align:center;padding:16px 0">
        <div style="font-size:24px;margin-bottom:8px">⚖️</div>
        <p style="color:#cbd5e1;font-size:12px;font-weight:600">This topic isn't politically contested.</p>
        <p style="color:#64748b;font-size:11px;margin-top:4px">No meaningful left/right debate applies.</p>
      </div>`;
  } else {
    const commonHtml = p.commonGround
      ? `<div style="margin-bottom:10px">
          <div class="sm-head" style="margin-bottom:5px;color:#c084fc">🤝 Common Ground</div>
          <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:6px;padding:8px"><p>${escHtml(p.commonGround)}</p></div>
        </div>`
      : '';

    const articleHtml = `
      <div style="margin-bottom:10px">
        <div class="sm-head ${a.direction === 'left' ? 'left' : a.direction === 'right' ? 'right' : ''}" style="margin-bottom:5px">1 · ${escHtml(articleLabel)}</div>
        <div class="${a.direction === 'left' ? 'sm-left' : a.direction === 'right' ? 'sm-right' : 'sm-left'}"><p>${escHtml(p.articleView)}</p></div>
      </div>`;

    const opposingHtml = p.opposingView
      ? `<div>
          <div class="sm-head ${a.direction === 'left' ? 'right' : a.direction === 'right' ? 'left' : ''}" style="margin-bottom:5px">2 · ${escHtml(opposingLabel)}</div>
          <div class="${a.direction === 'left' ? 'sm-right' : a.direction === 'right' ? 'sm-left' : 'sm-right'}"><p>${escHtml(p.opposingView)}</p></div>
        </div>`
      : '';

    $('section-steelman').innerHTML = `
      <p style="font-size:10px;color:#475569;margin-bottom:10px">Topic: ${escHtml(p.topic)}</p>
      ${commonHtml}
      ${articleHtml}
      ${opposingHtml}`;
  }

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
