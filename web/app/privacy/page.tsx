import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — SpinCheck',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 mb-8 inline-block">
          ← Back to SpinCheck
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">What SpinCheck does</h2>
            <p>
              SpinCheck is a political bias analyzer for news articles. It is available as a
              website (<strong className="text-gray-900">spincheck.app</strong>) and as a
              Chrome browser extension. When you submit an article, SpinCheck analyzes its
              content using Claude AI (made by Anthropic) and returns a bias assessment.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">What data we collect</h2>
            <p className="mb-3">
              <strong className="text-gray-900">Article text you submit.</strong> When you analyze
              an article — by pasting text on the website or clicking Analyze in the Chrome
              extension — that text is sent to our server and then forwarded to Anthropic's
              Claude API to produce the bias analysis. We do not store article text on our
              servers after the analysis is returned.
            </p>
            <p>
              <strong className="text-gray-900">That's it.</strong> We do not collect your name,
              email address, IP address, browsing history, or any other personal information.
              SpinCheck has no user accounts and no login.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">What data we do not collect</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-500">
              <li>No personal identifiers (name, email, phone, IP address)</li>
              <li>No browsing history or list of articles you've visited</li>
              <li>No analytics or tracking of how you use the extension</li>
              <li>No cookies or advertising identifiers</li>
              <li>No financial information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">Chrome extension — local storage</h2>
            <p>
              The Chrome extension caches analysis results locally on your device (using
              Chrome's <code className="text-blue-600">chrome.storage.local</code> API) for up
              to 24 hours so that revisiting an article doesn't require a second API call. This
              data never leaves your device and is automatically cleared after 24 hours. You can
              clear it at any time by removing and reinstalling the extension.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">Third-party services</h2>
            <p className="mb-3">
              <strong className="text-gray-900">Anthropic (Claude AI).</strong> Article text you
              submit is sent to Anthropic's API to generate the bias analysis. Anthropic's use
              of this data is governed by their{' '}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Privacy Policy
              </a>
              . Anthropic does not use API inputs to train their models by default.
            </p>
            <p>
              <strong className="text-gray-900">Vercel.</strong> The SpinCheck website and API are
              hosted on Vercel. Vercel may log standard server request metadata (such as
              timestamps and response codes) per their{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">Children's privacy</h2>
            <p>
              SpinCheck is not directed at children under 13 and we do not knowingly collect
              any information from children.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">Changes to this policy</h2>
            <p>
              If we make material changes to this policy, we will update the date at the top
              of this page. Continued use of SpinCheck after changes are posted constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">Contact</h2>
            <p>
              Questions about this privacy policy? Open an issue on{' '}
              <a
                href="https://github.com/zabrams/spincheck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                GitHub
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
