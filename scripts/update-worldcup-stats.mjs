import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const output = process.env.WORLD_CUP_STATS_OUTPUT || join(root, 'api', 'world-cup-2026.json');
const apiKey = process.env.APIFOOTBALL_KEY || process.env.API_FOOTBALL_KEY || '';
const baseUrl = process.env.APIFOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
const leagueId = Number(process.env.WORLD_CUP_LEAGUE_ID || 1);
const season = Number(process.env.WORLD_CUP_SEASON || 2026);
const updateDate = process.env.WORLD_CUP_UPDATE_DATE || new Date().toISOString().slice(0, 10);

const liveStatuses = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']);
const finishedStatuses = new Set(['FT', 'AET', 'PEN']);

async function readExisting() {
  try {
    return JSON.parse(await readFile(output, 'utf8'));
  } catch {
    return {
      status: 'seeded',
      provider: 'local',
      leagueId,
      season,
      updatedAt: new Date().toISOString(),
      message: 'Local fallback data. Waiting for API-Football live feed.',
      live: [],
      fixtures: [],
      recent: [],
      stats: null,
      standings: []
    };
  }
}

async function writeJson(data) {
  await mkdir(dirname(output), { recursive: true });
  const tmp = `${output}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, output);
}

async function api(path, params = {}) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      accept: 'application/json'
    }
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url.pathname}`);
  const data = await response.json();
  if (data?.errors && Object.keys(data.errors).length) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }
  return Array.isArray(data?.response) ? data.response : [];
}

function normalizeFixture(item) {
  const fixture = item.fixture || {};
  const teams = item.teams || {};
  const goals = item.goals || {};
  const league = item.league || {};
  const venue = fixture.venue || {};

  return {
    id: fixture.id,
    date: fixture.date,
    timestamp: fixture.timestamp,
    timezone: fixture.timezone,
    round: league.round || '',
    venue: [venue.name, venue.city].filter(Boolean).join(', '),
    status: {
      short: fixture.status?.short || '',
      long: fixture.status?.long || '',
      elapsed: fixture.status?.elapsed ?? null
    },
    home: {
      id: teams.home?.id,
      name: teams.home?.name || 'TBD',
      logo: teams.home?.logo || '',
      goals: goals.home
    },
    away: {
      id: teams.away?.id,
      name: teams.away?.name || 'TBD',
      logo: teams.away?.logo || '',
      goals: goals.away
    }
  };
}

function normalizeSeedFixture(item) {
  return {
    ...item,
    status: {
      short: item.status?.short || 'NS',
      long: item.status?.long || 'Not started',
      elapsed: item.status?.elapsed ?? null
    },
    home: {
      ...item.home,
      goals: item.home?.goals ?? null
    },
    away: {
      ...item.away,
      goals: item.away?.goals ?? null
    }
  };
}

function fixtureKey(item) {
  if (item?.id !== undefined && item?.id !== null && String(item.id).match(/^\d+$/)) return `api:${item.id}`;
  const date = item?.date || '';
  const home = item?.home?.name || '';
  const away = item?.away?.name || '';
  return `${date}|${home}|${away}`.toLowerCase();
}

function sortByDate(a, b) {
  return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
}

function mergeFixtures(existingItems = [], apiItems = []) {
  const merged = new Map();
  for (const item of existingItems.map(normalizeSeedFixture)) merged.set(fixtureKey(item), item);
  for (const item of apiItems) merged.set(fixtureKey(item), item);
  return Array.from(merged.values()).sort(sortByDate);
}

function isLive(item) {
  return liveStatuses.has(item?.status?.short);
}

function isFinished(item) {
  return finishedStatuses.has(item?.status?.short);
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = fixtureKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

if (!apiKey) {
  const existing = await readExisting();
  console.log(`Missing APIFOOTBALL_KEY/API_FOOTBALL_KEY. Leaving ${output} unchanged with ${existing.fixtures?.length || 0} fixtures.`);
  process.exit(0);
}

try {
  const existing = await readExisting();
  const raw = await api('/fixtures', { league: leagueId, season, date: updateDate });
  const today = raw.map(normalizeFixture);
  const mergedFixtures = mergeFixtures(existing.fixtures || [], today);
  const now = Date.now();

  const payload = {
    ...existing,
    status: 'ok',
    provider: 'api-football',
    leagueId,
    season,
    updatedAt: new Date().toISOString(),
    message: `Quota-safe update from ${baseUrl}. Used one fixtures request for ${updateDate}.`,
    live: today.filter(isLive),
    fixtures: mergedFixtures
      .filter((item) => !isFinished(item))
      .filter((item) => new Date(item.date || 0).getTime() >= now - 3 * 60 * 60 * 1000)
      .slice(0, 80),
    recent: dedupe(today.filter(isFinished).reverse().concat(existing.recent || [])).slice(0, 40),
    standings: existing.standings || [],
    stats: existing.stats || null
  };

  await writeJson(payload);
  console.log(`World Cup stats updated with 1 request: ${payload.live.length} live, ${payload.fixtures.length} scheduled/live, ${payload.recent.length} recent.`);
} catch (error) {
  console.error(error);
  console.error(`Leaving ${output} unchanged to preserve the last good/fallback data.`);
  process.exitCode = 1;
}
