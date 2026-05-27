import { NextRequest } from 'next/server';
import {
  client,
  FAST_MODEL,
  FAST_MAX_TOKENS,
  SHORTCUT_SYSTEM_PROMPT,
  stripJsonFences,
} from '@/lib/claude';
import { formatForShortcut, type ShortcutAnalysis } from '@/lib/format';

export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Hard cap on incoming image size (post-base64). Claude vision works fine
// well below this; over ~5MB risks timeouts and high cost.
const MAX_IMAGE_BYTES_BASE64 = 7_000_000; // ~5MB of raw image

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
const VALID_MEDIA_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Detect image type from the first few base64 chars (magic bytes). */
function detectMediaType(b64: string): ImageMediaType {
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('R0lGOD')) return 'image/gif';
  if (b64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg'; // safe default — iOS screenshots are usually PNG, but JPEG is the most permissive
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const help = `⚖️ SpinCheck — Image Analysis API
─────────────────────────────────

POST a screenshot of a tweet, social post, headline, or paywalled article
and get a bias analysis. Useful when copy-paste isn't possible.

Body (JSON):
  { "image": "<base64-encoded image>" }
  or
  { "image": "data:image/png;base64,..." }

Optional: { "media_type": "image/png" }  (auto-detected if omitted)

Max image size: ~5MB.
Returns: plain-text bias analysis (same format as /api/shortcut).

For iOS Shortcuts: receive an image from the Share Sheet, base64-encode it,
POST here, then Show Content. See https://spincheck.app for setup help.`;

  return new Response(help, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  let body: { image?: string; media_type?: string };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid request body. Expected { "image": "<base64>" }.', {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!body.image) {
    return new Response('Missing "image" field (base64-encoded image).', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Accept either a raw base64 string or a data URL ("data:image/png;base64,...")
  let imageData = body.image.trim();
  let mediaType: ImageMediaType | undefined =
    body.media_type && (VALID_MEDIA_TYPES as string[]).includes(body.media_type)
      ? (body.media_type as ImageMediaType)
      : undefined;

  const dataUrlMatch = imageData.match(/^data:(image\/[a-z]+);base64,([\s\S]+)$/i);
  if (dataUrlMatch) {
    const matched = dataUrlMatch[1].toLowerCase();
    if ((VALID_MEDIA_TYPES as string[]).includes(matched)) {
      mediaType = matched as ImageMediaType;
    }
    imageData = dataUrlMatch[2];
  }

  // iOS Shortcuts' "Base64 Encode" action inserts newlines every 76 characters
  // (RFC 2045 compliance) — strip ALL whitespace before passing to Anthropic,
  // which rejects whitespace-laden base64 with "Invalid Base64 data".
  imageData = imageData.replace(/\s+/g, '');

  // Some encoders use URL-safe base64 (- and _) — convert back to standard.
  imageData = imageData.replace(/-/g, '+').replace(/_/g, '/');

  // Validate that what remains looks like base64 (only base64 chars + optional padding)
  if (!/^[A-Za-z0-9+/]+=*$/.test(imageData)) {
    return new Response(
      'The image data isn\'t valid base64. Make sure your Shortcut has a "Base64 Encode" step ' +
      'before the "Get Contents of URL" step, and its input is the screenshot itself.',
      { status: 400, headers: corsHeaders }
    );
  }

  if (imageData.length > MAX_IMAGE_BYTES_BASE64) {
    return new Response(
      'Image is too large. Try cropping the screenshot to just the tweet/post, or reduce resolution.',
      { status: 400, headers: corsHeaders }
    );
  }

  if (!mediaType) {
    mediaType = detectMediaType(imageData);
  }

  try {
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
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text' as const,
              text:
                'This image is a screenshot — most likely a tweet, social media post, ' +
                'news headline, paywalled article, or similar. ' +
                '\n\n' +
                'Step 1: Read the text content visible in the image. Note the author/handle/source ' +
                'if visible. If the image shows multiple posts, focus on the primary one (usually the largest/top).' +
                '\n\n' +
                'Step 2: Apply the bias-analysis framework above to that text. Use the tweet/short-post ' +
                'calibration if the visible text is brief (under ~1000 chars).' +
                '\n\n' +
                'If the image contains no readable text (e.g. a photo without captions), respond with score 0 ' +
                'and explain in the summary that no analyzable text was visible.',
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis = JSON.parse(stripJsonFences(raw)) as ShortcutAnalysis;

    return new Response(formatForShortcut(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('Image analysis error:', err);
    const message =
      err instanceof Error && err.message ? err.message : 'Analysis failed. Please try again.';
    return new Response(`Analysis failed: ${message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
