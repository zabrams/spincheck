/**
 * Structured error logging for API routes.
 *
 * All errors are written to Vercel function logs prefixed with [API_ERROR],
 * making them easy to grep / filter from the Vercel dashboard.
 *
 * The 402 you saw from the Shortcut today, for example, would now log as:
 *   [API_ERROR] {"ts":"...","endpoint":"shortcut","name":"BadRequestError",
 *   "message":"...","status":402,"requestId":"...","upstream":{"type":"error",
 *   "error":{"type":"billing_error","message":"..."}},"contentLength":3421}
 *
 * Easy to see at a glance whether the failure was an Anthropic billing issue,
 * a rate limit, a timeout, a JSON parse error, etc.
 */

interface LogContext {
  endpoint: string;
  err: unknown;
  /** Free-form request metadata — keep small, no full article bodies. */
  context?: Record<string, unknown>;
}

/** Anthropic SDK errors expose these fields. */
interface AnthropicLikeError {
  status?: number;
  error?: unknown;
  headers?: Record<string, string>;
  request_id?: string;
}

function asAnthropicError(e: unknown): AnthropicLikeError | null {
  if (e && typeof e === 'object' && 'status' in e) {
    return e as AnthropicLikeError;
  }
  return null;
}

export function logApiError({ endpoint, err, context = {} }: LogContext): void {
  const record: Record<string, unknown> = {
    ts: new Date().toISOString(),
    endpoint,
    ...context,
  };

  if (err instanceof Error) {
    record.name = err.name;
    record.message = err.message;
    // Keep first 5 lines of stack — enough to identify where it threw
    if (err.stack) {
      record.stack = err.stack.split('\n').slice(0, 5).join(' | ');
    }
    const anth = asAnthropicError(err);
    if (anth) {
      if (anth.status !== undefined) record.status = anth.status;
      if (anth.error !== undefined) record.upstream = anth.error;
      const reqId =
        anth.request_id ||
        (anth.headers && (anth.headers['request-id'] || anth.headers['x-request-id']));
      if (reqId) record.requestId = reqId;
    }
  } else {
    record.raw = String(err);
  }

  console.error('[API_ERROR]', JSON.stringify(record));
}

/** What the API should respond with for a given error. */
export interface ErrorResponse {
  status: number;
  /** Plain text — used by shortcut + analyze-image. */
  text: string;
  /** Code for the JSON body of /api/analyze. */
  code: string;
}

/**
 * Convert an unknown error into a user-facing response.
 * Distinguishes Anthropic upstream errors (billing, rate-limit, etc.) so the
 * user gets a meaningful message instead of "Analysis failed."
 */
export function getErrorResponse(err: unknown): ErrorResponse {
  const anth = err && err instanceof Error ? asAnthropicError(err) : null;
  const status = anth?.status;

  if (status === 401 || status === 403) {
    return {
      status: 503,
      code: 'auth',
      text: 'SpinCheck server is misconfigured (API key invalid). Please report this.',
    };
  }
  if (status === 402) {
    return {
      status: 503,
      code: 'billing',
      text:
        'SpinCheck has temporarily run out of API credits. We have been notified — please try again later.',
    };
  }
  if (status === 429) {
    return {
      status: 429,
      code: 'rate_limit',
      text: 'Too many requests right now. Please wait a moment and try again.',
    };
  }
  if (status && status >= 500) {
    return {
      status: 502,
      code: 'upstream',
      text: 'Anthropic\'s service is having issues. Please try again in a minute.',
    };
  }

  // Generic — could be JSON parse failure, network issue, etc.
  const message = err instanceof Error ? err.message : 'Unknown error';
  return {
    status: 500,
    code: 'unknown',
    text: `Analysis failed: ${message}. Please try again.`,
  };
}
