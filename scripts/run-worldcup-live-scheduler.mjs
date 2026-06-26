import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const scheduleFile = process.env.WORLD_CUP_SCHEDULE_FILE || process.env.WORLD_CUP_STATS_OUTPUT || join(root, 'api', 'world-cup-2026.json');
const updateScript = process.env.WORLD_CUP_UPDATE_SCRIPT || join(root, 'scripts', 'update-worldcup-stats.mjs');
const dailyLimit = Number(process.env.WORLD_CUP_DAILY_REQUEST_LIMIT || 100);
const requestsPerTick = Number(process.env.WORLD_CUP_REQUESTS_PER_TICK || 1);
const matchWindowMinutes = Number(process.env.WORLD_CUP_MATCH_WINDOW_MINUTES || 135);
const minIntervalMs = Number(process.env.WORLD_CUP_MIN_INTERVAL_MS || 60_000);
const printOnly = process.env.WORLD_CUP_SCHEDULER_PRINT === '1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1_000, ms)));

function nowDate() {
  return process.env.WORLD_CUP_SCHEDULER_NOW ? new Date(process.env.WORLD_CUP_SCHEDULER_NOW) : new Date();
}

async function readSchedule() {
  const data = JSON.parse(await readFile(scheduleFile, 'utf8'));
  return []
    .concat(Array.isArray(data.fixtures) ? data.fixtures : [])
    .concat(Array.isArray(data.live) ? data.live : [])
    .concat(Array.isArray(data.recent) ? data.recent : [])
    .filter((item) => item?.date);
}

function dayBounds(date) {
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return { start, end: start + 24 * 60 * 60 * 1000 };
}

function fixtureWindowsForDay(fixtures, date) {
  const { start: dayStart, end: dayEnd } = dayBounds(date);
  const windowMs = matchWindowMinutes * 60 * 1000;
  return fixtures
    .map((fixture) => {
      const start = new Date(fixture.date).getTime();
      const end = start + windowMs;
      return {
        start: Math.max(start, dayStart),
        end: Math.min(end, dayEnd),
        fixture
      };
    })
    .filter((window) => Number.isFinite(window.start) && Number.isFinite(window.end) && window.end > window.start);
}

function mergeWindows(windows) {
  const sorted = windows.slice().sort((a, b) => a.start - b.start);
  const merged = [];
  for (const window of sorted) {
    const last = merged.at(-1);
    if (!last || window.start > last.end) {
      merged.push({ start: window.start, end: window.end });
    } else {
      last.end = Math.max(last.end, window.end);
    }
  }
  return merged;
}

function todayPlan(fixtures, date) {
  const sourceWindows = fixtureWindowsForDay(fixtures, date);
  const windows = mergeWindows(sourceWindows);
  const totalLiveMs = windows.reduce((sum, window) => sum + window.end - window.start, 0);
  const maxTicks = Math.max(1, Math.floor(dailyLimit / Math.max(1, requestsPerTick)));
  const intervalMs = Math.max(minIntervalMs, Math.ceil(totalLiveMs / maxTicks));
  const now = date.getTime();
  const activeWindow = windows.find((window) => now >= window.start && now < window.end) || null;
  const nextWindow = windows.find((window) => window.start > now) || null;

  return {
    date: date.toISOString(),
    active: Boolean(activeWindow),
    activeWindow,
    nextWindow,
    windows,
    sourceWindowCount: sourceWindows.length,
    mergedWindowCount: windows.length,
    totalLiveMinutes: Math.round(totalLiveMs / 60_000),
    maxTicks,
    intervalMs,
    intervalSeconds: Math.ceil(intervalMs / 1000)
  };
}

function nextKnownWindow(fixtures, date) {
  const now = date.getTime();
  return fixtures
    .map((fixture) => ({ start: new Date(fixture.date).getTime(), fixture }))
    .filter((item) => Number.isFinite(item.start) && item.start > now)
    .sort((a, b) => a.start - b.start)[0] || null;
}

function updateDateForApi(date) {
  return date.toISOString().slice(0, 10);
}

function runUpdater(date) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [updateScript], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        WORLD_CUP_UPDATE_DATE: updateDateForApi(date)
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`World Cup updater exited with code ${code}`));
    });
  });
}

function logPlan(plan) {
  console.log(JSON.stringify({
    now: plan.date,
    active: plan.active,
    totalLiveMinutes: plan.totalLiveMinutes,
    dailyLimit,
    requestsPerTick,
    maxTicks: plan.maxTicks,
    intervalSeconds: plan.intervalSeconds,
    sourceWindowCount: plan.sourceWindowCount,
    mergedWindowCount: plan.mergedWindowCount,
    windows: plan.windows.map((window) => ({
      start: new Date(window.start).toISOString(),
      end: new Date(window.end).toISOString()
    })),
    nextWindow: plan.nextWindow ? new Date(plan.nextWindow.start).toISOString() : null
  }, null, 2));
}

while (true) {
  const fixtures = await readSchedule();
  const now = nowDate();
  const plan = todayPlan(fixtures, now);

  if (printOnly) {
    logPlan(plan);
    process.exit(0);
  }

  if (!plan.windows.length) {
    const next = nextKnownWindow(fixtures, now);
    const waitMs = next ? Math.min(next.start - now.getTime(), 60 * 60 * 1000) : 60 * 60 * 1000;
    console.log(`No live World Cup windows today. Sleeping ${Math.ceil(waitMs / 60_000)} min.`);
    await sleep(waitMs);
    continue;
  }

  if (!plan.active) {
    const waitMs = plan.nextWindow ? plan.nextWindow.start - now.getTime() : dayBounds(now).end - now.getTime() + 1_000;
    console.log(`Outside live match window. Sleeping ${Math.ceil(waitMs / 60_000)} min.`);
    await sleep(waitMs);
    continue;
  }

  logPlan(plan);
  try {
    await runUpdater(now);
  } catch (error) {
    console.error(error);
  }

  const remainingWindowMs = plan.activeWindow.end - now.getTime();
  await sleep(Math.min(plan.intervalMs, remainingWindowMs + 1_000));
}
