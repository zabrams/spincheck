import { NextRequest } from 'next/server';

export const maxDuration = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return new Response(
    '⚖️ SpinCheck — Feedback API\n\n' +
    'POST { "vote": "up" | "down", "comment": "...", "url": "...", "title": "...", "analysis": {...}, "source": "web" | "extension" }\n\n' +
    'Logs structured feedback events to Vercel function logs (grep "[FEEDBACK]").',
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    }
  );
}

interface FeedbackBody {
  vote?: unknown;
  comment?: unknown;
  url?: unknown;
  title?: unknown;
  analysis?: unknown;
  source?: unknown;
}

export async function POST(request: NextRequest) {
  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate vote
  if (body.vote !== 'up' && body.vote !== 'down') {
    return new Response(
      JSON.stringify({ ok: false, error: 'vote must be "up" or "down"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Sanitize / cap field sizes
  const record = {
    ts: new Date().toISOString(),
    vote: body.vote as 'up' | 'down',
    comment: typeof body.comment === 'string' ? body.comment.slice(0, 2000) : undefined,
    url: typeof body.url === 'string' ? body.url.slice(0, 2048) : undefined,
    title: typeof body.title === 'string' ? body.title.slice(0, 500) : undefined,
    analysis: body.analysis ?? undefined,
    source: body.source === 'extension' ? 'extension' : 'web',
  };

  // Persist by writing to Vercel function logs with a distinctive prefix
  // so they're easy to grep / filter / export from the Vercel dashboard.
  // When you want to graduate to a real DB (Vercel KV, Postgres, Upstash),
  // add the write here — the API contract stays the same.
  console.log('[FEEDBACK]', JSON.stringify(record));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
