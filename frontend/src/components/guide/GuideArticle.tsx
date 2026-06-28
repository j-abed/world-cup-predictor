import type { ReactNode } from "react";
import { dashboardPath } from "../../lib/guideRouting";
import type {
  GuideExportSnapshot,
  GuideLiveExamples,
  GuidePathHighlight,
} from "../../lib/guideStats";
import type { ModelQuality } from "../../types";
import { CurrentExportSummary } from "./CurrentExportSummary";
import {
  CodeBlock,
  GuideCompareTable,
  GuideDivider,
  GuideList,
  GuideMetricTable,
  GuideNote,
  GuideProse,
  GuideSection,
} from "./GuideSection";
import { InlineMath, MathBlock } from "./MathBlock";

interface GuideArticleProps {
  sims: number;
  snapshot: GuideExportSnapshot;
  live: GuideLiveExamples;
  pathHighlight: GuidePathHighlight | null;
  modelQuality: ModelQuality;
  dataCaveats: string[];
}

function simsLatex(count: number): string {
  return count > 0 ? count.toLocaleString().replace(/,/g, "{,}") : "10{,}000";
}

function GuideTabLink({
  tab,
  children,
}: {
  tab: string;
  children: ReactNode;
}) {
  return (
    <a href={dashboardPath(tab)} className="guide-link guide-link--inline">
      {children}
    </a>
  );
}

export function GuideArticle({
  sims,
  snapshot,
  live,
  pathHighlight,
  modelQuality,
  dataCaveats,
}: GuideArticleProps) {
  const simsLabel = sims > 0 ? sims.toLocaleString() : "10,000";
  const simsTex = simsLatex(sims);
  const { confidenceFormulaWeights: w } = snapshot;
  const r16Overlap = Math.round(modelQuality.backtest_round_of_16_overlap * 16);
  const confidenceDisplay = snapshot.projectionConfidence;

  const liveChampionLine =
    live.championTeam && live.championWins !== null && live.championPctLabel
      ? `${live.championTeam} wins the simulated tournament in ${live.championWins.toLocaleString()} of ${simsLabel} runs → ${live.championPctLabel} title probability.`
      : null;

  return (
    <article className="guide-article">
      {/* Tier 1 */}
      <GuideSection id="reading-the-projections" title="Reading the projections">
        <GuideProse>
          This dashboard is built around one fairly simple idea: instead of
          pretending we know how the rest of the World Cup will unfold, we replay
          the unfinished part of the tournament thousands of times and count what
          happens.
        </GuideProse>
        <GuideProse>
          That is really all the model is doing. It starts with the tournament as
          it currently stands — results already played, matches still remaining,
          team ratings, group tables, qualification rules — and simulates the rest{" "}
          <strong>{simsLabel} times</strong>.
        </GuideProse>
        <GuideNote title="Example (illustrative)">
          <GuideProse>
            If a team qualifies in 7,200 of {simsLabel} runs, the dashboard shows
            ~72% to qualify. If it wins the tournament in 1,400 runs, title
            probability is ~14%.
          </GuideProse>
        </GuideNote>
        {liveChampionLine ? (
          <GuideNote title="Live example (this export)">
            <GuideProse>
              <strong>{liveChampionLine}</strong> That does not mean{" "}
              {live.championTeam} is &ldquo;predicted&rdquo; to win — in most
              simulated worlds, someone else lifts the trophy.
            </GuideProse>
          </GuideNote>
        ) : null}
        <GuideProse>
          The most important thing to understand: percentages are{" "}
          <strong>simulated frequencies</strong>, not promises. Football is
          volatile — the simulator measures that chaos rather than smoothing it
          away.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="snapshot-versus-projection" title="Snapshot versus projection">
        <GuideCompareTable
          rows={[
            {
              label: "What it is",
              snapshot: "Table from completed matches only",
              projection: "Monte Carlo over remaining fixtures",
            },
            {
              label: "Where you see it",
              snapshot: "Groups tab standings",
              projection: "Qualification, bracket, champion odds",
            },
            {
              label: "Question it answers",
              snapshot: "Where are things now?",
              projection: "How often does this team get through from here?",
            },
          ]}
        />
        <GuideNote title="Third-place example">
          <GuideProse>
            Suppose a team sits <strong>#9 among third-place teams</strong> in
            today&apos;s table. They would <strong>not</strong> qualify if the
            group stage stopped now.
          </GuideProse>
          <GuideProse>They can still show strong knockout odds because:</GuideProse>
          <GuideList
            items={[
              "They may still finish 1st or 2nd in their group in many simulated paths.",
              "Even as a third-place team, remaining fixtures may lift them into the top eight third-place sides.",
              "A result in another group can move the third-place cutoff without those teams ever meeting.",
            ]}
          />
        </GuideNote>
        <GuideProse>
          Always ask: <strong>Is this number a snapshot or a projection?</strong>
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="how-to-read-dashboard" title="How to read the dashboard">
        <GuideList
          items={[
            <>
              <GuideTabLink tab="groups">Groups tab</GuideTabLink> — snapshot
              table (points, GD, who&apos;s above the line today).
            </>,
            <>
              <GuideTabLink tab="qualification">Qualification</GuideTabLink>,{" "}
              <GuideTabLink tab="field">Field</GuideTabLink>, or{" "}
              <GuideTabLink tab="bracket">Bracket</GuideTabLink> — projections
              after simulating remaining group games.
            </>,
            <>
              <GuideTabLink tab="champion">Champion tab</GuideTabLink> — title
              odds, path difficulty, movers since last export.
            </>,
            <>
              <GuideTabLink tab="markets">Markets tab</GuideTabLink> — model vs
              outright-winner prices (disagreement map, not picks).
            </>,
            <>
              After a match finishes — check <strong>Biggest movers</strong>; the
              team most helped may not have played.
            </>,
          ]}
        />
        <GuideProse>
          The simulator&apos;s job is not to make the World Cup predictable. It
          is to make the uncertainty easier to understand.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="what-this-site-is-and-is-not" title="What this site is — and is not">
        <GuideProse>
          This site is a Monte Carlo simulator for the 2026 World Cup — 48 teams,
          12 groups, third-place qualification, a Round of 32, and bracket
          placements that depend on which third-place teams advance.
        </GuideProse>
        <GuideProse>
          The simulator tracks those conditional paths mechanically: remaining
          fixtures, tiebreakers, bracket build, repeated trials, percentages.
        </GuideProse>
        <GuideProse>
          What the site does not do is just as important. It is not betting
          advice. It is not a live sportsbook or player-level scouting model. It
          does not know every injury, lineup, or tactical adjustment reflected in
          markets. It reflects the latest exported model state, not necessarily
          the exact live tournament at this instant.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      {/* Tier 2 */}
      <GuideSection id="what-the-model-is-trying-to-do" title="What the model is trying to do">
        <GuideProse>The model answers:</GuideProse>
        <MathBlock math="\text{If the rest of the tournament were replayed many times, how often would each outcome happen?}" />
        <MathBlock math="P(\text{outcome}) = \frac{\text{simulations where the outcome happened}}{\text{total simulations}}" />
        {live.championTeam && live.championWins !== null && live.championPctLabel ? (
          <GuideProse>
            <strong>This export:</strong> {live.championTeam}{" "}
            {live.championWins.toLocaleString()} / {simsLabel} ={" "}
            <strong>{live.championPctLabel}</strong> title probability.
          </GuideProse>
        ) : null}
      </GuideSection>

      <GuideDivider />

      <GuideSection id="the-data-flow" title="The data flow">
        <GuideProse>
          The dashboard is mostly a display layer. Simulations run offline; the
          site loads the latest export.
        </GuideProse>
        <CodeBlock>CSV data → Python simulator → app_state.json → dashboard</CodeBlock>
        <GuideProse>
          Teams, fixtures, results, ratings, fair-play scores, and market
          snapshots live in checked-in CSV files. The Python engine simulates,
          summarizes, and writes one JSON export that this React app validates
          and displays.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="why-monte-carlo" title="Why Monte Carlo simulation is useful here">
        <GuideProse>
          Every remaining match has many plausible scorelines affecting points,
          tiebreakers, third-place ranking, and bracket placement. Enumerating
          every branch is unwieldy; Monte Carlo samples from the tree instead.
        </GuideProse>
        <GuideProse>
          One run might have a favorite cruising; another the same favorite out
          on penalties. The answer is the distribution across all runs — which
          is why the dashboard can say a team usually qualifies but faces a hard
          title path.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="one-simulation" title="What happens in one simulation">
        <GuideProse>
          Completed results are locked in. The model simulates unfinished group
          fixtures, applies tiebreakers, ranks twelve third-place teams and
          advances eight, builds the Round of 32, and plays out knockouts to a
          champion.
        </GuideProse>
        <GuideProse>
          Each run records how far every team went. After {simsLabel} runs, those
          records become the percentages on the dashboard.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="why-10000-runs" title={`Why the model uses ${simsLabel} runs`}>
        <GuideProse>
          Small run counts are noisy. A common Monte Carlo sampling-error
          approximation is:
        </GuideProse>
        <MathBlock math="\text{standard error} \approx \sqrt{\frac{p(1-p)}{n}}" />
        <GuideProse>
          where <InlineMath math="p" /> is the estimated probability and{" "}
          <InlineMath math="n" /> is the number of simulations.
        </GuideProse>
        <GuideProse>
          For an event near 50%, {simsLabel} simulations typically yield sampling
          error on the order of half a percentage point — not model accuracy,
          just Monte Carlo stability.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="team-ratings" title="Team ratings">
        <GuideProse>
          A rating summarizes team strength. Higher-rated teams are favored but
          not guaranteed to win. Ratings update after real matches via an
          Elo-style rule.
        </GuideProse>
        <MathBlock math="E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}" />
        <MathBlock math="R_A' = R_A + K(S_A - E_A)" />
        <GuideProse>
          Here <InlineMath math="S_A" /> is 1 for a win, 0.5 for a draw, 0 for a
          loss. The model uses <InlineMath math="K = 40" /> (see{" "}
          <a href="#model-constants" className="guide-link guide-link--inline">
            model constants
          </a>
          ).
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="ratings-to-scores" title="Turning ratings into match scores">
        <GuideProse>
          The rating gap drives expected goals. A 100-point advantage maps to
          roughly 0.35 expected goals of margin on the calibrated scale:
        </GuideProse>
        <MathBlock math="\Delta = \frac{R_{\text{home}} - R_{\text{away}}}{285}" />
        <MathBlock math="\lambda_{\text{home}} = \max\left(0.2,\frac{2.6 + \Delta}{2}\right)" />
        <MathBlock math="\lambda_{\text{away}} = \max\left(0.2,\frac{2.6 - \Delta}{2}\right)" />
        <GuideProse>
          The 285-point scale maps roughly one expected goal per 285 rating
          points. A 2.6 total-goals baseline splits between teams using{" "}
          <InlineMath math="\Delta" />, with a 0.2 floor on each side&apos;s
          expected goals.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="drawing-scoreline" title="Drawing the scoreline">
        <MathBlock math="G_{\text{home}} \sim \text{Poisson}(\lambda_{\text{home}})" />
        <MathBlock math="G_{\text{away}} \sim \text{Poisson}(\lambda_{\text{away}})" />
        <MathBlock math="P(G = k) = \frac{e^{-\lambda}\lambda^k}{k!}" />
        <GuideProse>
          Poisson draws produce draws, upsets, and blowouts naturally — favorites
          are favored without being inevitable.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="group-tiebreakers" title="Group-stage standings and tiebreakers">
        <MathBlock math="\text{points} = 3W + D" />
        <MathBlock math="12 \times 2 = 24 \quad\text{auto qualifiers}\qquad 24 + 8 = 32" />
        <GuideProse>
          Top two per group plus eight best third-place teams fill the Round of
          32. When teams are level on points, FIFA-style tiebreakers apply in
          order:
        </GuideProse>
        <GuideList
          items={[
            "Goal difference, then goals scored.",
            "Head-to-head points, GD, and goals among tied teams.",
            "Fair-play conduct score (fewer cards is better, when synced).",
            "FIFA ranking as a last resort.",
          ]}
        />
      </GuideSection>

      <GuideDivider />

      <GuideSection id="third-place-race" title="The third-place race">
        <MathBlock math="P(\text{qualify}) = P(\text{finish 1st or 2nd}) + P(\text{finish 3rd and rank top 8})" />
        <GuideProse>
          Third-place teams compete across all groups. A late goal in one group
          can reshuffle the cutoff for teams that never meet — exactly the
          scenario the simulator is built to track.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="knockout-bracket" title="Building the knockout bracket">
        <GuideProse>
          Group winners and runners-up have fixed slots; third-place qualifiers
          map through the official 495-case permutation table. Two teams with
          similar qualification odds can have very different title paths depending
          on bracket placement.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="knockout-matches" title="Knockout matches">
        <MathBlock math="G_{\text{extra time}} = 0.35 \times G_{\text{regulation}}" />
        <MathBlock math="P(A \text{ advances}) = \frac{1}{1 + 10^{(R_B - R_A)/400}}" />
        <GuideProse>
          Regulation, reduced-intensity extra time, then rating-weighted penalty
          resolution — individual kicks are not modeled.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="counting-probabilities" title="Counting advancement probabilities">
        <MathBlock math={`\\frac{3{,}250}{${simsTex}} = 32.5\\%`} />
        <GuideProse>
          Deeper-round probabilities should generally decline — an ordering
          violation would signal a data or display bug.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="probability-swings" title="Why probabilities can swing after one match">
        <GuideProse>
          Late group-stage results have high leverage: points, tiebreakers,
          third-place rank, bracket slot, and opponents can all shift at once —
          sometimes for teams not even playing.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="model-constants" title="Model constants (reference)">
        <GuideProse>
          Key calibrated values used across the match and knockout engines:
        </GuideProse>
        <GuideList
          items={[
            <>
              <strong>K = 40</strong> — Elo-style post-match rating update factor.
            </>,
            <>
              <strong>285 rating points</strong> ≈ one expected goal of margin.
            </>,
            <>
              <strong>2.6 goals</strong> — baseline total scoring environment for
              group-stage matches.
            </>,
            <>
              <strong>0.2</strong> — minimum expected goals per team per match.
            </>,
            <>
              <strong>0.35</strong> — extra-time scoring intensity vs regulation.
            </>,
          ]}
        />
      </GuideSection>

      <GuideDivider />

      {/* Tier 3 */}
      <GuideSection id="projection-confidence" title="Projection confidence">
        <GuideProse>
          Projection confidence is a <strong>dashboard health metric</strong> —
          not &ldquo;the model is {confidenceDisplay} sure it is right.&rdquo;
        </GuideProse>
        <MathBlock math={`C = ${w.sim}\\% \\cdot S + ${w.results}\\% \\cdot R + ${w.backtest}\\% \\cdot B`} />
        <GuideProse>
          where <InlineMath math="S" /> is simulation depth,{" "}
          <InlineMath math="R" /> is results completeness, and{" "}
          <InlineMath math="B" /> is backtest calibration.
        </GuideProse>
        <GuideMetricTable
          rows={snapshot.confidenceComponentRows.map((row) => ({
            component: row.key,
            exportValue: row.exportValue,
            meaning: row.meaning,
          }))}
        />
        <MathBlock
          math={`C \\approx ${snapshot.confidenceExpandedLine} \\approx ${modelQuality.confidence_percent > 0 ? `${modelQuality.confidence_percent.toFixed(1)}\\%` : "\\text{—}"}`}
        />
        <GuideProse>
          Higher confidence means a more mature export — not a guaranteed
          favorite.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="path-difficulty" title="Path difficulty">
        <MathBlock math="\text{path difficulty} = \frac{\sum \text{projected opponent ratings}}{\text{number of projected opponent slots}}" />
        <GuideProse>
          Measures average opponent strength on likely knockout paths — context
          for title odds, not a pure quality ranking.
        </GuideProse>
        {pathHighlight ? (
          <GuideProse>
            Toughest projected path among title contenders this export:{" "}
            <strong>{pathHighlight.team}</strong> ({pathHighlight.label}).
          </GuideProse>
        ) : null}
      </GuideSection>

      <GuideDivider />

      <GuideSection id="biggest-movers" title="Biggest movers">
        <GuideProse>
          Compares this export to the previous one in percentage points. Largest
          swings often hit teams near cutoffs, not always the best teams overall.
        </GuideProse>
        {snapshot.movementBaseline ? (
          <GuideProse>
            Baseline: <strong>{snapshot.movementBaseline}</strong>
          </GuideProse>
        ) : null}
        {live.movers.length > 0 ? (
          <GuideList
            items={live.movers.map((mover) => (
              <span key={mover.team}>
                <strong>{mover.team}</strong> — {mover.metricLabel},{" "}
                <strong>{mover.deltaPp}</strong>
              </span>
            ))}
          />
        ) : (
          <GuideProse>No movement data for this export yet.</GuideProse>
        )}
      </GuideSection>

      <GuideDivider />

      <GuideSection id="markets-vs-model" title="Markets versus model">
        <GuideProse>
          Outright-winner odds from books are normalized to implied probability,
          then compared to the model:
        </GuideProse>
        <MathBlock math="\text{gap} = P_{\text{model}} - P_{\text{market}}" />
        {snapshot.modelFavorite && snapshot.marketFavorite ? (
          <>
            <GuideList
              items={[
                <>
                  <strong>Model favorite:</strong> {snapshot.modelFavorite}
                  {live.modelFavoritePct ? ` (${live.modelFavoritePct})` : null}
                </>,
                <>
                  <strong>Market favorite:</strong> {snapshot.marketFavorite}
                  {live.marketFavoritePct
                    ? ` (${live.marketFavoritePct} implied)`
                    : null}
                </>,
                snapshot.meanAbsoluteGap ? (
                  <>
                    <strong>Mean absolute gap:</strong> {snapshot.meanAbsoluteGap}{" "}
                    across compared teams
                  </>
                ) : null,
              ].filter(Boolean)}
            />
            <GuideProse>
              Positive gap = model more bullish. Gaps are questions, not betting
              signals. →{" "}
              <GuideTabLink tab="markets">Open Markets tab</GuideTabLink>
            </GuideProse>
          </>
        ) : (
          <GuideProse>
            Market comparison data is not available in this export.
          </GuideProse>
        )}
      </GuideSection>

      <GuideDivider />

      <GuideSection id="backtest-2022" title="The 2022 backtest">
        <GuideProse>
          Replays today&apos;s simulator on 2022 with pre-tournament inputs.
          Round of 16 overlap: {r16Overlap} of 16 favored teams actually reached
          the R16 in Qatar.
        </GuideProse>
        <MathBlock math={`\\frac{${r16Overlap}}{16} = ${((r16Overlap / 16) * 100).toFixed(0)}\\%`} />
        <GuideProse>
          A sanity check, not proof that 2026 projections will be correct. See
          the <GuideTabLink tab="backtest">Backtest tab</GuideTabLink> for detail.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="model-limits" title="Model limits & calibration">
        <GuideProse>
          A 75% favorite loses one time in four on average. Judge calibration
          over many events, not one match outcome — a probability model should
          be read as calibrated uncertainty, not destiny.
        </GuideProse>
        <GuideProse>
          The simulator is strongest on <strong>tournament-structure</strong>{" "}
          questions: tiebreakers, third-place permutations, bracket leverage, and
          cross-group effects — especially late in the group stage.
        </GuideProse>
        <GuideProse>
          It does not fully account for injuries, lineups, tactics, travel,
          weather, in-play signals, or penalty-taker quality. The tradeoff is
          transparency: ratings → expected goals → random scores → rules →
          probabilities.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="current-export" title="Current export">
        <CurrentExportSummary snapshot={snapshot} />
      </GuideSection>

      <GuideDivider />

      <GuideSection id="data-caveats" title="Data caveats and refresh cadence">
        <GuideProse>
          The dashboard reflects the latest export on a scheduled cadence (
          {snapshot.refreshCadence}), not continuously.
        </GuideProse>
        {dataCaveats.length > 0 ? (
          <GuideList
            items={dataCaveats.map((caveat) => <span key={caveat}>{caveat}</span>)}
          />
        ) : null}
        <GuideList
          items={[
            "Result syncing is best-effort; fair-play cards depend on summary feeds.",
            "Market odds are outright-winner snapshots, not live in-play prices.",
            "Fast refresh tiers may use fewer simulations — reflected in projection confidence.",
            "The 2022 backtest uses today's code on 2022 data, not a frozen 2022 production run.",
          ]}
        />
      </GuideSection>
    </article>
  );
}
