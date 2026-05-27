'use client';

import { useState } from 'react';

export interface AnalyzeInput {
  url?: string;
  content?: string;
  title?: string;
}

interface Props {
  onAnalyze: (input: AnalyzeInput) => void;
  loading: boolean;
}

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  return /^https?:\/\/\S+\.\S+/i.test(t) && t.length < 2048;
}

export default function ArticleInput({ onAnalyze, loading }: Props) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  function submit(payload: AnalyzeInput) {
    onAnalyze(payload);
  }

  function handleUrlSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const t = url.trim();
    if (!t) {
      pasteAndAnalyze();
      return;
    }
    if (!looksLikeUrl(t)) {
      setHint('That doesn\'t look like a URL. Switch to text mode for raw article text.');
      return;
    }
    setHint(null);
    submit({ url: t });
  }

  async function pasteAndAnalyze() {
    setHint(null);
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setHint('Your clipboard is empty. Copy a URL first.');
        return;
      }
      if (looksLikeUrl(text)) {
        setUrl(text);
        submit({ url: text });
      } else {
        // Not a URL — paste into the field so the user can see it
        setUrl(text);
        setHint('That doesn\'t look like a URL. Paste article text using the option below.');
      }
    } catch {
      setHint('Couldn\'t read your clipboard. Paste manually with Cmd/Ctrl+V into the box above.');
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length >= 100) {
      submit({ content: content.trim(), title: title.trim() || undefined });
    }
  }

  // ─────────── TEXT MODE (advanced) ───────────
  if (mode === 'text') {
    const charCount = content.length;
    const isValid = charCount >= 100 && charCount <= 100_000;
    const charCountColor =
      charCount > 100_000 ? 'text-red-400'
      : charCount >= 100 ? 'text-green-400'
      : 'text-gray-500';

    return (
      <form onSubmit={handleTextSubmit} className="space-y-3">
        <button
          type="button"
          onClick={() => { setMode('url'); setHint(null); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors -mb-1"
        >
          ← Back to URL input
        </button>

        <input
          type="text"
          placeholder="Article title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />

        <div className="relative">
          <textarea
            placeholder="Paste article content here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
          />
          <span className={`absolute bottom-3 right-3 text-xs ${charCountColor}`}>
            {charCount.toLocaleString()} / 100,000
          </span>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : 'Analyze Article'}
        </button>
      </form>
    );
  }

  // ─────────── URL MODE (default) ───────────
  const hasUrl = url.trim().length > 0;
  const isValidUrl = looksLikeUrl(url);
  const buttonDisabled = loading || (hasUrl && !isValidUrl);

  return (
    <form onSubmit={handleUrlSubmit} className="space-y-3">
      <input
        type="url"
        placeholder="Paste an article URL — e.g. https://nytimes.com/…"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setHint(null); }}
        autoFocus
        spellCheck={false}
        autoComplete="url"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-base"
      />

      <button
        type="submit"
        disabled={buttonDisabled}
        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <Spinner />
        ) : hasUrl ? (
          <>Analyze</>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            Paste from clipboard &amp; Analyze
          </>
        )}
      </button>

      {hint && (
        <p className="text-xs text-amber-400 px-1" role="status">
          {hint}
        </p>
      )}

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={() => { setMode('text'); setHint(null); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Or paste article text instead →
        </button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <>
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Analyzing…
    </>
  );
}
