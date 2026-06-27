# World Cup Predictor — Improvement Plan

Phased roadmap for reliability, freshness, and product polish during the 2026 tournament.

## Principles

1. **Freshness before sophistication** — automated data refresh beats a better model if results are stale.
2. **Test the logic you fear changing** — tiebreakers, permutations, and bracket resolution first.
3. **Ship data you already compute** — `coverage` and `projected_qualifiers` are exported but unused.
4. **Minimize scope per phase** — each phase should be deployable on its own.

---

## Phase 0 — Foundation ✅

**Goal:** Safe to change code without breaking production silently.

| Task | Status |
|------|--------|
| pytest + tests for tiebreakers, bracket, simulations | Done |
| Zod schema validation in `loadAppState()` | Done |
| Update README | Done |
| Track `refresh_and_deploy.sh` | Done |

**Acceptance:** `uv run pytest` passes; `npm run build` fails on malformed JSON.

---

## Phase 1 — Automation (workflow added, needs deploy hookup)

**Goal:** Site updates after matches without manual steps.

| Task | Status |
|------|--------|
| GitHub Action `refresh-data.yml` | Done |
| Pipeline (ESPN sync → model → export → commit) | Done |
| Deploy on push via Vercel Git integration | Pending — connect repo in Vercel dashboard |

---

## Phase 2 — Close data/UI gaps

**Goal:** Show everything the model already knows.

| Task | Files |
|------|-------|
| Coverage banner in Header | `Header.tsx` |
| Projected R32 field view | New `ProjectedField.tsx` |
| Fixtures & Results tab | Extend `web_exports.py`, new component |
| URL state (`?tab=groups&team=BRA`) | `App.tsx` |
| Generalize group finish odds (all 12 groups) | `export_web_state.py`, rename `group_d` → `group_finish` |
| Clarify bracket probability labels | `BracketView.tsx` |
| OG meta tags | `index.html` |

---

## Phase 3 — Model improvements

**Goal:** More credible probabilities.

| Priority | Task |
|----------|------|
| 1 | Deduplicate simulation code (`simulator.py`, `tournament.py`, `knockout.py`) |
| 2 | Calibrate `rating_to_expected_goal_diff` against 2018/2022 |
| 3 | Post-match rating updates in sync pipeline |
| 4 | Separate knockout ET + penalties model |
| 5 | Real fair-play data in `fair_play.csv` |

---

## Phase 4 — UX polish

- Mobile bracket (vertical layout below `sm`)
- Keyboard accessibility on clickable table rows
- Error boundary around tab content
- Dark mode via `prefers-color-scheme`
- Relative "last updated" time in Header

---

## Phase 5 — Stretch goals

- Scenario mode ("what if Brazil wins 3-0?")
- Model vs betting markets comparison
- Historical backtest page
- Serverless scenario API
- JSON on CDN for faster refresh without full redeploy

---

## Priority matrix

| If you care most about… | Start here |
|-------------------------|------------|
| Site stays current | Phase 1 |
| Confidence to change model | Phase 0 |
| User-facing impact quickly | Phase 2 (coverage + fixtures) |
| Prediction quality | Phase 3 |
| Shareability / mobile | Phase 2.5 + Phase 4 |

---

## Out of scope (for now)

- Live WebSocket updates
- User accounts / personal brackets
- Full backend API
- Betting integration
