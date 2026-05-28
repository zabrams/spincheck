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
import { fetchAndExtract } from '@/lib/extract';
import { logApiError, getErrorResponse } from '@/lib/log';
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
  let body: AnalyzeRequest & { skipReading?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If a URL was provided without content, fetch and extract the article server-side.
  // Also detect when the "content" field is itself a URL (extension/shortcut behavior).
  let extractedTitle: string | undefined;
  const trimmedContent = (body.content ?? '').trim();
  const contentLooksLikeUrl =
    !!trimmedContent && /^https?:\/\/\S+$/i.test(trimmedContent) && trimmedContent.length < 2048;

  if ((!trimmedContent && body.url) || contentLooksLikeUrl) {
    const fetchUrl = contentLooksLikeUrl ? trimmedContent : body.url!;
    try {
      const extracted = await fetchAndExtract(fetchUrl);
      body.content = extracted.content;
      extractedTitle = extracted.title;
      body.url = fetchUrl;
    } catch (err) {
      logApiError({
        endpoint: 'analyze',
        err,
        context: { stage: 'fetchAndExtract', url: fetchUrl },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to fetch the article from that URL.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  if (!body.content || body.content.trim().length < 20) {
    return new Response(
      JSON.stringify({ success: false, error: 'Content must be at least 20 characters (a short tweet or longer).' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const skipReading = body.skipReading === true;

  const userMessage = buildUserMessage({
    content: body.content,
    title: body.title || extractedTitle,
    url: body.url,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // System prompt: keep the main one cached, append a skip-reading override
        // as a second (uncached) block when the caller doesn't want reading suggestions.
        // The split lets us still hit the cache on the long base prompt.
        const systemBlocks: Array<{
          type: 'text';
          text: string;
          cache_control?: { type: 'ephemeral' };
        }> = [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ];
        if (skipReading) {
          systemBlocks.push({
            type: 'text',
            text:
              'CRITICAL OVERRIDE FOR THIS REQUEST: OMIT the "furtherReading" field ' +
              'entirely from your JSON output. Do not generate any reading recommendations. ' +
              'The reader will request sources separately. Your JSON should be valid without ' +
              'that key present. All other fields exactly as specified.',
          });
        }

        const msgStream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemBlocks,
          messages: [{ role: 'user', content: userMessage }],
        });

        // Phase detection — emit a phase event when Claude starts writing each major field.
        // Order matches the JSON schema order in SYSTEM_PROMPT.
        // When skipReading is true, the finding_sources phase never fires; that's expected.
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
          send({ type: 'progress' });
          analysis = (await retryAnalyze(userMessage)) as BiasAnalysis;
        }

        // Ensure furtherReading is always an empty array if the caller skipped it
        // (even if Claude ignored the override and included it anyway)
        if (skipReading) {
          analysis.furtherReading = [];
        }

        send({ type: 'result', data: analysis });
      } catch (err) {
        logApiError({
          endpoint: 'analyze',
          err,
          context: {
            stage: 'claude',
            url: body.url,
            contentLength: body.content?.length,
            skipReading,
          },
        });
        const friendly = getErrorResponse(err);
        send({ type: 'error', error: friendly.text, code: friendly.code });
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
