import type { GuideExportSnapshot } from "../../lib/guideStats";
import type { ModelQuality } from "../../types";
import { CurrentExportSummary } from "./CurrentExportSummary";
import {
  CodeBlock,
  GuideDivider,
  GuideList,
  GuideProse,
  GuideSection,
} from "./GuideSection";
import { InlineMath, MathBlock } from "./MathBlock";

interface GuideArticleProps {
  sims: number;
  snapshot: GuideExportSnapshot;
  modelQuality: ModelQuality;
  dataCaveats: string[];
}

export function GuideArticle({
  sims,
  snapshot,
  modelQuality,
  dataCaveats,
}: GuideArticleProps) {
  const simsLabel = sims > 0 ? sims.toLocaleString() : "10,000";
  const { confidenceFormulaWeights: w } = snapshot;
  const r16Overlap = Math.round(modelQuality.backtest_round_of_16_overlap * 16);
  const confidenceDisplay = snapshot.projectionConfidence;

  return (
    <article className="guide-article">
      <GuideSection id="reading-the-projections" title="A guide to reading the projections">
        <GuideProse>
          This dashboard is built around one fairly simple idea: instead of
          pretending we know how the rest of the World Cup will unfold, we replay
          the unfinished part of the tournament thousands of times and count what
          happens.
        </GuideProse>
        <GuideProse>
          That is really all the model is doing. It starts with the tournament as
          it currently stands — the results already played, the matches still
          remaining, the team ratings, the group tables, and the qualification
          rules — and then it simulates the rest of the competition. Not once,
          but {simsLabel} times.
        </GuideProse>
        <GuideProse>
          If a team qualifies in 7,200 of those {simsLabel} simulations, the
          dashboard shows that team with about a 72% chance to qualify. If a team
          wins the tournament in 1,400 simulations, its title probability is
          about 14%.
        </GuideProse>
        <GuideProse>
          That is the most important thing to understand before reading anything
          else on this site: the percentages are not promises. They are simulated
          frequencies. The model is not saying &ldquo;this will happen.&rdquo; It
          is saying &ldquo;this is how often this happened when we replayed the
          tournament from the current position.&rdquo;
        </GuideProse>
        <GuideProse>
          Football is volatile. A team can dominate and lose. A favorite can miss
          a penalty. A late goal in one group can change the third-place cutoff
          for another group. The point of the simulator is not to smooth away that
          chaos. The point is to measure it.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="what-the-model-is-trying-to-do" title="What the model is trying to do">
        <GuideProse>
          The model is trying to answer a practical tournament question:
        </GuideProse>
        <MathBlock math="\text{If the rest of the tournament were replayed many times, how often would each outcome happen?}" />
        <GuideProse>
          For any outcome, the calculation is the same:
        </GuideProse>
        <MathBlock math="P(\text{outcome}) = \frac{\text{simulations where the outcome happened}}{\text{total simulations}}" />
        <GuideProse>
          So if Portugal wins the World Cup in 1,180 out of {simsLabel}{" "}
          simulations, the model gives Portugal an 11.8% title probability:
        </GuideProse>
        <MathBlock math={`\\frac{1{,}180}{${sims > 0 ? sims.toLocaleString().replace(/,/g, "{,}") : "10{,}000"}} = 11.8\\%`} />
        <GuideProse>
          That does not mean Portugal is &ldquo;predicted&rdquo; to win. In most
          simulated tournaments, Portugal does not win. But Portugal wins often
          enough to be a serious contender.
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

      <GuideSection id="snapshot-versus-projection" title="Snapshot versus projection">
        <GuideProse>
          A <strong>snapshot</strong> describes the tournament as it stands now —
          the group table from completed matches only.
        </GuideProse>
        <GuideProse>
          A <strong>projection</strong> simulates remaining fixtures thousands
          of times — qualification odds, bracket odds, title odds.
        </GuideProse>
        <GuideProse>
          A team below the live third-place cutoff can still show strong
          qualification odds if many simulated paths lift it. The table answers
          &ldquo;where are things now?&rdquo; The probabilities answer &ldquo;how
          often does this team get through from here?&rdquo;
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
          loss. The model uses <InlineMath math="K = 40" />.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="ratings-to-scores" title="Turning ratings into match scores">
        <MathBlock math="R_{\text{home}} - R_{\text{away}}" />
        <MathBlock math="\Delta = \frac{R_{\text{home}} - R_{\text{away}}}{285}" />
        <MathBlock math="\Delta = \frac{100}{285} \approx 0.35" />
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
        <MathBlock math="\text{goal difference} = \text{goals for} - \text{goals against}" />
        <MathBlock math="12 \times 2 = 24" />
        <MathBlock math="24 + 8 = 32" />
        <GuideProse>
          Top two per group plus eight best third-place teams fill the Round of
          32. FIFA-style tiebreakers apply when teams are level on points.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="third-place-race" title="The third-place race">
        <MathBlock math="P(\text{qualify}) = P(\text{finish 1st or 2nd}) + P(\text{finish 3rd and rank top 8})" />
        <GuideProse>
          Third-place teams compete across all groups. A late goal in one group
          can reshuffle the cutoff for teams that never meet.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="knockout-bracket" title="Building the knockout bracket">
        <GuideProse>
          Group winners and runners-up have fixed slots; third-place qualifiers
          map through the official permutation table. Two teams with similar
          qualification odds can have very different title paths depending on
          bracket placement.
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
        <MathBlock math={`\\frac{3{,}250}{${sims > 0 ? sims.toLocaleString().replace(/,/g, "{,}") : "10{,}000"}} = 32.5\\%`} />
        <MathBlock math={`\\frac{620}{${sims > 0 ? sims.toLocaleString().replace(/,/g, "{,}") : "10{,}000"}} = 6.2\\%`} />
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

      <GuideSection id="projection-confidence" title="Projection confidence">
        <GuideProse>
          Projection confidence is a dashboard health metric — not &ldquo;the
          model is {confidenceDisplay} sure it is right.&rdquo;
        </GuideProse>
        <MathBlock math={`C = ${w.sim}\\% \\cdot S + ${w.results}\\% \\cdot R + ${w.backtest}\\% \\cdot B`} />
        <GuideProse>
          where <InlineMath math="S" /> is simulation depth,{" "}
          <InlineMath math="R" /> is results completeness, and{" "}
          <InlineMath math="B" /> is backtest calibration.
        </GuideProse>
        <MathBlock math={`S = ${snapshot.simDepthComponent}`} />
        <MathBlock math={`R = ${snapshot.resultsComponent}`} />
        <MathBlock math={`B = ${snapshot.backtestComponent}`} />
        <GuideProse>
          Overall for this export: <strong>{confidenceDisplay}</strong>. Higher
          confidence means a more mature export — not a guaranteed favorite.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="path-difficulty" title="Path difficulty">
        <MathBlock math="\text{path difficulty} = \frac{\sum \text{projected opponent ratings}}{\text{number of projected opponent slots}}" />
        <GuideProse>
          Measures average opponent strength on likely knockout paths — context
          for title odds, not a pure quality ranking.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="biggest-movers" title="Biggest movers">
        <GuideProse>
          Compares this export to the previous one in percentage points. Largest
          swings often hit teams near cutoffs, not always the best teams overall.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="markets-vs-model" title="Markets versus model">
        <MathBlock math="P_{\text{implied}} = \frac{1}{\text{decimal odds}}" />
        <MathBlock math="P_{\text{implied}} = \frac{100}{\text{odds} + 100}" />
        <MathBlock math="P_{\text{implied}} = \frac{-\text{odds}}{-\text{odds} + 100}" />
        <MathBlock math="\text{gap} = P_{\text{model}} - P_{\text{market}}" />
        <GuideProse>
          Gaps highlight disagreement — not betting recommendations.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="backtest-2022" title="The 2022 backtest">
        <GuideProse>
          Replays today&apos;s simulator on 2022 with pre-tournament inputs. Round
          of 16 overlap for this model: {r16Overlap} of 16 favored teams actually
          reached the R16 in Qatar.
        </GuideProse>
        <MathBlock math={`\\frac{${r16Overlap}}{16} = ${((r16Overlap / 16) * 100).toFixed(0)}\\%`} />
        <GuideProse>
          A sanity check, not proof that 2026 projections will be correct.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="calibration" title="Calibration, not certainty">
        <GuideProse>
          A 75% favorite loses one time in four on average. Judge calibration
          over many events, not one match outcome.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="what-model-does-well" title="What the model does well">
        <GuideProse>
          Tournament-structure questions: tiebreakers, third-place permutations,
          bracket leverage, cross-group effects — especially late in the group
          stage.
        </GuideProse>
      </GuideSection>

      <GuideDivider />

      <GuideSection id="what-model-does-not-know" title="What the model does not know">
        <GuideProse>
          Injuries, lineups, tactics, travel, weather, in-play signals, and
          penalty-taker quality are largely absent. The tradeoff is transparency:
          ratings → expected goals → random scores → rules → probabilities.
        </GuideProse>
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

      <GuideDivider />

      <GuideSection id="current-export" title="Current export">
        <CurrentExportSummary snapshot={snapshot} />
      </GuideSection>

      <GuideDivider />

      <GuideSection id="how-to-read-dashboard" title="How to read the dashboard">
        <GuideProse>
          Start with the group table (snapshot), then qualification and bracket
          views (projections), then movement panels after results land. Read
          market gaps as questions, not picks.
        </GuideProse>
        <GuideProse>
          The simulator&apos;s job is not to make the World Cup predictable. It
          is to make the uncertainty easier to understand.
        </GuideProse>
      </GuideSection>
    </article>
  );
}
