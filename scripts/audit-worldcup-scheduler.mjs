import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url).pathname;
const tempDir = await mkdtemp(join(tmpdir(), 'wc-scheduler-'));
const scheduleFile = join(tempDir, 'world-cup-2026.json');

await writeFile(scheduleFile, JSON.stringify({
  fixtures: [
    { id: 'same-time-1', date: '2026-06-27T19:00:00.000Z', home: { name: 'A' }, away: { name: 'B' } },
    { id: 'same-time-2', date: '2026-06-27T19:00:00.000Z', home: { name: 'C' }, away: { name: 'D' } }
  ]
}, null, 2));

const result = spawnSync(process.execPath, [join(root, 'scripts', 'run-worldcup-live-scheduler.mjs')], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    WORLD_CUP_SCHEDULE_FILE: scheduleFile,
    WORLD_CUP_SCHEDULER_PRINT: '1',
    WORLD_CUP_SCHEDULER_NOW: '2026-06-27T19:22:00.000Z',
    WORLD_CUP_DAILY_REQUEST_LIMIT: '100',
    WORLD_CUP_REQUESTS_PER_TICK: '1',
    WORLD_CUP_MATCH_WINDOW_MINUTES: '135',
    WORLD_CUP_MIN_INTERVAL_MS: '60000'
  }
});

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  throw new Error(`World Cup scheduler dry run exited with ${result.status}`);
}

const plan = JSON.parse(result.stdout);
const errors = [];

if (plan.sourceWindowCount !== 2) errors.push(`expected 2 raw fixture windows, got ${plan.sourceWindowCount}`);
if (plan.mergedWindowCount !== 1) errors.push(`expected 1 merged live window for simultaneous games, got ${plan.mergedWindowCount}`);
if (plan.totalLiveMinutes !== 135) errors.push(`expected simultaneous games to count as 135 live minutes, got ${plan.totalLiveMinutes}`);
if (plan.intervalSeconds !== 81) errors.push(`expected 81-second interval for 135 minutes / 100 requests, got ${plan.intervalSeconds}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('World Cup scheduler audit passed: simultaneous games share one live window.');
