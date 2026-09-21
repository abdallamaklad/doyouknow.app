#!/usr/bin/env node
/**
 * Manual check for the GA4 Measurement Protocol utility.
 *
 *   node scripts/ga4-mp-test.mjs              # validate only, ingests nothing
 *   node scripts/ga4-mp-test.mjs --live       # really send, tagged for DebugView
 *
 * Validation runs against https://www.google-analytics.com/debug/mp/collect,
 * which is the only endpoint that tells you an event is malformed — the live
 * one answers 204 to nearly anything. --live adds `debug_mode: true` so the
 * event surfaces in GA4 Admin → DebugView instead of only appearing in reports
 * a day later.
 *
 * Requires GA4_MEASUREMENT_ID and GA4_MP_API_SECRET in the environment.
 */
import { sendPurchaseEvent, generateFallbackClientId, clientIdFromGaCookie } from './lib/ga4-mp.mjs';

const live = process.argv.includes('--live');
const clientId = clientIdFromGaCookie(process.env.GA_CLIENT_COOKIE || '') || generateFallbackClientId();

const result = await sendPurchaseEvent({
  clientId,
  userId: process.env.GA4_TEST_USER_ID || 'test-user-0001',
  debug: !live,
  value: 4.99,
  currency: 'USD',
  transactionId: `mp-test-${Date.now()}`,
  // debug_mode is what makes a Measurement Protocol event visible in
  // GA4 Admin → DebugView; without it a live event only shows up in reports.
  params: live ? { debug_mode: true } : {},
});

console.log(JSON.stringify({ mode: live ? 'live' : 'validate', clientId, ...result }, null, 2));
process.exit(result.ok ? 0 : 1);
