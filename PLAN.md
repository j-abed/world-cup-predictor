# World Cup Predictor — Burn-down Plan

Track progress here. Check items off as they ship.

**Last updated:** 2026-06-27

---

## Progress summary

| Phase | Done | Total | Status |
|-------|------|-------|--------|
| 0 — Foundation | 4 | 4 | ✅ Complete |
| 1 — Automation | 2 | 3 | 🟡 In progress |
| 2 — Data/UI gaps | 6 | 7 | 🟡 In progress |
| 3 — Model | 0 | 5 | ⬜ Not started |
| 4 — UX polish | 0 | 5 | ⬜ Not started |
| 5 — Stretch | 0 | 5 | ⬜ Backlog |

**Overall: 12 / 29** actionable items complete.

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
- [ ] **Vercel Git integration** — link repo, Root Directory = `frontend` (or use root `vercel.json`)
  - *Acceptance:* push to `main` deploys without `npx vercel --prod`
  - *Where:* [vercel.com](https://vercel.com) → Import `j-abed/world-cup-predictor`
  - *Note:* `vercel.json` at repo root is configured for monorepo deploy

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

- [ ] **2.4 OG meta tags**
  - Title, description, `og:image` for sharing champion odds
  - *Files:* `frontend/index.html` or Vite meta plugin
  - *Acceptance:* link preview looks good in iMessage/Slack/Twitter

---

## Phase 3 — Model improvements

**Goal:** More credible probabilities.

- [ ] **3.1 Deduplicate simulation code**
  - Single group-stage path for `simulator.py`, `tournament.py`, `knockout.py`
  - Remove dead `simulate_group_stage_once` in `knockout.py`
  - *Acceptance:* one function used by tournament + knockout; tests still pass

- [ ] **3.2 Calibrate rating → goals**
  - Backtest `rating_to_expected_goal_diff` against 2018/2022 group stages
  - Document chosen divisor in `DATA_STATUS.md`
  - *Acceptance:* written calibration note + updated constant

- [ ] **3.3 Post-match rating updates**
  - Elo-style step after each ESPN sync (optional toggle)
  - *Acceptance:* `ratings.csv` updates when results sync runs

- [ ] **3.4 Knockout ET + penalties model**
  - Separate from group-stage Poisson; replace rating coin-flip on draws
  - *Acceptance:* documented model; knockout sim uses distinct logic

- [ ] **3.5 Real fair-play data**
  - Replace placeholders in `fair_play.csv` with card data
  - *Acceptance:* tiebreakers use real conduct scores where available

---

## Phase 4 — UX polish

- [ ] **4.1 Mobile bracket** — vertical round-by-round layout below `sm`
- [ ] **4.2 Keyboard accessibility** — table rows in `QualificationOdds`, `GroupStandings` focusable/activatable
- [ ] **4.3 Error boundary** — catch render errors per tab, show recovery UI
- [ ] **4.4 Dark mode** — wire `prefers-color-scheme` to existing `.dark` tokens
- [ ] **4.5 Relative timestamps** — "Updated 2 hours ago" in Header

---

## Phase 5 — Stretch / backlog

- [ ] Scenario mode ("what if Brazil wins 3-0?")
- [ ] Model vs betting markets comparison
- [ ] Historical backtest page (2022 model vs actual)
- [ ] Serverless scenario API (on-demand sim)
- [ ] JSON on CDN (faster refresh without full redeploy)

---

## Suggested sprint order

If you're burning down during the tournament:

```
Week 1 (ops + visibility)
  □ 1.3 Vercel Git integration
  □ 2.1 Projected R32 field
  □ 2.2 All-group finish odds

Week 2 (clarity + shareability)
  □ 2.3 Bracket probability labels
  □ 2.4 OG meta tags
  □ 4.5 Relative timestamps

Week 3 (model trust)
  □ 3.1 Deduplicate simulation
  □ 3.2 Calibrate rating → goals

Ongoing / when time allows
  □ Phase 4 UX items
  □ Phase 5 stretch
```

---

## Quick commands

```bash
# Verify before shipping
uv run pytest && cd frontend && npm run build

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
