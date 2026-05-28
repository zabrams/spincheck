import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Install SpinCheck Shortcuts for iOS — SpinCheck',
  description: 'One-tap install of SpinCheck iOS Shortcuts. Analyze any article, tweet, or screenshot for political bias from your iPhone or iPad.',
};

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
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-end gap-6 px-4 py-4 max-w-3xl mx-auto text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
        <Link href="/about" className="text-gray-500 hover:text-gray-900 transition-colors">About</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" role="img" aria-label="iPhone">📱</span>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              SpinCheck for iOS
            </h1>
          </div>
          <p className="text-gray-600 text-base leading-relaxed">
            Install one or all three iOS Shortcuts below to analyze any article, tweet,
            or screenshot for political bias — directly from your iPhone or iPad. No App
            Store, no developer account, no setup beyond tapping Install.
          </p>
        </header>

        {/* iOS-only notice */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          <strong className="text-blue-900">Open this page on your iPhone or iPad</strong> —
          the Install buttons below only work on iOS devices with the Shortcuts app.
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0" role="img" aria-hidden="true">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">{s.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Best for: <span className="text-gray-700">{s.bestFor}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed">{s.description}</p>

                  <div className="mt-4">
                    {isPlaceholder(s.iCloudUrl) ? (
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed"
                      >
                        Coming soon
                      </button>
                    ) : (
                      <a
                        href={s.iCloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
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
        <section className="mt-10 space-y-4 text-sm text-gray-700">
          <h2 className="text-lg font-bold text-gray-900">How installation works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Tap <strong className="text-gray-900">Install on iPhone / iPad</strong> above (on your iOS device, not desktop).</li>
            <li>The iCloud Shortcut preview opens — you&apos;ll see all the actions the Shortcut runs (no hidden behavior).</li>
            <li>Tap <strong className="text-gray-900">Add Shortcut</strong> at the bottom.</li>
            <li>Optional: long-press the Shortcut in the Shortcuts app → <strong className="text-gray-900">Add to Home Screen</strong> for one-tap access from anywhere.</li>
          </ol>
          <p className="text-gray-500 text-xs mt-3">
            If you see <em>&quot;This Shortcut cannot be added&quot;</em>, open Settings → Shortcuts → Advanced
            and enable <em>&quot;Allow Untrusted Shortcuts&quot;</em>. (iOS 16+ usually allows shared Shortcuts
            by default, so this is rarely needed.)
          </p>
        </section>

        {/* How to use going forward */}
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            🎯 How to use SpinCheck going forward
          </h2>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Each Shortcut is designed for a different reading scenario. Pick whichever fits the moment.
          </p>

          <div className="space-y-4">
            {/* SpinCheck URL */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" aria-hidden="true">🔗</span>
                <h3 className="text-sm font-bold text-gray-900">
                  SpinCheck (URL) — articles in Safari
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Best when you&apos;re reading an article and want a fast analysis.
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                <li>Open the article in <strong className="text-gray-900">Safari</strong> (or Apple News, etc.).</li>
                <li>Tap the <strong className="text-gray-900">Share</strong> button at the bottom.</li>
                <li>Tap <strong className="text-gray-900">SpinCheck (URL)</strong> in the action list. (Pin to Favorites — see below — for one-tap access.)</li>
                <li>Wait ~10 seconds. The analysis appears in a sheet.</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                💡 Works on paywalled articles too if you&apos;re logged into the site in Safari.
              </p>
            </div>

            {/* SpinCheck Clipboard */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" aria-hidden="true">📋</span>
                <h3 className="text-sm font-bold text-gray-900">
                  SpinCheck (Clipboard) — tweets, Substack, anywhere else
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Best when an app has its own custom share widget that doesn&apos;t use the iOS Share Sheet (X, Substack, Reddit, etc.).
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                <li>In any app, copy the URL or text. (Long-press → <strong className="text-gray-900">Copy</strong>, or tap the app&apos;s share menu → Copy.)</li>
                <li>Go to your Home Screen and tap the <strong className="text-gray-900">SpinCheck</strong> icon. (To put it there: open the Shortcuts app → long-press SpinCheck (Clipboard) → <strong className="text-gray-900">Add to Home Screen</strong>.)</li>
                <li>Wait ~10 seconds. The analysis appears in a sheet.</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                💡 This is the universal fallback — works from any app since every app supports copying.
              </p>
            </div>

            {/* SpinCheck Image */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" aria-hidden="true">📸</span>
                <h3 className="text-sm font-bold text-gray-900">
                  SpinCheck (Image) — tweets, paywalled content, anything visible on screen
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Best for content that can&apos;t be scraped (X tweets, paywalls, native apps). Claude reads the image directly.
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                <li>Take a <strong className="text-gray-900">screenshot</strong> of the tweet, post, or article (Side button + Volume Up).</li>
                <li>Tap the screenshot preview that appears in the bottom-left corner.</li>
                <li>Tap the <strong className="text-gray-900">Share</strong> button at the top-right.</li>
                <li>Tap <strong className="text-gray-900">SpinCheck (Image)</strong>. (Pin to Favorites for faster access.)</li>
                <li>Wait ~10 seconds. The analysis appears in a sheet.</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                💡 You can also share photos from your library the same way — anything you can screenshot, SpinCheck can read.
              </p>
            </div>
          </div>
        </section>

        {/* Pin to Share Sheet */}
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            📌 Pin SpinCheck to the top of your Share Sheet
          </h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            By default, the SpinCheck Shortcuts appear near the bottom of the iOS Share Sheet
            and require scrolling. Pin them to <strong className="text-gray-900">Favorites</strong> so
            they show up at the top — one tap from any Share button.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              On your iPhone or iPad
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Open any article in Safari (or take a screenshot of a tweet).</li>
              <li>Tap the <strong className="text-gray-900">Share</strong> button.</li>
              <li>Scroll down past the apps row and the action list to the very bottom.</li>
              <li>Tap <strong className="text-gray-900">Edit Actions…</strong></li>
              <li>
                Under the <em>Suggestions</em> or <em>Shortcuts</em> section, find{' '}
                <strong className="text-gray-900">SpinCheck (URL)</strong> and{' '}
                <strong className="text-gray-900">SpinCheck (Image)</strong>.
              </li>
              <li>
                Tap the green <strong className="text-green-700">⊕</strong> next to each to add to
                Favorites. (If you don&apos;t see a + button, tap the star or pin icon — naming
                varies by iOS version.)
              </li>
              <li>Drag them to the top of the list using the handle on the right.</li>
              <li>Tap <strong className="text-gray-900">Done</strong>.</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Now whenever you tap Share — on an article, a tweet screenshot, or anything else —
              SpinCheck appears at the top of the action list for instant access.
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Note: the <strong className="text-gray-700">SpinCheck (Clipboard)</strong> Shortcut
            doesn&apos;t appear in the Share Sheet — it&apos;s designed to be launched from your
            Home Screen instead (long-press it in the Shortcuts app → Add to Home Screen).
          </p>
        </section>

        {/* Other platforms */}
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Not on iOS?</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>
              <strong className="text-gray-900">Chrome / desktop:</strong>{' '}
              <a
                href="https://chromewebstore.google.com/detail/spincheck/jokmjbpdjfiencphjihbdllkmlgdjpjj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Install the Chrome extension
              </a>{' '}
              — analyzes the article you&apos;re currently reading.
            </li>
            <li>
              <strong className="text-gray-900">Any browser:</strong>{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                Paste a URL or text at spincheck.app
              </Link>
              .
            </li>
          </ul>
        </section>
      </div>

      <footer className="text-center py-8 text-xs text-gray-500 border-t border-gray-200">
        <span className="inline-flex gap-5 flex-wrap justify-center">
          <Link href="/" className="hover:text-gray-900">spincheck.app</Link>
          <Link href="/about" className="hover:text-gray-900">About</Link>
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
        </span>
      </footer>
    </main>
  );
}
