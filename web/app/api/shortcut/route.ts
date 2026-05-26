import { NextRequest } from 'next/server';
import { client, MODEL, SYSTEM_PROMPT, truncateContent } from '@/lib/claude';
import type { BiasAnalysis } from '@/types/analysis';

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

  try {
    const body = await request.json();
    content = body.content ?? '';
    title = body.title;
  } catch {
    return new Response('Invalid request body', { status: 400, headers: corsHeaders });
  }

  if (!content || content.trim().length < 100) {
    return new Response('Article text must be at least 100 characters.', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const truncated = truncateContent(content);
  const userMessage = title
    ? `Article Title: ${title}\n\nArticle Content:\n${truncated}`
    : `Article Content:\n${truncated}`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
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
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const a = JSON.parse(cleaned) as BiasAnalysis;

    const text = formatForShortcut(a);
    return new Response(text, {
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
  const scoreLabel = `${scoreStr} · ${scoreLabels[a.score]}${dirLabel}`;

  const tags = [
    a.isEditorial ? '📝 Editorial' : '📰 Factual',
    a.presentsBothSides ? '✓ Balanced' : '✗ One-Sided',
    a.usesEmotionalLanguage ? '⚠ Emotional Language' : null,
    a.hasSelectiveSourcing ? '⚠ Selective Sourcing' : null,
    a.hasMisleadingHeadline ? '⚠ Misleading Headline' : null,
  ]
    .filter(Boolean)
    .join('  ');

  const divider = '─────────────────────';

  let out = `⚖️ SpinCheck\n${divider}\n`;
  out += `${scoreLabel}\n\n`;
  out += `${a.summary}\n\n`;
  out += `${tags}\n`;

  if (a.score > 0) {
    if (a.direction !== 'none') {
      out += `\n${divider}\n📰 ARTICLE'S VIEW\n${divider}\n`;
      out += `${a.perspectives.articleView}\n`;

      if (a.perspectives.opposingView) {
        out += `\n${divider}\n⚖️ OPPOSING VIEW\n${divider}\n`;
        out += `${a.perspectives.opposingView}\n`;
      }
    }

    if (a.furtherReading.length > 0) {
      out += `\n${divider}\n📚 FURTHER READING\n${divider}\n`;
      a.furtherReading.forEach((r, i) => {
        out += `${i + 1}. ${r.description}\n   Search: "${r.searchQuery}"\n\n`;
      });
    }
  }

  out += `${divider}\nspincheck.app`;
  return out.trim();
}
