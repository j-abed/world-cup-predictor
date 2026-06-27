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
| 5 — Stretch | 1 | 5 | 🟡 In progress |

**Overall: 26 / 29** actionable items complete. Remaining work is Phase 5 stretch only.

---

## Phase 0 — Foundation ✅

- [x] pytest suite (tiebreakers, bracket, simulations, web exports)
- [x] Zod validation in `loadAppState()`
- [x] README updated (architecture, tests, deploy)
- [x] `refresh_and_deploy.sh` tracked in repo

---

## Phase 1 — Automation

**Goal:** Site updates after matches without manual steps.

- [x] GitHub Action: `.github/workflows/refresh-data.yml`
- [x] Pipeline: ESPN sync → model → export → pytest → commit
- [x] **Auto-deploy on push** — `.github/workflows/deploy-frontend.yml` + Vercel secrets via `scripts/setup_github_vercel_secrets.sh`
  - *Acceptance:* push to `main` deploys without `npx vercel --prod`
  - *Alternative to Vercel Git:* GitHub Actions deploy (documented in README)

---

## Phase 2 — Data/UI gaps

**Goal:** Show everything the model already computes.

### Done
- [x] Coverage banner (match progress in header)
- [x] Fixtures & Results tab
- [x] URL state (`?tab=fixtures&team=BRA`)

### Next up (recommended order)

- [x] **2.1 Projected R32 field view**
  - Use existing `projected_qualifiers` from `app_state.json`
  - New component or section: 32-team knockout field with seed/source
  - *Files:* `ProjectedField.tsx`, `App.tsx`, `TabNav.tsx` (or section under Groups)
  - *Acceptance:* all 32 projected teams visible without inferring from bracket

- [x] **2.2 All-group finish odds**
  - Generalize Group D-only simulation to groups A–L
  - Rename `odds.group_d` → `odds.group_finish` (keyed by group letter)
  - Update `TeamDetail.tsx` for any team's group
  - *Files:* `export_web_state.py`, `web_exports.py`, `types.ts`, `schema.ts`, `team.ts`, `TeamDetail.tsx`
  - *Acceptance:* clicking any team shows 1st/2nd/3rd/4th finish odds for their group

- [x] **2.3 Bracket probability labels**
  - Clarify "reach round" vs "win this match" in `BracketView.tsx`
  - *Acceptance:* tooltip or subtitle makes semantics obvious

- [x] **2.4 OG meta tags**
  - Title, description, `og:image` for sharing champion odds
  - *Files:* `frontend/index.html` or Vite meta plugin
  - *Acceptance:* link preview looks good in iMessage/Slack/Twitter

---

## Phase 3 — Model ✅

- [x] **3.1 Deduplicate simulation code**
- [x] **3.2 Calibrate rating → goals**
- [x] **3.3 Post-match rating updates** (`--update-ratings`, `data/ratings_applied_matches.csv`)
- [x] **3.4 Knockout ET + penalties model**
- [x] **3.5 Real fair-play data** (`--update-fair-play`, ESPN card sync)

---

## Phase 4 — UX polish

- [x] **4.1 Mobile bracket** — vertical round-by-round layout below `sm`
- [x] **4.2 Keyboard accessibility** — table rows in `QualificationOdds`, `GroupStandings` focusable/activatable
- [x] **4.3 Error boundary** — catch render errors per tab, show recovery UI
- [x] **4.4 Dark mode** — wire `prefers-color-scheme` to existing `.dark` tokens
- [x] **4.5 Relative timestamps** — "Updated 2 hours ago" in Header

---

## Phase 5 — Stretch / backlog

- [x] Scenario mode ("what if Brazil wins 3-0?")
- [ ] Model vs betting markets comparison
- [x] Historical backtest page (2022 model vs actual)
- [ ] Serverless scenario API (on-demand sim)
- [ ] JSON on CDN (faster refresh without full redeploy)

---

## Suggested next steps

Phases 0–4 are complete. During the tournament, rely on automation:

```
Ops (automatic)
  ✓ refresh-data.yml every 2h
  ✓ deploy-frontend.yml on push

Optional stretch (Phase 5)
  ✓ Scenario mode
  ✓ 2022 backtest page
  □ Model vs betting markets
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

## Out of scope (for now)

- Live WebSocket updates
- User accounts / personal brackets
- Full backend API
- Betting integration

---

## Principles

1. **Freshness before sophistication** — automated refresh beats a better model if results are stale.
2. **Test the logic you fear changing** — tiebreakers, permutations, bracket resolution.
3. **Ship data you already compute** — don't let exported fields sit unused.
4. **Minimize scope per item** — each checkbox should be deployable on its own.
