'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BiasResult from '@/components/BiasResult';
import { decodeShareData, type ShareData } from '@/lib/share';

export default function ViewPage() {
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fragment = window.location.hash;
    if (!fragment) {
      setError('No analysis data in the URL.');
      return;
    }
    const decoded = decodeShareData(fragment);
    if (!decoded) {
      setError('Could not read the analysis from this link. It may be corrupted.');
      return;
    }
    setData(decoded);
  }, []);

  const sourceDomain = data?.url
    ? (() => {
        try {
          return new URL(data.url).hostname.replace(/^www\./, '');
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 mb-6 inline-block"
          >
            ← Analyze a new article
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl" role="img" aria-label="scales">⚖️</span>
            <h1 className="text-3xl font-black tracking-tight text-white">SpinCheck Analysis</h1>
          </div>

          {data?.title && (
            <p className="text-gray-300 text-base mt-3">
              <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
                Article
              </span>
              {data.title}
            </p>
          )}
          {sourceDomain && data?.url && (
            <p className="text-gray-500 text-xs mt-2">
              Source:{' '}
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {sourceDomain}
              </a>
            </p>
          )}
        </header>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {data && <BiasResult analysis={data.analysis} />}

        {!error && !data && (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        )}
      </div>

      <footer className="text-center py-8 text-xs text-gray-700 border-t border-gray-800 mt-12">
        SpinCheck uses AI to detect media bias. Results are analytical, not authoritative.
      </footer>
    </main>
  );
}
