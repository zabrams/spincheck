'use client';

import { useState } from 'react';

interface Props {
  onAnalyze: (content: string, title?: string) => void;
  loading: boolean;
}

export default function ArticleInput({ onAnalyze, loading }: Props) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length >= 100) {
      onAnalyze(content.trim(), title.trim() || undefined);
    }
  }

  const charCount = content.length;
  const isValid = charCount >= 100 && charCount <= 100_000;

  const charCountColor =
    charCount > 100_000
      ? 'text-red-400'
      : charCount >= 100
        ? 'text-green-400'
        : 'text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing…
          </>
        ) : (
          'Analyze Article'
        )}
      </button>
    </form>
  );
}
