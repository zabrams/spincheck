import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

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
    href: 'https://chromewebstore.google.com/detail/spincheck/jokmjbpdjfiencphjihbdllkmlgdjpjj',
    external: true,
    primary: false,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-end gap-6 px-4 py-4 max-w-4xl mx-auto text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
        <Link href="/shortcuts" className="text-gray-500 hover:text-gray-900 transition-colors">iOS</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pb-12">

        {/* ─────────── Hero ─────────── */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo size={56} className="text-gray-900" />
            <h1 className="text-5xl font-black tracking-tight text-gray-900">SpinCheck</h1>
          </div>
          <p className="text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
            See the bias. Read smarter.
          </p>
          <p className="text-base text-gray-500 max-w-xl mx-auto mt-3 leading-relaxed">
            Detect political bias in any article, tweet, or news source. See what evidence
            supports the assessment, what&apos;s missing, and the strongest case from the opposing side.
          </p>

          <div className="mt-7">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm hover:shadow"
            >
              Try it now
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* ─────────── Demo GIF ─────────── */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              How it works
            </h2>
          </div>

          {/*
            To add the actual demo: drop a file at web/public/demo.gif
            (or change the src below). Ideal: 16:9 aspect, <5MB, looping.
            Showing: reading article → Share → SpinCheck → result, then
            the same flow with a screenshot of a tweet.
          */}
          <div className="relative w-full max-w-sm mx-auto bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <video
              src="/demo.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="SpinCheck demo: reading an article, tapping share, getting a bias analysis on the phone"
              className="relative w-full h-auto block"
            />
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            One tap on any iPhone, iPad, Mac, or Chrome browser.
          </p>
        </section>

        {/* ─────────── Three platforms ─────────── */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
                className={`flex flex-col bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${
                  p.primary ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="text-3xl mb-3" role="img" aria-hidden="true">{p.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{p.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.tagline}</p>
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
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {p.cta} →
                  </a>
                ) : (
                  <Link
                    href={p.href}
                    className={`block text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      p.primary
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
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
        <section className="text-center max-w-2xl mx-auto mb-8 py-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">
            SpinCheck is built to help people <strong className="text-gray-900">think clearly
            about what they read</strong> — not to push them toward a conclusion. It scores
            bias on a 0–10 scale, surfaces specific evidence, and always steel-mans the
            opposing side. Use it on left-leaning articles, right-leaning articles, and
            everything in between.
          </p>
        </section>
      </div>

      <footer className="text-center py-8 text-xs text-gray-500 border-t border-gray-200">
        <span className="inline-flex gap-5 flex-wrap justify-center">
          <Link href="/" className="hover:text-gray-900">spincheck.app</Link>
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
