import { NextRequest } from 'next/server';
import {
  client,
  FAST_MODEL,
  READING_SYSTEM_PROMPT,
  stripJsonFences,
} from '@/lib/claude';

export const maxDuration = 30;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface ReadingRequest {
  topic: string;
  direction: 'left' | 'right' | 'none';
  summary?: string;
}

export async function POST(request: NextRequest) {
  let body: ReadingRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.topic || body.topic.trim().length < 3) {
    return new Response(JSON.stringify({ success: false, error: 'Topic required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userMessage = [
    `Topic: ${body.topic}`,
    `Article bias direction: ${body.direction}`,
    body.summary ? `Article context: ${body.summary}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const message = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: 600,
      system: READING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(stripJsonFences(raw));

    return new Response(JSON.stringify({ success: true, data: parsed.furtherReading || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reading recommendation error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch reading suggestions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
