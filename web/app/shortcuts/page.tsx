import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Install SpinCheck Shortcuts for iOS — SpinCheck',
  description: 'One-tap install of SpinCheck iOS Shortcuts. Analyze any article, tweet, or screenshot for political bias from your iPhone or iPad.',
};

/**
 * To generate these iCloud Shortcut links:
 * 1. On your iPad/iPhone, open the Shortcuts app
 * 2. Find the Shortcut, tap the (⋯) info button (or long-press the tile → Details)
 * 3. Tap the Share icon → "Copy iCloud Link"
 * 4. Replace the placeholder URL below
 *
 * The links work for any iOS 15+ device. Tapping the link opens the
 * Shortcuts app with a preview of all actions and a one-tap install button.
 */
const SHORTCUTS = [
  {
    id: 'share',
    emoji: '🔗',
    name: 'SpinCheck (Share Sheet)',
    bestFor: 'Articles in Safari',
    description:
      'When reading any article in Safari (including paywalled articles you\'re logged into), tap Share → SpinCheck. Server reads the article and returns the bias analysis.',
    iCloudUrl: 'https://www.icloud.com/shortcuts/23aa791a97e0458497a5ce9cd7250e65',
    available: true,
  },
  {
    id: 'clipboard',
    emoji: '📋',
    name: 'SpinCheck (Clipboard)',
    bestFor: 'Apps with custom share widgets (Substack, X, Reddit, etc.)',
    description:
      'Copy a URL or paragraph of text from any app, then tap this Shortcut from your Home Screen. It reads your clipboard and runs analysis. Universal fallback when the share sheet doesn\'t cooperate.',
    iCloudUrl: 'https://www.icloud.com/shortcuts/f39ebe24dc734670b135b3db810e2100',
    available: true,
  },
  {
    id: 'screenshot',
    emoji: '📸',
    name: 'SpinCheck (Screenshot)',
    bestFor: 'Tweets, paywalled content, anything on your screen',
    description:
      'Take a screenshot of a tweet, paywalled article, or any visible post. From the screenshot preview, tap Share → SpinCheck. Claude reads the image directly — bypasses copy-paste and scraping entirely.',
    iCloudUrl: 'https://www.icloud.com/shortcuts/37d39f61b01245bca9851352c74f893f',
    available: true,
  },
];

function isPlaceholder(url: string): boolean {
  return url.includes('REPLACE_ME');
}

export default function ShortcutsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-8 inline-block">
          ← Back to SpinCheck
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" role="img" aria-label="iPhone">📱</span>
            <h1 className="text-3xl font-black tracking-tight text-white">
              SpinCheck for iOS
            </h1>
          </div>
          <p className="text-gray-400 text-base leading-relaxed">
            Install one or all three iOS Shortcuts below to analyze any article, tweet,
            or screenshot for political bias — directly from your iPhone or iPad. No App
            Store, no developer account, no setup beyond tapping Install.
          </p>
        </header>

        {/* iOS-only notice */}
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-300">
          <strong className="text-blue-200">Open this page on your iPhone or iPad</strong> —
          the Install buttons below only work on iOS devices with the Shortcuts app.
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map((s) => (
            <div key={s.id} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0" role="img" aria-hidden="true">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white">{s.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Best for: <span className="text-gray-300">{s.bestFor}</span>
                  </p>
                  <p className="text-sm text-gray-300 mt-3 leading-relaxed">{s.description}</p>

                  <div className="mt-4">
                    {isPlaceholder(s.iCloudUrl) ? (
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 rounded-lg bg-gray-800 text-gray-500 text-sm font-semibold cursor-not-allowed"
                      >
                        Coming soon
                      </button>
                    ) : (
                      <a
                        href={s.iCloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                        Install on iPhone / iPad
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Installation help */}
        <section className="mt-10 space-y-4 text-sm text-gray-300">
          <h2 className="text-lg font-bold text-white">How installation works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>Tap <strong className="text-gray-300">Install on iPhone / iPad</strong> above (on your iOS device, not desktop).</li>
            <li>The iCloud Shortcut preview opens — you'll see all the actions the Shortcut runs (no hidden behavior).</li>
            <li>Tap <strong className="text-gray-300">Add Shortcut</strong> at the bottom.</li>
            <li>Optional: long-press the Shortcut in the Shortcuts app → <strong className="text-gray-300">Add to Home Screen</strong> for one-tap access from anywhere.</li>
          </ol>
          <p className="text-gray-500 text-xs mt-3">
            If you see <em>"This Shortcut cannot be added"</em>, open Settings → Shortcuts → Advanced
            and enable <em>"Allow Untrusted Shortcuts"</em>. (iOS 16+ usually allows shared Shortcuts
            by default, so this is rarely needed.)
          </p>
        </section>

        {/* Other platforms */}
        <section className="mt-10 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">Not on iOS?</h2>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>
              <strong className="text-white">Chrome / desktop:</strong>{' '}
              <a
                href="https://github.com/zabrams/spincheck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Install the Chrome extension
              </a>{' '}
              — analyzes the article you're currently reading.
            </li>
            <li>
              <strong className="text-white">Any browser:</strong>{' '}
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Paste a URL or text at spincheck.app
              </Link>
              .
            </li>
          </ul>
        </section>
      </div>

      <footer className="text-center py-8 text-xs text-gray-700 border-t border-gray-800 mt-12">
        <Link href="/" className="text-gray-500 hover:text-gray-300">
          spincheck.app
        </Link>{' '}
        ·{' '}
        <Link href="/privacy" className="text-gray-500 hover:text-gray-300">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
