'use client';

import { useState } from 'react';
import ArticleInput from '@/components/ArticleInput';
import BiasResult from '@/components/BiasResult';
import type { BiasAnalysis } from '@/types/analysis';

export default function Home() {
  const [analysis, setAnalysis] = useState<BiasAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(content: string, title?: string) {
    setLoading(true);
    setProgress(0);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Server error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let progressCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let event: { type: string; data?: BiasAnalysis; error?: string };
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === 'progress') {
            progressCount++;
            // Asymptotic curve toward 90% — snaps to 100 on result
            setProgress(Math.min(90, Math.round(90 * (1 - Math.exp(-progressCount / 15)))));
          } else if (event.type === 'result' && event.data) {
            setProgress(100);
            setAnalysis(event.data);
            setLoading(false);
          } else if (event.type === 'error') {
            throw new Error(event.error || 'Analysis failed');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the analysis service.');
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

        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Analyzing article…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

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
          href="https://github.com/zabrams/spincheck"
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
