'use client';

import { useState } from 'react';
import type { BiasAnalysis } from '@/types/analysis';

interface Props {
  analysis: BiasAnalysis;
  url?: string;
  title?: string;
}

export default function FeedbackForm({ analysis, url, title }: Props) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!vote) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote,
          comment: comment.trim() || undefined,
          url,
          title,
          analysis,
          source: 'web',
        }),
      });
    } catch {
      // Fire-and-forget — feedback shouldn't block the UX even if it fails
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-2xl text-center text-sm text-gray-600">
        <span className="text-green-700 font-semibold">✓ Thanks for the feedback.</span>{' '}
        Your input helps SpinCheck get better.
      </div>
    );
  }

  if (vote) {
    return (
      <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-2xl">
        <p className="text-sm text-gray-700 mb-3">
          {vote === 'up'
            ? 'Glad it was helpful! '
            : 'Sorry the analysis missed the mark. '}
          <span className="text-gray-500">Tell us more so we can improve (optional):</span>
        </p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={
            vote === 'up'
              ? 'What was useful?'
              : 'What was wrong or missing?'
          }
          autoFocus
          maxLength={2000}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all resize-none"
        />

        <div className="mt-3 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => { setVote(null); setComment(''); }}
            disabled={submitting}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  // Initial state — show the prompt and thumbs
  return (
    <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-700 font-medium">
        Was this analysis helpful?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVote('up')}
          aria-label="Helpful"
          className="px-4 py-2 bg-white border border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-lg text-base transition-colors"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => setVote('down')}
          aria-label="Not helpful"
          className="px-4 py-2 bg-white border border-gray-300 hover:border-red-400 hover:bg-red-50 rounded-lg text-base transition-colors"
        >
          👎
        </button>
      </div>
    </div>
  );
}
