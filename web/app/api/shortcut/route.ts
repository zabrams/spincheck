import { NextRequest } from 'next/server';
import {
  client,
  FAST_MODEL,
  FAST_MAX_TOKENS,
  SHORTCUT_SYSTEM_PROMPT,
  buildUserMessage,
  stripJsonFences,
} from '@/lib/claude';
import { fetchAndExtract } from '@/lib/extract';
import type { BiasAnalysis } from '@/types/analysis';

export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Friendly response when someone (or you) visits this URL in a browser.
// The Shortcut uses POST so this is just for humans.
export async function GET() {
  const help = `⚖️ SpinCheck — Shortcut API
─────────────────────────────────

This is a POST endpoint used by the iOS Shortcut.
You're seeing this because you opened it in a browser (which does a GET).

If you want to use SpinCheck, visit:
  https://spincheck.app

If you're configuring an iOS Shortcut:
  URL:    https://spincheck.app/api/shortcut
  Method: POST
  Body:   { "url": "https://..." }
       or { "content": "article text..." }
  Returns: plain-text bias analysis

The endpoint is working — you can confirm by submitting a POST request from
the Shortcut or with curl.`;

  return new Response(help, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function looksLikeUrl(s: string): boolean {
  const trimmed = s.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) && trimmed.length < 2048;
}

export async function POST(request: NextRequest) {
  let content: string;
  let title: string | undefined;
  let url: string | undefined;

  try {
    const body = await request.json();
    content = body.content ?? '';
    title = body.title;
    url = body.url;
  } catch {
    return new Response('Invalid request body', { status: 400, headers: corsHeaders });
  }

  if (!content && url) {
    try {
      const extracted = await fetchAndExtract(url);
      content = extracted.content;
      if (!title) title = extracted.title;
    } catch (err) {
      return new Response(
        err instanceof Error ? err.message : 'Failed to fetch article.',
        { status: 400, headers: corsHeaders }
      );
    }
  } else if (content && looksLikeUrl(content)) {
    const sharedUrl = content.trim();
    try {
      const extracted = await fetchAndExtract(sharedUrl);
      content = extracted.content;
      if (!title) title = extracted.title;
      url = sharedUrl;
    } catch (err) {
      return new Response(
        err instanceof Error ? err.message : 'Failed to fetch article.',
        { status: 400, headers: corsHeaders }
      );
    }
  }

  if (!content || content.trim().length < 100) {
    return new Response('Article text must be at least 100 characters.', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const userMessage = buildUserMessage({ content, title, url });

  try {
    // Use FAST_MODEL (Haiku) + slim prompt for <10s response time
    const message = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: FAST_MAX_TOKENS,
      system: [
        {
          type: 'text' as const,
          text: SHORTCUT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis = JSON.parse(stripJsonFences(raw)) as ShortcutAnalysis;

    return new Response(formatForShortcut(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('Shortcut analysis error:', err);
    return new Response('Analysis failed. Please try again.', {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// Slim shape returned by SHORTCUT_SYSTEM_PROMPT — no analysis/framingEvidence/furtherReading
type ShortcutAnalysis = Pick<
  BiasAnalysis,
  | 'score'
  | 'direction'
  | 'confidence'
  | 'summary'
  | 'isEditorial'
  | 'presentsBothSides'
  | 'usesEmotionalLanguage'
  | 'hasSelectiveSourcing'
  | 'hasMisleadingHeadline'
  | 'omissionEvidence'
  | 'perspectives'
>;

function getScoreLabel(score: number): string {
  if (score <= 0) return 'No Bias';
  if (score <= 2) return 'Slight Bias';
  if (score <= 4) return 'Mild Bias';
  if (score <= 6) return 'Moderate Bias';
  if (score <= 8) return 'Strong Bias';
  return 'Extreme Bias';
}

function formatForShortcut(a: ShortcutAnalysis): string {
  const scoreStr =
    a.direction === 'left' ? `${a.score}L`
    : a.direction === 'right' ? `${a.score}R`
    : `${a.score}`;

  const dirLabel =
    a.direction === 'left' ? ' — Leans Left'
    : a.direction === 'right' ? ' — Leans Right'
    : '';

  const scoreLine = `${scoreStr} · ${getScoreLabel(a.score)}${dirLabel}`;

  const tagLines = [
    a.isEditorial ? '📝 Editorial' : '📰 Factual Reporting',
    a.presentsBothSides ? '✓ Presents Both Sides' : '✗ One-Sided',
    a.usesEmotionalLanguage ? '⚠ Emotional Language' : '✓ Neutral Tone',
    a.hasSelectiveSourcing ? '⚠ Selective Sourcing' : '✓ Diverse Sources',
    a.hasMisleadingHeadline ? '⚠ Misleading Headline' : '✓ Accurate Headline',
  ];

  const D = '─────────────────────';

  let out = `⚖️ SpinCheck\n${D}\n`;
  out += `${scoreLine}\n`;
  out += `Confidence: ${a.confidence}\n\n`;
  out += `${a.summary}\n\n`;
  out += tagLines.join('\n') + '\n';

  if (a.perspectives.commonGround) {
    out += `\n${D}\n🤝 COMMON GROUND\n${D}\n`;
    out += `${a.perspectives.commonGround}\n`;
  }

  out += `\n${D}\n📰 ARTICLE'S VIEW\n${D}\n`;
  out += `${a.perspectives.articleView}\n`;

  if (a.perspectives.opposingView) {
    out += `\n${D}\n⚖️ OPPOSING VIEW\n${D}\n`;
    out += `${a.perspectives.opposingView}\n`;
  }

  if (a.omissionEvidence.length > 0) {
    out += `\n${D}\n🎯 WHAT'S MISSING\n${D}\n`;
    a.omissionEvidence.slice(0, 3).forEach((e, i) => {
      out += `${i + 1}. ${e}\n`;
    });
  }

  out += `\n${D}\nspincheck.app`;
  return out.trim();
}
