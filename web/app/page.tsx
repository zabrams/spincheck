'use client';

import { useState } from 'react';
import ArticleInput from '@/components/ArticleInput';
import BiasResult from '@/components/BiasResult';
import type { BiasAnalysis } from '@/types/analysis';

interface Phase {
  id: string;
  label: string;
  seconds: number;
}

// Phase order matches the server's JSON schema output order in SYSTEM_PROMPT.
// Estimated seconds are tuned for Sonnet 4.6.
const PHASES: Phase[] = [
  { id: 'reading',            label: 'Reading the article',          seconds: 3  },
  { id: 'assessing',          label: 'Assessing political bias',     seconds: 4  },
  { id: 'writing_analysis',   label: 'Writing detailed analysis',    seconds: 12 },
  { id: 'gathering_evidence', label: 'Gathering evidence from the text', seconds: 6 },
  { id: 'finding_omissions',  label: 'Looking for what\'s missing',  seconds: 4  },
  { id: 'finding_sources',    label: 'Finding sources for balance',  seconds: 5  },
  { id: 'perspectives',       label: 'Steel-manning both sides',     seconds: 7  },
  { id: 'common_ground',      label: 'Looking for common ground',    seconds: 3  },
];

export default function Home() {
  const [analysis, setAnalysis] = useState<BiasAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string>('reading');
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(content: string, title?: string) {
    setLoading(true);
    setPhase('reading');
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let event: { type: string; data?: BiasAnalysis; error?: string; phase?: string };
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === 'phase' && event.phase) {
            setPhase(event.phase);
          } else if (event.type === 'result' && event.data) {
            setAnalysis(event.data);
            setLoading(false);
          } else if (event.type === 'error') {
            throw new Error(event.error || 'Analysis failed');
          }
          // 'progress' events ignored — the timeline UI is the indicator
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the analysis service.');
      setLoading(false);
    }
  }

  const currentPhaseIdx = Math.max(0, PHASES.findIndex((p) => p.id === phase));
  const remainingSeconds = PHASES
    .slice(currentPhaseIdx)
    .reduce((sum, p) => sum + p.seconds, 0);

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
          <div className="mt-6 bg-gray-900/60 border border-gray-800 rounded-xl p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
                Analyzing article
              </h3>
              <span className="text-xs text-gray-500 tabular-nums">
                ~{remainingSeconds}s remaining
              </span>
            </div>

            <ol className="relative">
              {PHASES.map((p, i) => {
                const isDone = i < currentPhaseIdx;
                const isCurrent = i === currentPhaseIdx;
                const isLast = i === PHASES.length - 1;

                return (
                  <li key={p.id} className="flex items-start gap-3 relative pb-3.5 last:pb-0">
                    {/* Vertical connector to next step */}
                    {!isLast && (
                      <span
                        className={`absolute left-2 top-5 bottom-0 w-px transition-colors duration-500 ${
                          isDone ? 'bg-green-500/40' : 'bg-gray-800'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Status marker */}
                    <span className="relative z-10 flex-shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
                      {isDone ? (
                        <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/60 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : isCurrent ? (
                        <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-label="Current step">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 animate-ping" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 ring-2 ring-blue-500/30" />
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-700" aria-hidden="true" />
                      )}
                    </span>

                    {/* Label + estimated time */}
                    <div className="flex-1 flex items-center justify-between gap-3 min-h-[16px]">
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          isDone ? 'text-gray-500' : isCurrent ? 'text-white font-medium' : 'text-gray-600'
                        }`}
                      >
                        {p.label}
                      </span>
                      <span
                        className={`text-xs tabular-nums transition-colors duration-300 ${
                          isCurrent ? 'text-blue-400 font-medium' : isDone ? 'text-gray-700' : 'text-gray-600'
                        }`}
                      >
                        ~{p.seconds}s
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
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
        <span className="inline-flex gap-4 mt-2">
          <a
            href="https://github.com/zabrams/spincheck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300"
          >
            Chrome extension
          </a>
          <a href="/privacy" className="text-gray-500 hover:text-gray-300">
            Privacy Policy
          </a>
        </span>
      </footer>
    </main>
  );
}
