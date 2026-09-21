/**
 * GA4 Measurement Protocol — server-side event sender.
 *
 * The site itself is static, so everything users do in the browser is already
 * reported by gtag.js. This module exists for the events a browser cannot be
 * trusted to send: anything confirmed by a server after the tab is gone
 * (payment/subscription webhooks, refunds), and anything produced by a
 * scheduled job that has no browser at all.
 *
 * Two rules shape the whole file:
 *   1. Credentials come from the environment, never from source. The API
 *      secret is a write credential for the property — committing it would
 *      let anyone forge our analytics.
 *   2. Nothing here ever throws into a caller. Analytics is attached to
 *      business logic (a confirmed payment, a delivered newsletter); an
 *      analytics outage must never roll one of those back. Failures are
 *      logged and swallowed, and every function resolves to a result object.
 */

const MP_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
// Same query params and body as the live endpoint, but it validates instead of
// ingesting. Use it in tests and dry runs — the live endpoint answers 204 to
// almost anything, including malformed events, so it cannot tell you you're wrong.
const MP_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';
const DEFAULT_TIMEOUT_MS = 5000;

function readCredentials() {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MP_API_SECRET;
  if (!measurementId || !apiSecret) {
    return { ok: false, reason: 'missing_credentials' };
  }
  return { ok: true, measurementId, apiSecret };
}

/**
 * Pull the GA client_id out of a `_ga` cookie.
 *
 * GA writes `_ga=GA1.1.1234567890.1700000000`; the client_id is the last two
 * dot-separated fields (`1234567890.1700000000`), not the whole value. Sending
 * the raw cookie instead produces events GA4 accepts but attributes to a
 * session nobody else shares, which is worse than not sending them.
 *
 * Accepts either a full Cookie header or a bare `_ga` value.
 */
export function clientIdFromGaCookie(cookie) {
  if (typeof cookie !== 'string' || !cookie) return null;
  const match = cookie.match(/(?:^|;\s*)_ga=([^;]+)/) || [null, cookie];
  const value = (match[1] || '').trim();
  const parts = value.split('.');
  if (parts.length < 4) return null;
  const clientId = parts.slice(-2).join('.');
  return /^\d+\.\d+$/.test(clientId) ? clientId : null;
}

/**
 * Last-resort client_id for events that have no browser behind them at all
 * (a cron job, a webhook where the cookie was never captured).
 *
 * These events land in GA4 as their own synthetic "user" and will not join up
 * with any real session — that is a reporting compromise, not a bug. Thread a
 * real client_id through from the browser whenever one exists.
 */
export function generateFallbackClientId() {
  const random = Math.floor(Math.random() * 1e10);
  return `${random}.${Math.floor(Date.now() / 1000)}`;
}

/**
 * GA4 accepts Measurement Protocol events without `session_id` or
 * `engagement_time_msec` — the validation endpoint reports no problem — and
 * then quietly fails to attribute them to a session, so they never surface in
 * DebugView or realtime and land oddly in reports. Both params are therefore
 * defaulted here rather than left to each caller to remember.
 *
 * A caller that has the browser's real session id (the `_ga_<CONTAINER>` cookie)
 * should pass it through as `session_id`, so the server event joins the session
 * the user was actually in instead of opening a synthetic one.
 */
function withSessionParams(params) {
  const merged = { ...params };
  if (merged.session_id === undefined) merged.session_id = String(Math.floor(Date.now() / 1000));
  if (merged.engagement_time_msec === undefined) merged.engagement_time_msec = '1';
  return merged;
}

function normaliseEvents(events) {
  const list = Array.isArray(events) ? events : [events];
  return list
    .filter((event) => event && typeof event.name === 'string' && event.name)
    .map((event) => ({ name: event.name, params: withSessionParams(event.params || {}) }));
}

/**
 * Send one or more events to GA4.
 *
 * @param {object} options
 * @param {string} options.clientId  Required. The browser's GA client_id — from
 *   the `_ga` cookie server-side, or passed up by the page. Use
 *   generateFallbackClientId() only when there genuinely is no browser.
 * @param {string} [options.userId]  Optional stable internal user id. Must be an
 *   opaque identifier; GA4's terms forbid email, phone, or name here.
 * @param {object|object[]} options.events  `{ name, params }`, or an array of them.
 * @param {boolean} [options.debug]  Send to the validation endpoint instead, and
 *   return Google's validationMessages rather than ingesting the event.
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ok: boolean, reason?: string, status?: number, validationMessages?: object[]}>}
 *   Always resolves. Never rejects.
 */
export async function sendGa4Event({ clientId, userId, events, debug = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  try {
    const credentials = readCredentials();
    if (!credentials.ok) {
      // Not an error worth shouting about: local builds and PR checks run
      // without the secret on purpose, and analytics is optional there.
      console.warn('[ga4-mp] GA4_MEASUREMENT_ID / GA4_MP_API_SECRET not set — event not sent');
      return { ok: false, reason: 'missing_credentials' };
    }
    if (!clientId || typeof clientId !== 'string') {
      console.warn('[ga4-mp] client_id is required — event not sent');
      return { ok: false, reason: 'missing_client_id' };
    }

    const payloadEvents = normaliseEvents(events);
    if (!payloadEvents.length) {
      console.warn('[ga4-mp] no valid events supplied — nothing sent');
      return { ok: false, reason: 'no_events' };
    }

    const body = { client_id: clientId, events: payloadEvents };
    if (userId) body.user_id = String(userId);

    const url = `${debug ? MP_DEBUG_URL : MP_COLLECT_URL}?measurement_id=${encodeURIComponent(credentials.measurementId)}&api_secret=${encodeURIComponent(credentials.apiSecret)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (debug) {
      // The debug endpoint answers 200 with a body even when the event is
      // rejected, so an empty validationMessages array is the only real pass.
      const result = await response.json().catch(() => ({}));
      const messages = result.validationMessages || [];
      if (messages.length) console.warn('[ga4-mp] validation failed', JSON.stringify(messages));
      return { ok: messages.length === 0, status: response.status, validationMessages: messages };
    }

    // The live endpoint returns 204 with no body on success and does not
    // report event-level problems — that is what the debug endpoint is for.
    if (!response.ok) {
      console.warn(`[ga4-mp] GA4 responded ${response.status} — event dropped`);
      return { ok: false, reason: 'http_error', status: response.status };
    }
    return { ok: true, status: response.status };
  } catch (error) {
    console.warn('[ga4-mp] send failed:', error && error.message ? error.message : error);
    return { ok: false, reason: 'exception' };
  }
}

/**
 * Convenience wrapper for a server-confirmed purchase.
 *
 * The event name is `purchase`, not `in_app_purchase`: the latter is a reserved
 * GA4 name (it is auto-collected on app streams) and the Measurement Protocol
 * rejects it outright on a web stream with NAME_RESERVED — verified against the
 * validation endpoint, which is the only thing that surfaces that error. If you
 * need a different name, run it past `--debug` before shipping.
 *
 * Kept separate so the name and the required params live in one place: GA4
 * silently drops `value` if `currency` is missing, and a purchase without a
 * transaction_id cannot be de-duplicated against the client-side event.
 */
export async function sendPurchaseEvent({ clientId, userId, value, currency = 'USD', transactionId, params = {}, debug = false } = {}) {
  return sendGa4Event({
    clientId,
    userId,
    debug,
    events: {
      name: 'purchase',
      params: { value, currency, transaction_id: transactionId, ...params },
    },
  });
}
