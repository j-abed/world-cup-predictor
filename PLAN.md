# World Cup Predictor — Burn-down Plan

Track progress here. Check items off as they ship.

**Last updated:** 2026-06-27

---

## Progress summary

| Phase | Done | Total | Status |
|-------|------|-------|--------|
| 0 — Foundation | 4 | 4 | ✅ Complete |
| 1 — Automation | 3 | 3 | ✅ Complete |
| 2 — Data/UI gaps | 7 | 7 | ✅ Complete |
| 3 — Model | 5 | 5 | ✅ Complete |
| 4 — UX polish | 5 | 5 | ✅ Complete |
| 5 — Stretch | 3 | 5 | 🟡 In progress |
| 6 — Dashboard intelligence | 7 | 7 | ✅ Complete |

**Overall: 34 / 36** actionable items complete.

---

## Phase 0 — Foundation ✅

- [x] pytest suite (tiebreakers, bracket, simulations, web exports)
- [x] Zod validation in `loadAppState()`
- [x] README updated (architecture, tests, deploy)
- [x] `refresh_and_deploy.sh` tracked in repo

---

## Phase 1 — Automation ✅

**Goal:** Site updates after matches without manual steps.

- [x] GitHub Action: `.github/workflows/refresh-data.yml`
- [x] Pipeline: ESPN sync → model → export → pytest → commit
- [x] **Auto-deploy on push** — `.github/workflows/deploy-frontend.yml` + Vercel secrets via `scripts/setup_github_vercel_secrets.sh`
  - *Acceptance:* push to `main` deploys without `npx vercel --prod`
  - *Alternative to Vercel Git:* GitHub Actions deploy (documented in README)

---

## Phase 2 — Data/UI gaps ✅

**Goal:** Show everything the model already computes.

- [x] Coverage banner (match progress in header)
- [x] Fixtures & Results tab
- [x] URL state (`?tab=fixtures&team=BRA`)
- [x] **2.1 Projected R32 field view** — `ProjectedField.tsx`
- [x] **2.2 All-group finish odds** — `odds.group_finish` keyed by group letter
- [x] **2.3 Bracket probability labels** — reach-round vs win-match semantics in `BracketView.tsx`
- [x] **2.4 OG meta tags** — title, description, `og:image`

---

## Phase 3 — Model ✅

- [x] **3.1 Deduplicate simulation code**
- [x] **3.2 Calibrate rating → goals**
- [x] **3.3 Post-match rating updates** (`--update-ratings`, `data/ratings_applied_matches.csv`)
- [x] **3.4 Knockout ET + penalties model**
- [x] **3.5 Real fair-play data** (`--update-fair-play`, ESPN card sync)

---

## Phase 4 — UX polish ✅

- [x] **4.1 Mobile bracket** — vertical round-by-round layout below `sm`
- [x] **4.2 Keyboard accessibility** — focusable rows in `QualificationOdds`, `GroupStandings`
- [x] **4.3 Error boundary** — per-tab recovery UI
- [x] **4.4 Dark mode** — `prefers-color-scheme` → `.dark` tokens
- [x] **4.5 Relative timestamps** — “Updated 2 hours ago” in Header

---

## Phase 5 — Stretch / backlog

- [x] Scenario mode (“what if Brazil wins 3-0?”)
- [x] Historical backtest page (2022 model vs actual)
- [ ] Model vs betting markets comparison
- [ ] Serverless scenario API (on-demand sim)
- [x] JSON on CDN (faster refresh without full redeploy)

---

## Phase 6 — Dashboard intelligence ✅

**Goal:** Surface tournament context, model trust signals, and run-over-run movement in the header and champion/bracket views.

- [x] **6.1** Run-over-run deltas (`movement` block, biggest movers, top-3 champion changes)
- [x] **6.2** Next refresh countdown (`metadata.next_refresh_at`)
- [x] **6.3** Days to final (`live_context.days_to_final`, `data/tournament_schedule.json`)
- [x] **6.4** Live / next match (ESPN in-progress sync + header banner)
- [x] **6.5** Path difficulty for top 3 title favorites
- [x] **6.6** Model confidence score (`model_quality`)
- [x] **6.7** Live accuracy scaffold (`live_accuracy`, active once knockout data exists)

---

## Suggested next steps

Phases 0–4 are complete. During the tournament, rely on automation:

```
Ops (automatic)
  ✓ refresh-data.yml every 2h (Jun 11 – Jul 20, 2026)
  ✓ deploy-frontend.yml on push

Optional stretch (Phase 5)
  ✓ Scenario mode
  ✓ 2022 backtest page
  ✓ JSON on CDN support
  □ Model vs betting markets
  □ Serverless scenario API
```

---

## Quick commands

```bash
# Full verify before shipping
uv run pytest && cd frontend && npm run lint && npm run build

# Manual refresh + deploy
./refresh_and_deploy.sh

# Trigger GitHub Action manually
gh workflow run refresh-data.yml && gh run watch
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `README.md` | Setup, scripts, automation, deploy |
| `DATA_STATUS.md` | CSV inputs, JSON exports, model caveats |
| `frontend/README.md` | Dashboard dev, tabs, component map |
| `data/ratings_source_notes.md` | Rating source choices |

---

## Out of scope (for now)

- Live WebSocket updates
- User accounts / personal brackets
- Full backend API
- Betting integration (comparison tab is stretch; not live odds feed)

---

## Principles

1. **Freshness before sophistication** — automated refresh beats a better model if results are stale.
2. **Test the logic you fear changing** — tiebreakers, permutations, bracket resolution.
3. **Ship data you already compute** — don't let exported fields sit unused.
4. **Minimize scope per item** — each checkbox should be deployable on its own.
