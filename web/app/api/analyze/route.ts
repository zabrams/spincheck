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
import type { AnalyzeRequest, BiasAnalysis } from '@/types/analysis';

export const maxDuration = 60; // Vercel Pro: allow up to 60s for Sonnet

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

  const userMessage = buildUserMessage({
    content: body.content,
    title: body.title,
    url: body.url,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // First attempt — streaming, so the client gets progress updates
        const msgStream = client.messages.stream({
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

        // Phase detection — emit a phase event when Claude starts writing each major field.
        // Order matches the JSON schema order in SYSTEM_PROMPT.
        const PHASES = [
          { trigger: '"score"', name: 'assessing' },
          { trigger: '"analysis"', name: 'writing_analysis' },
          { trigger: '"framingEvidence"', name: 'gathering_evidence' },
          { trigger: '"omissionEvidence"', name: 'finding_omissions' },
          { trigger: '"furtherReading"', name: 'finding_sources' },
          { trigger: '"perspectives"', name: 'perspectives' },
          { trigger: '"commonGround"', name: 'common_ground' },
        ];
        let phaseIdx = -1;

        let accumulated = '';
        msgStream.on('text', (text) => {
          accumulated += text;

          // Advance through phases as their trigger strings appear
          while (
            phaseIdx + 1 < PHASES.length &&
            accumulated.includes(PHASES[phaseIdx + 1].trigger)
          ) {
            phaseIdx++;
            send({ type: 'phase', phase: PHASES[phaseIdx].name });
          }

          send({ type: 'progress' });
        });

        await msgStream.finalMessage();

        let analysis: BiasAnalysis;
        try {
          analysis = JSON.parse(stripJsonFences(accumulated)) as BiasAnalysis;
        } catch {
          // JSON malformed — retry once with stricter system prompt
          send({ type: 'progress' });
          analysis = (await retryAnalyze(userMessage)) as BiasAnalysis;
        }

        send({ type: 'result', data: analysis });
      } catch (err) {
        console.error('Analysis error:', err);
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'Analysis failed',
        });
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
