'use client';

import { useState } from 'react';
import ArticleInput from '@/components/ArticleInput';
import BiasResult from '@/components/BiasResult';
import type { BiasAnalysis } from '@/types/analysis';

export default function Home() {
  const [analysis, setAnalysis] = useState<BiasAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(content: string, title?: string) {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? 'Analysis failed');
      } else {
        setAnalysis(data.data);
      }
    } catch {
      setError('Failed to connect to the analysis service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl" role="img" aria-label="scales">⚖️</span>
            <h1 className="text-4xl font-black tracking-tight text-white">SpinCheck</h1>
          </div>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Paste any news article to get an AI-powered analysis of its political bias —
            with evidence, balanced perspectives, and steel man arguments for both sides.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
            <span>0–3 scale</span>
            <span>·</span>
            <span className="text-blue-500">Left</span>
            <span>/</span>
            <span className="text-red-500">Right</span>
            <span>·</span>
            <span>Powered by Claude</span>
          </div>
        </header>

        <ArticleInput onAnalyze={handleAnalyze} loading={loading} />

        {error && (
          <div className="mt-5 p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {analysis && <BiasResult analysis={analysis} />}
      </div>

      <footer className="text-center py-8 text-xs text-gray-700 border-t border-gray-800 mt-12">
        SpinCheck uses AI to detect media bias. Results are analytical, not authoritative.
        <br />
        Also available as a{' '}
        <a
          href="https://github.com/zachabrams/spincheck"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-300"
        >
          Chrome extension
        </a>
        .
      </footer>
    </main>
  );
}
