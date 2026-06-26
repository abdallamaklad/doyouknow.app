# doyouknow.app

Fast, bilingual Arabic/English editorial site for UAE and Saudi audiences. The production artifact is static HTML, CSS, and JavaScript, designed for Nginx/CDN deployment with no runtime dependency.

## Local verification

```bash
npm run build
npm test
npm start
```

Open `http://127.0.0.1:4173`. English lives under `/en/`, Arabic under `/ar/` with native RTL layout.

## Deployment

1. Point the domain at the VPS.
2. Copy the repository's public files to `/var/www/doyouknow.app`.
3. Install `deploy/nginx.conf`, test Nginx, and issue a TLS certificate with Certbot.
4. Add `VPS_HOST`, `VPS_USER`, `VPS_PATH`, and `VPS_SSH_KEY` as GitHub Actions secrets for continuous deployment.

The current VPS uses Caddy in Docker alongside other applications. Its production site block is maintained in `deploy/Caddyfile.doyouknow`; mount `/var/www/doyouknow/current` at `/srv/doyouknow:ro` in the existing Caddy service.

## World Cup 2026 live updater

The live-score updater uses API-Sports/API-Football at `https://v3.football.api-sports.io`.

It is intentionally quota-safe for the 100-request limit:

- One updater tick makes one API request: `/fixtures?league=1&season=2026&date=YYYY-MM-DD`.
- The scheduler only runs ticks during known live-match windows.
- Live windows default to 135 minutes from kickoff and overlapping matches are merged.
- Frequency is calculated daily as `merged live window minutes ÷ 100`.
- If the API key is missing or the API fails, the updater leaves the last good JSON file untouched.

On the VPS, create `/etc/doyouknow/worldcup.env`:

```bash
APIFOOTBALL_KEY=replace_with_api_sports_key
```

Then install and start the scheduler:

```bash
cp /var/www/doyouknow/current/deploy/worldcup-live-scheduler.service /etc/systemd/system/worldcup-live-scheduler.service
systemctl daemon-reload
systemctl enable --now worldcup-live-scheduler
```

To inspect the calculated schedule without calling the API:

```bash
WORLD_CUP_SCHEDULER_PRINT=1 npm run worldcup:scheduler
```

Do not publish time-sensitive legal, health, finance, immigration, government-service, event, price, or travel content without a current editorial review against primary sources.

See [docs/strategy-review.md](docs/strategy-review.md) for the architecture and SEO reasoning, and [editorial-review.json](editorial-review.json) for pages held out of search until current-source review.
