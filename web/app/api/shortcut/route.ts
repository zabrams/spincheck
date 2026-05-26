import { NextRequest } from 'next/server';
import {
  client,
  MODEL,
  MAX_TOKENS,
  SYSTEM_PROMPT,
  buildUserMessage,
  stripJsonFences,
  retryAnalyze,
} from '@/lib/claude';
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

  if (!content || content.trim().length < 100) {
    return new Response('Article text must be at least 100 characters.', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const userMessage = buildUserMessage({ content, title, url });

  try {
    let analysis: BiasAnalysis;
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text' as const,
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' as const },
          },
        ],
        messages: [{ role: 'user', content: userMessage }],
      });

      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      analysis = JSON.parse(stripJsonFences(raw)) as BiasAnalysis;
    } catch {
      // Retry once with stricter JSON-only instruction
      analysis = (await retryAnalyze(userMessage)) as BiasAnalysis;
    }

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

function formatForShortcut(a: BiasAnalysis): string {
  const scoreLabels = ['No Bias', 'Slightly Biased', 'Moderately Biased', 'Strongly Biased'];
  const scoreStr =
    a.direction === 'none' ? '0' : `${a.score}${a.direction === 'left' ? 'L' : 'R'}`;
  const dirLabel =
    a.direction === 'none' ? '' : a.direction === 'left' ? ' · Leans Left' : ' · Leans Right';
  const scoreLine = `${scoreStr} · ${scoreLabels[a.score]}${dirLabel}`;

  const tags = [
    a.isEditorial ? '📝 Editorial' : '📰 Factual',
    a.presentsBothSides ? '✓ Balanced' : '✗ One-Sided',
    a.usesEmotionalLanguage ? '⚠ Emotional Language' : null,
    a.hasSelectiveSourcing ? '⚠ Selective Sourcing' : null,
    a.hasMisleadingHeadline ? '⚠ Misleading Headline' : null,
  ]
    .filter(Boolean)
    .join('  ');

  const D = '─────────────────────';

  let out = `⚖️ SpinCheck\n${D}\n`;
  out += `${scoreLine}\n`;
  out += `Confidence: ${a.confidence}\n\n`;
  out += `${a.summary}\n\n`;
  out += `${tags}\n`;

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
    a.omissionEvidence.forEach((e, i) => {
      out += `${i + 1}. ${e}\n`;
    });
  }

  if (a.furtherReading.length > 0) {
    out += `\n${D}\n📚 FURTHER READING\n${D}\n`;
    a.furtherReading.forEach((r, i) => {
      out += `${i + 1}. ${r.description}\n   Search: "${r.searchQuery}"\n\n`;
    });
  }

  out += `${D}\nspincheck.app`;
  return out.trim();
}
