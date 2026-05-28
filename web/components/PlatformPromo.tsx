'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  variant: 'success' | 'error';
}

type Platform = 'ios' | 'chrome' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  // iPad on iPadOS 13+ identifies as Mac in UA, so also check touch
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  // Chrome on desktop or Android — exclude Edge / Opera which include "Chrome" in UA
  if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) return 'chrome';
  return 'other';
}

const DISMISS_KEY = 'spincheck_promo_dismissed';

export default function PlatformPromo({ variant }: Props) {
  // Start dismissed=true so SSR doesn't briefly render the banner before
  // sessionStorage is consulted on client mount.
  const [dismissed, setDismissed] = useState(true);
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    setPlatform(detectPlatform());
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  if (dismissed) return null;

  const isError = variant === 'error';

  // On iOS, lead with Shortcuts. Everywhere else, lead with Chrome.
  const primary: 'ios' | 'chrome' = platform === 'ios' ? 'ios' : 'chrome';

  return (
    <div
      className={`mt-6 rounded-2xl p-5 border ${
        isError
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      } animate-in fade-in slide-in-from-top-1 duration-300`}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 mb-1.5">
            {isError
              ? '🔓 Want this article analyzed anyway?'
              : '⚡ Faster, smoother — the right tool for the moment'}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {isError ? (
              <>
                This page blocked our server (paywall, login, or anti-bot protection).
                The <strong>Chrome extension</strong> and <strong>iOS Shortcuts</strong> read
                content directly from your own browser — including articles you&apos;re logged into.
                They work where the website can&apos;t.
              </>
            ) : (
              <>
                You used the website, which works great. But you&apos;ll save time and unlock
                more sources with our tools — one click while reading any article, no URL
                copying. They also handle paywalled content you&apos;re logged into.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors -mr-1 -mt-1 p-1 text-base leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {primary === 'chrome' ? (
          <>
            <a
              href="https://github.com/zabrams/spincheck#chrome-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              💻 Get the Chrome Extension
            </a>
            <Link
              href="/shortcuts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-900 text-sm font-semibold transition-colors"
            >
              📱 On iPhone/iPad? Install Shortcuts
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/shortcuts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              📱 Install iOS Shortcuts
            </Link>
            <a
              href="https://github.com/zabrams/spincheck#chrome-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-900 text-sm font-semibold transition-colors"
            >
              💻 On desktop? Chrome Extension
            </a>
          </>
        )}
      </div>
    </div>
  );
}
