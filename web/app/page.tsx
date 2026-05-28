'use client';

import { useState } from 'react';
import Link from 'next/link';
import ArticleInput, { type AnalyzeInput } from '@/components/ArticleInput';
import BiasResult from '@/components/BiasResult';
import FeedbackForm from '@/components/FeedbackForm';
import Logo from '@/components/Logo';
import PlatformPromo from '@/components/PlatformPromo';
import type { BiasAnalysis } from '@/types/analysis';

interface Phase {
  id: string;
  label: string;
  seconds: number;
}

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
  // Track the input that produced the current analysis so we can attach
  // it to feedback records.
  const [lastInput, setLastInput] = useState<AnalyzeInput | null>(null);

  async function handleAnalyze(input: AnalyzeInput) {
    setLoading(true);
    setPhase('reading');
    setError(null);
    setAnalysis(null);
    setLastInput(input);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
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
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top nav — minimal, doesn't compete with the input */}
      <nav className="flex items-center justify-end gap-6 px-4 py-4 max-w-4xl mx-auto text-sm">
        <Link href="/about" className="text-gray-500 hover:text-gray-900 transition-colors">About</Link>
        <Link href="/shortcuts" className="text-gray-500 hover:text-gray-900 transition-colors">iOS</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pb-16 pt-8">

        {/* ─────────── Hero ─────────── */}
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Logo size={56} className="text-gray-900" />
            <h1 className="text-5xl font-black tracking-tight text-gray-900">SpinCheck</h1>
          </div>
          <p className="text-2xl text-gray-600 font-medium">
            See the bias. Read smarter.
          </p>
        </header>

        {/* ─────────── Big input ─────────── */}
        <ArticleInput onAnalyze={handleAnalyze} loading={loading} />

        {/* ─────────── Loader timeline ─────────── */}
        {loading && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
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
                    {/* Vertical connector */}
                    {!isLast && (
                      <span
                        className={`absolute left-2 top-5 bottom-0 w-px transition-colors duration-500 ${
                          isDone ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Status marker */}
                    <span className="relative z-10 flex-shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
                      {isDone ? (
                        <span className="w-4 h-4 rounded-full bg-green-100 border border-green-400 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : isCurrent ? (
                        <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-label="Current step">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40 animate-ping" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 ring-4 ring-blue-100" />
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300" aria-hidden="true" />
                      )}
                    </span>

                    {/* Label + estimated time */}
                    <div className="flex-1 flex items-center justify-between gap-3 min-h-[16px]">
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          isDone ? 'text-gray-400' : isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {p.label}
                      </span>
                      <span
                        className={`text-xs tabular-nums transition-colors duration-300 ${
                          isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'
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

        {/* Platform promo — shown above any result, even errors, so users
            learn about the Chrome extension / iOS Shortcuts which often
            work where the website can't (paywalls, anti-bot, etc.) */}
        {!loading && (error || analysis) && (
          <PlatformPromo variant={error ? 'error' : 'success'} />
        )}

        {error && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {analysis && (
          <>
            <BiasResult analysis={analysis} />
            <FeedbackForm
              key={lastInput?.url || lastInput?.content?.slice(0, 50) || 'unknown'}
              analysis={analysis}
              url={lastInput?.url}
              title={lastInput?.title}
            />
          </>
        )}
      </div>

      <footer className="text-center py-8 text-xs text-gray-500 border-t border-gray-200">
        SpinCheck uses AI to detect media bias. Results are analytical, not authoritative.
        <br />
        <span className="inline-flex gap-5 mt-3 flex-wrap justify-center">
          <Link href="/about" className="hover:text-gray-900">About</Link>
          <Link href="/shortcuts" className="hover:text-gray-900">iOS Shortcuts</Link>
          <a
            href="https://chromewebstore.google.com/detail/spincheck/jokmjbpdjfiencphjihbdllkmlgdjpjj"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900"
          >
            Chrome extension
          </a>
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
        </span>
      </footer>
    </main>
  );
}
