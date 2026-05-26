import { NextRequest } from 'next/server';
import { client, MODEL, SYSTEM_PROMPT, truncateContent } from '@/lib/claude';
import type { AnalyzeRequest, BiasAnalysis } from '@/types/analysis';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.content || body.content.trim().length < 100) {
    return new Response(
      JSON.stringify({ success: false, error: 'Article content must be at least 100 characters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const content = truncateContent(body.content);
  const userMessage = body.title
    ? `Article Title: ${body.title}\n\nArticle Content:\n${content}`
    : `Article Content:\n${content}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const msgStream = client.messages.stream({
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

        let accumulated = '';
        msgStream.on('text', (text) => {
          accumulated += text;
          send({ type: 'progress' });
        });

        await msgStream.finalMessage();

        const cleaned = accumulated
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
        const analysis = JSON.parse(cleaned) as BiasAnalysis;
        send({ type: 'result', data: analysis });
      } catch (err) {
        console.error('Analysis error:', err);
        send({ type: 'error', error: err instanceof Error ? err.message : 'Analysis failed' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  });
}
