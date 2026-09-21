# Analytics (GA4)

Property: **Do You Know?** · web stream `https://www.doyouknow.app` · Measurement ID `G-6VQZY87LJB`.
Reporting Identity is set to **Blended**, so GA4 uses `user_id` automatically wherever one is present — no GA4-side configuration is needed to turn it on.

## Client side (gtag.js)

The gtag snippet is injected into every generated page by the `googleTag` template at the top of `scripts/prepare.mjs`, and duplicated by hand in the root `index.html`. **Change both together** — `scripts/audit.mjs` fails the build if a page is missing `G-6VQZY87LJB`.

All events go through one helper, `sendGA4Event()` in `assets/js/site.js`, which also exposes:

```js
window.dykAnalytics.track(name, params)   // send an event
window.dykAnalytics.setUserId(id)         // stitch sessions/devices for one person
window.dykAnalytics.clearUserId()         // on logout
```

### user_id

**Nothing calls `setUserId` today.** The site is static and has no accounts, so there is no logged-in user and no internal user id to send. The helpers exist as the single integration point for when that changes. Two ways to wire it:

- Define `window.DYK_USER_ID` before `site.js` loads (server-rendered page). It is applied before the first `page_view`, so that event carries it too.
- Call `window.dykAnalytics.setUserId(id)` after login, and `clearUserId()` on logout so later events are not misattributed to the previous reader.

Two things are deliberate and should not be "simplified":

- It uses `gtag('set', …)`, **not** a second `gtag('config', …)`. Re-running `config` for the same measurement ID fires another automatic `page_view` and would double-count every logged-in session.
- `setUserId` rejects anything containing `@`. GA4's terms forbid sending email, phone, or name as `user_id`; the guard means a future wiring mistake degrades to "no user_id" rather than shipping PII to Google.

## Server side (Measurement Protocol)

`scripts/lib/ga4-mp.mjs` sends events to GA4 from Node, for anything a browser cannot report reliably — a payment or subscription webhook that lands after the tab is closed, a refund, a scheduled job.

```js
import { sendPurchaseEvent, clientIdFromGaCookie, generateFallbackClientId } from './lib/ga4-mp.mjs';

await sendPurchaseEvent({
  clientId: clientIdFromGaCookie(req.headers.cookie) || generateFallbackClientId(),
  userId: 'u_9f3c21ab',          // optional, opaque internal id only
  value: 4.99,
  currency: 'USD',
  transactionId: 'txn_123',
});
```

It never throws — every function resolves to `{ ok, reason }`. Analytics must not be able to roll back the payment it is attached to.

**There is no purchase or subscription path in this repo to wire it into yet** (no payments, no backend — the site is a static tree served by Caddy). The utility is ready for the first one.

Things learned the hard way, all encoded in the module:

- The event name is `purchase`, **not** `in_app_purchase`. The latter is a reserved GA4 name and the Measurement Protocol rejects it with `NAME_RESERVED` on a web stream.
- `session_id` and `engagement_time_msec` are defaulted in. Without them GA4 accepts the event, reports no validation error, and then fails to attribute it — it never appears in DebugView or realtime.
- `client_id` is the last two dot-separated fields of the `_ga` cookie (`GA1.1.1234.5678` → `1234.5678`), not the whole cookie value.

### Testing

```sh
node scripts/ga4-mp-test.mjs          # validate only — ingests nothing
node scripts/ga4-mp-test.mjs --live   # really send, tagged for DebugView
```

Validation goes to `https://www.google-analytics.com/debug/mp/collect`, which is the **only** endpoint that reports a malformed event; the live endpoint answers `204` to almost anything. Always validate before shipping a new event name.

Live events carry `debug_mode: true`, which is what makes them visible in **GA4 Admin → Data display → DebugView**. An MP event appears under the Debug Device matching its `client_id`, so pass a real browser's `client_id` if you want it next to that user's client-side events.

## Environment variables

See `.env.example`.

| Variable | Secret? | Where it must be set |
|---|---|---|
| `GA4_MEASUREMENT_ID` | No (already public in every page) | Anywhere `scripts/lib/ga4-mp.mjs` runs |
| `GA4_MP_API_SECRET` | **Yes** — it authorises writing events into the property | Same |

Because no runtime path calls the utility yet, **nothing needs these set in production today**. When the first caller lands, set them wherever that caller runs:

- **VPS (systemd)** — add to the `[Service]` section of the relevant unit (`deploy/worldcup-live-scheduler.service` is the existing example), then `systemctl daemon-reload`.
- **GitHub Actions** — add `GA4_MP_API_SECRET` under repo Settings → Secrets, and expose it in the job's `env:` block like the existing `VPS_*` secrets in `.github/workflows/deploy.yml`.

Never commit the secret. `.env` is gitignored, and `.env*` is excluded from the rsync deploy so it cannot be served from the web root.
