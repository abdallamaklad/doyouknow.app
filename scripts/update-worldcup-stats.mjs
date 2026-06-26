import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const output = process.env.WORLD_CUP_STATS_OUTPUT || join(root, 'api', 'world-cup-2026.json');
const apiKey = process.env.APIFOOTBALL_KEY || process.env.API_FOOTBALL_KEY || '';
const baseUrl = process.env.APIFOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
const leagueId = Number(process.env.WORLD_CUP_LEAGUE_ID || 1);
const season = Number(process.env.WORLD_CUP_SEASON || 2026);

async function writeJson(data) {
  await mkdir(dirname(output), { recursive: true });
  const tmp = `${output}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, output);
}

function empty(status, message) {
  return {
    status,
    provider: 'api-football',
    leagueId,
    season,
    updatedAt: new Date().toISOString(),
    message,
    live: [],
    fixtures: [],
    recent: [],
    standings: []
  };
}

async function api(path, params = {}) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      'accept': 'application/json'
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

function normalizeStandings(response) {
  const groups = response?.[0]?.league?.standings || [];
  return groups.map((group) => group.map((row) => ({
    rank: row.rank,
    team: {
      id: row.team?.id,
      name: row.team?.name || '',
      logo: row.team?.logo || ''
    },
    points: row.points,
    goalsDiff: row.goalsDiff,
    form: row.form || '',
    played: row.all?.played,
    won: row.all?.win,
    drawn: row.all?.draw,
    lost: row.all?.lose,
    goalsFor: row.all?.goals?.for,
    goalsAgainst: row.all?.goals?.against,
    description: row.description || ''
  })));
}

if (!apiKey) {
  await writeJson(empty('missing_key', 'Missing APIFOOTBALL_KEY. Create an API-Football/API-Sports key, set it on the server, then run this script from cron.'));
  console.log(`World Cup stats placeholder written to ${output}`);
  process.exit(0);
}

try {
  const [liveRaw, upcomingRaw, recentRaw, standingsRaw] = await Promise.all([
    api('/fixtures', { live: 'all' }),
    api('/fixtures', { league: leagueId, season, next: 20 }),
    api('/fixtures', { league: leagueId, season, last: 20 }),
    api('/standings', { league: leagueId, season })
  ]);

  const live = liveRaw
    .filter((item) => Number(item?.league?.id) === leagueId && Number(item?.league?.season) === season)
    .map(normalizeFixture);

  const payload = {
    status: 'ok',
    provider: 'api-football',
    leagueId,
    season,
    updatedAt: new Date().toISOString(),
    message: '',
    live,
    fixtures: upcomingRaw.map(normalizeFixture),
    recent: recentRaw.map(normalizeFixture).reverse(),
    standings: normalizeStandings(standingsRaw)
  };

  await writeJson(payload);
  console.log(`World Cup stats updated: ${live.length} live, ${payload.fixtures.length} upcoming, ${payload.recent.length} recent.`);
} catch (error) {
  await writeJson(empty('error', error.message || String(error)));
  console.error(error);
  process.exitCode = 1;
}
