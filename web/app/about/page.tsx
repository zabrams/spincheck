import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About SpinCheck — AI-powered political bias detection',
  description:
    'SpinCheck analyzes any article, tweet, or news source for political bias on a 0-10 scale. Use it from your browser, your phone, or via iOS Shortcuts.',
};

const PLATFORMS = [
  {
    emoji: '🌐',
    name: 'Website',
    tagline: 'Paste a URL or text — get an analysis in seconds.',
    description:
      'The fastest way to try SpinCheck. Works on any browser, desktop or mobile. Auto-pastes URLs from your clipboard.',
    cta: 'Open SpinCheck',
    href: '/',
    external: false,
    primary: true,
  },
  {
    emoji: '📱',
    name: 'iOS Shortcuts',
    tagline: 'Analyze articles, tweets, and screenshots from anywhere on your iPhone or iPad.',
    description:
      'Three Shortcuts: Share Sheet (Safari articles), Clipboard (one-tap from any app), and Screenshot (tweets, paywalled content). Install with a single tap — no App Store.',
    cta: 'Install Shortcuts',
    href: '/shortcuts',
    external: false,
    primary: false,
  },
  {
    emoji: '💻',
    name: 'Chrome Extension',
    tagline: 'One-click analysis of any article you\'re reading in Chrome.',
    description:
      'Works on paywalled articles too — reads what\'s already loaded in your browser. Shows the bias score, evidence, and opposing perspectives right in a popup.',
    cta: 'Install Extension',
    href: 'https://github.com/zabrams/spincheck#chrome-extension',
    external: true,
    primary: false,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* ─────────── Hero ─────────── */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl" role="img" aria-label="scales">⚖️</span>
            <h1 className="text-5xl font-black tracking-tight text-white">SpinCheck</h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Detect political bias in any article, tweet, or news source — with AI.
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mt-3 leading-relaxed">
            See where coverage falls on the political spectrum, what evidence supports it,
            what's missing, and the strongest case from the opposing side.
          </p>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Try it now
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* ─────────── Demo GIF ─────────── */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              How it works
            </h2>
          </div>

          {/*
            To add the actual demo: drop a file at web/public/demo.gif
            (or change the src below). Ideal: 16:9 aspect, <5MB, looping.
            Showing: reading article → Share → SpinCheck → result, then
            the same flow with a screenshot of a tweet.
          */}
          <div className="relative aspect-video w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <img
              src="/demo.gif"
              alt="SpinCheck demo: reading an article, tapping share, analyzing it, then doing the same with a screenshot of a tweet"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Fallback shown while the GIF is missing or loading */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-sm pointer-events-none [&:has(+img)]:hidden">
              <div className="text-4xl mb-3 opacity-50">📹</div>
              <p className="font-medium">Demo coming soon</p>
              <p className="text-xs mt-1 text-gray-600">
                Article → Share → SpinCheck → Result
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            One tap on any iPhone, iPad, Mac, or Chrome browser.
          </p>
        </section>

        {/* ─────────── Three platforms ─────────── */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Three ways to use SpinCheck
            </h2>
            <p className="text-sm text-gray-500">
              Pick whichever fits how you read.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col bg-gray-900 border rounded-xl p-6 ${
                  p.primary ? 'border-blue-700/50' : 'border-gray-700'
                }`}
              >
                <div className="text-3xl mb-3" role="img" aria-hidden="true">{p.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{p.tagline}</p>
                <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                  {p.description}
                </p>

                {p.external ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      p.primary
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {p.cta} →
                  </a>
                ) : (
                  <Link
                    href={p.href}
                    className={`block text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      p.primary
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {p.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─────────── Mission blurb ─────────── */}
        <section className="text-center max-w-2xl mx-auto mb-8 py-8 border-t border-gray-800">
          <p className="text-sm text-gray-400 leading-relaxed">
            SpinCheck is built to help people <strong className="text-gray-200">think clearly
            about what they read</strong> — not to push them toward a conclusion. It scores
            bias on a 0–10 scale, surfaces specific evidence, and always steel-mans the
            opposing side. Use it on left-leaning articles, right-leaning articles, and
            everything in between.
          </p>
        </section>
      </div>

      <footer className="text-center py-8 text-xs text-gray-700 border-t border-gray-800">
        <span className="inline-flex gap-4 flex-wrap justify-center">
          <Link href="/" className="text-gray-500 hover:text-gray-300">spincheck.app</Link>
          <Link href="/shortcuts" className="text-gray-500 hover:text-gray-300">iOS Shortcuts</Link>
          <a
            href="https://github.com/zabrams/spincheck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300"
          >
            Chrome extension
          </a>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300">Privacy</Link>
        </span>
      </footer>
    </main>
  );
}
