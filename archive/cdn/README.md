# CDN data publish (archived)

**Status:** Archived — production uses **commit `app_state.json` + Vercel deploy** on push.

This folder keeps the optional S3/R2 publish path if you later want data refreshes without a full frontend redeploy.

## Why archived

- Adds bucket credentials, public URL wiring, and extra CI secrets
- Commit-and-deploy is sufficient for a ~500KB JSON snapshot refreshed every 2 hours
- R2/S3/Azure each need their own setup; we chose the simpler default

## What still works without CDN

1. `refresh-data.yml` exports `app_state.json` and commits it to `main`
2. `deploy-frontend.yml` redeploys Vercel on push
3. The frontend reads `/data/app_state.json` from the built site

The frontend still supports `VITE_APP_STATE_URL` if you set it manually — see `frontend/src/lib/dataUrls.ts`.

## Re-enabling CDN publish

### 1. Host `app_state.json`

Use Cloudflare R2, AWS S3, or similar. The publish script expects `aws s3 cp` (S3-compatible API).

### 2. Configure GitHub secrets

```bash
chmod +x archive/cdn/setup_cdn_secrets.sh
./archive/cdn/setup_cdn_secrets.sh
```

Secrets: `WEB_DATA_S3_URI`, `WEB_DATA_ACCESS_KEY_ID`, `WEB_DATA_SECRET_ACCESS_KEY`, `WEB_DATA_AWS_REGION`, optional `WEB_DATA_AWS_ENDPOINT_URL` (R2).

For live betting odds (separate from CDN), set `ODDS_API_KEY` via:

```bash
gh secret set ODDS_API_KEY --body "your-key"
```

### 3. Add the workflow step back

In `.github/workflows/refresh-data.yml`, after copying app state to the frontend:

```yaml
      - name: Publish app state to CDN (optional)
        if: steps.window.outputs.skip != 'true'
        env:
          WEB_DATA_S3_URI: ${{ secrets.WEB_DATA_S3_URI }}
          AWS_ACCESS_KEY_ID: ${{ secrets.WEB_DATA_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.WEB_DATA_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ${{ secrets.WEB_DATA_AWS_REGION }}
          AWS_ENDPOINT_URL: ${{ secrets.WEB_DATA_AWS_ENDPOINT_URL }}
        run: |
          chmod +x archive/cdn/publish_web_data.sh
          ./archive/cdn/publish_web_data.sh
```

### 4. Point Vercel at the public URL

```
VITE_APP_STATE_URL=https://your-cdn.example.com/app_state.json
```

Redeploy the frontend once. The app polls after each `metadata.next_refresh_at` when the URL is remote.

### Local test

```bash
export WEB_DATA_S3_URI=s3://your-bucket/world-cup-predictor
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=auto          # R2
export AWS_ENDPOINT_URL=https://...     # R2 only
./archive/cdn/publish_web_data.sh
```

## Scripts

| File | Purpose |
|------|---------|
| `publish_web_data.sh` | Upload `outputs/web/app_state.json` to S3/R2 |
| `setup_cdn_secrets.sh` | Interactive `gh secret set` for CDN + optional odds API |
