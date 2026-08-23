# Deletion-safe static release

The production deploy is a mirror, not an additive upload. `.github/workflows/deploy.yml` passes `--delete` to `easingthemes/ssh-deploy`, so an HTML or asset removed from the repository is also removed from `$VPS_PATH`. The existing `EXCLUDE` list is intentionally preserved; excluded operational files are not deleted by rsync.

## Release gate

A maintainer must review the diff and confirm that `VPS_PATH` points only at the doyouknow public document root before merging or manually dispatching the workflow. `VPS_HOST`, `VPS_USER`, `VPS_PATH`, and `VPS_SSH_KEY` are GitHub Actions secrets; this change does not grant or require local production credentials.

The normal release is:

```text
npm run build
npm test
git push origin main
```

A push to `main` runs `.github/workflows/deploy.yml`; the upload step is skipped if `VPS_HOST` is empty. Do not treat a green test job as proof of live deployment: after the workflow reports success, the auditor must fetch the production sitemap and every URL, and check the repaired footer/endpoints.

## Manual emergency release (human-approved only)

From a clean checkout, set the four deployment variables and inspect the deletion set first:

```bash
export VPS_HOST='host.example'
export VPS_USER='deploy-user'
export VPS_PATH='/var/www/doyouknow/current/'
export VPS_SSH_KEY="$HOME/.ssh/doyouknow-deploy"

rsync -rlptgoDz --delete --dry-run \
  --exclude='/.git/' --exclude='/.github/' --exclude='/scripts/' \
  --exclude='package.json' --exclude='package-lock.json' --exclude='README.md' \
  --exclude='/deploy/' --exclude='/docs/' --exclude='/marketing/' \
  --exclude='/research/' --exclude='/design/' \
  --exclude='editorial-review.json' \
  --exclude='seo-audit-report-2026-06-30.md' \
  --exclude='traffic-monetization-plan.md' \
  --exclude='MASTER_DOYOUKNOW_STRATEGY.md' --exclude='MARKETING_STRATEGY.md' \
  -e "ssh -i $VPS_SSH_KEY" ./ "$VPS_USER@$VPS_HOST:$VPS_PATH"
```

Review the dry-run deletions, then remove `--dry-run` and repeat the exact command. Finally run the full sitemap/footer verification against HTTPS production. Never run this command against a shared parent directory or an unreviewed `VPS_PATH`.
