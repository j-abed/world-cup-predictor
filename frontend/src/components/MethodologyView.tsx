import type { ReactNode } from "react";
import type {
  MarketComparison,
  Metadata,
  ModelQuality,
  Movement,
  PathDifficultyEntry,
} from "../types";
import {
  projectionConfidenceFactors,
  projectionConfidenceSummary,
} from "../lib/projectionConfidence";
import { KatexBlock } from "./KatexBlock";
import {
  CommandMetaChip,
  CommandNote,
  CommandPanel,
  CommandPanelStack,
  CommandSection,
  CommandStat,
  CommandStatGrid,
} from "./CommandPanel";

interface MethodologyViewProps {
  metadata: Metadata;
  modelQuality?: ModelQuality;
  pathDifficulty?: PathDifficultyEntry[];
  movement?: Movement;
  marketComparison?: MarketComparison;
}

const EMPTY_MODEL_QUALITY: ModelQuality = {
  confidence_score: 0,
  confidence_label: "Unknown",
  confidence_percent: 0,
  components: {
    simulation_factor: 0,
    group_stage_completeness: 0,
    backtest_calibration: 0,
  },
  backtest_reference: "2022",
  backtest_round_of_16_overlap: 0,
};

const GUIDE_SECTIONS = [
  { id: "intro", num: 1, title: "What this site is (and isn't)" },
  { id: "percentages", num: 2, title: "How to read a percentage" },
  { id: "pipeline", num: 3, title: "Pipeline overview" },
  { id: "monte-carlo", num: 4, title: "Monte Carlo in plain English" },
  { id: "ratings", num: 5, title: "Team ratings & strength" },
  { id: "match-sim", num: 6, title: "Match simulation" },
  { id: "groups", num: 7, title: "Group stage & tiebreakers" },
  { id: "snapshot", num: 8, title: "Snapshot vs projection" },
  { id: "knockout", num: 9, title: "Knockout stage" },
  { id: "glossary", num: 10, title: "Dashboard glossary" },
  { id: "backtest", num: 11, title: "2022 backtest" },
  { id: "limitations", num: 12, title: "Limitations & refresh" },
  { id: "live-stats", num: 13, title: "This snapshot's numbers" },
] as const;

function ProseParagraph({ children }: { children: ReactNode }) {
  return <p className="methodology-prose__p">{children}</p>;
}

function ProseList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="methodology-prose__list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function GlossaryEntry({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="methodology-glossary__entry">
      <dt className="methodology-glossary__term">{term}</dt>
      <dd className="methodology-glossary__def">{children}</dd>
    </div>
  );
}

function MethodologyToc() {
  return (
    <nav className="methodology-toc" aria-label="Guide sections">
      <p className="methodology-toc__label">On this page</p>
      <ol className="methodology-toc__list">
        {GUIDE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="methodology-toc__link">
              <span className="methodology-toc__num">{section.num}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MethodologySection({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="methodology-section">
      {children}
    </div>
  );
}

export function MethodologyView({
  metadata,
  modelQuality = EMPTY_MODEL_QUALITY,
  pathDifficulty = [],
  movement,
  marketComparison,
}: MethodologyViewProps) {
  const sims = metadata.simulations.tournament;
  const completeness =
    metadata.fixture_count > 0
      ? metadata.completed_result_count / metadata.fixture_count
      : 0;
  const confidenceFactors = projectionConfidenceFactors(modelQuality);
  const weights = modelQuality.component_weights ?? {
    simulation_depth: 0.35,
    group_stage_completeness: 0.35,
    backtest_calibration: 0.30,
  };

  return (
    <CommandPanelStack>
      <MethodologySection id="intro">
        <CommandPanel
          eyebrow="Educational guide"
          title="How the probability engine works"
          subtitle="A plain-language tour of the statistics, simulation design, and dashboard metrics behind these projections. This is not betting advice."
          meta={
            <>
              <CommandMetaChip live>
                {sims.toLocaleString()} Monte Carlo runs
              </CommandMetaChip>
              {metadata.refresh_interval_hours ? (
                <CommandMetaChip>
                  Refreshed every {metadata.refresh_interval_hours}h
                </CommandMetaChip>
              ) : null}
            </>
          }
        >
          <MethodologyToc />

          <CommandNote title="Start here">
            <ProseParagraph>
              Every percentage on this site answers one question:{" "}
              <strong>
                &ldquo;If we replayed the rest of the tournament thousands of
                times, how often would this outcome happen?&rdquo;
              </strong>{" "}
              That is a simulated frequency — not a prophecy, not a bookmaker
              price, and not a guarantee.
            </ProseParagraph>
          </CommandNote>

          <CommandSection title="What this site is">
            <ProseList
              items={[
                <>
                  A <strong>Monte Carlo simulator</strong> for the 2026 World
                  Cup — it rolls random match scores from team-strength ratings,
                  applies FIFA tiebreakers, fills the Round of 32, and plays out
                  knockouts through the final.
                </>,
                <>
                  An <strong>educational dashboard</strong> that turns those
                  thousands of trial runs into readable odds for qualification,
                  the bracket, and the title.
                </>,
                <>
                  A <strong>transparent model</strong> — inputs are checked-in
                  CSV files; the Python engine and export scripts are in the repo.
                </>,
              ]}
            />
          </CommandSection>

          <CommandSection title="What this site is not">
            <ProseList
              items={[
                "Not betting advice. Markets and models can disagree; neither is ground truth.",
                "Not a live scoreboard or injury tracker — it uses scheduled fixtures and completed results from the data snapshot.",
                "Not a crystal ball. Upsets happen; low-probability paths still win sometimes.",
                "Not a frozen 2022-era model on the backtest tab — that replay uses today's simulator logic on 2022 data.",
              ]}
            />
          </CommandSection>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="percentages">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[1].num}`}
          title="How to read a percentage"
          subtitle="Think frequency, not prophecy."
        >
          <ProseParagraph>
            Imagine flipping a slightly weighted coin 10,000 times. If heads
            appears 1,680 times, you would say heads has about a{" "}
            <strong>16.8% frequency</strong>. That is exactly how title odds work
            here: if a team wins the simulated tournament in 1,680 of 10,000
            runs, their championship probability is about 16.8%.
          </ProseParagraph>

          <CommandNote title="Analogy: weather, not destiny">
            <ProseParagraph>
              A 30% rain forecast does not mean it will rain for 30% of the day
              or that rain is &ldquo;unlikely enough to ignore.&rdquo; It means
              that in similar conditions, rain occurred about 30% of the time.
              World Cup percentages work the same way — they describe{" "}
              <strong>how often an outcome appeared across many plausible
              futures</strong>, given today's ratings and remaining fixtures.
            </ProseParagraph>
          </CommandNote>

          <ProseList
            items={[
              <>
                <strong>16% to win</strong> — still a long shot, but not zero;
                roughly one in six simulated tournaments.
              </>,
              <>
                <strong>80% to qualify</strong> — usually makes it, but about
                two in ten runs still miss.
              </>,
              <>
                <strong>Two teams near 50%</strong> — genuinely coin-flip
                territory over the remaining schedule, not a model error.
              </>,
            ]}
          />
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="pipeline">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[2].num}`}
          title="Pipeline overview"
          subtitle="From CSV inputs to the dashboard you see."
        >
          <ProseParagraph>
            The site loads a single JSON snapshot (
            <code className="methodology-prose__code">app_state.json</code>
            ) produced offline. Nothing is computed in your browser — the React
            app validates and displays the latest export.
          </ProseParagraph>

          <ProseList
            items={[
              "Team list, fixtures, results, and FIFA-style strength ratings live in checked-in CSV files under data/.",
              "Completed results update group standings, fair-play scores, and (on refresh) post-match rating tweaks.",
              "A Python Monte Carlo engine simulates unfinished group matches, ranks third-place teams, builds the Round of 32, and plays out knockouts.",
              "The export script writes one JSON snapshot that this dashboard loads and validates.",
            ]}
          />

          <pre className="methodology-prose__formula">
            {`data/*.csv  →  Python model  →  app_state.json  →  dashboard`}
          </pre>

          <CommandNote title="Why offline simulation?">
            <ProseParagraph>
              Running 10,000 full-tournament simulations in the browser would be
              slow and inconsistent. Pre-computing the snapshot keeps the UI
              fast and makes every visitor see the same numbers for a given
              export timestamp.
            </ProseParagraph>
          </CommandNote>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="monte-carlo">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[3].num}`}
          title="Monte Carlo in plain English"
          subtitle="Play the tournament thousands of times, count the outcomes."
        >
          <ProseParagraph>
            <strong>Monte Carlo</strong> is a fancy name for a simple idea: repeat
            a random experiment many times and tally the results. Each{" "}
            <em>trial</em> is one complete run-through of the remaining
            tournament — every unfinished group match, third-place ranking,
            bracket slot, and knockout match.
          </ProseParagraph>

          <CommandSection
            title="Independent trials"
            subtitle="Same inputs, different random scores each time."
          >
            <ProseParagraph>
              The engine repeats the full procedure{" "}
              <strong>{sims.toLocaleString()} times</strong> with the same team
              ratings and fixture list but different random goals. Trials do not
              learn from each other — run #4,281 does not know what happened in
              run #4,280.
            </ProseParagraph>
            <ProseList
              items={[
                "More runs = smoother percentages (less Monte Carlo noise). The target is 10,000 tournament simulations per export.",
                "Runs are independent — no learning across trials.",
                "Group-stage and knockout odds in one export share the same random seed for reproducibility.",
              ]}
            />
          </CommandSection>

          <CommandNote title="Dice-roll intuition">
            <ProseParagraph>
              If you rolled a die once and got a 6, you would not conclude the
              die always lands on 6. One match result is like one roll; Monte
              Carlo averages over thousands of rolls so the percentages stabilize.
            </ProseParagraph>
          </CommandNote>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="ratings">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[4].num}`}
          title="Team ratings & strength"
          subtitle="A single number that summarizes how strong each team is right now."
        >
          <ProseParagraph>
            Each team carries a <strong>strength rating</strong> on the FIFA World
            Ranking points scale (typically roughly 1,000–2,000+ points for
            national teams). Higher is stronger. Ratings are the model's main
            input for expected goals — they are not destiny, but they tilt random
            scores toward the better side.
          </ProseParagraph>

          <ProseList
            items={[
              "Preferred source: checked-in FIFA/Coca-Cola Men's World Ranking snapshot (see live stats at the bottom for this export's source).",
              "After real matches finish, an Elo-style updater (K = 40) nudges ratings so recent results feed the next export.",
              "Only newly completed fixtures after the first pipeline run receive retroactive rating updates — existing results are recorded without rewriting history.",
            ]}
          />

          <CommandNote title="Glossary: rating">
            <ProseParagraph>
              Think of a rating like a handicap in golf — it compresses many
              factors (recent form, opponent quality, historical strength) into
              one comparable number. A 100-point gap between two teams is treated
              as roughly a third of a goal of expected margin on neutral ground.
            </ProseParagraph>
          </CommandNote>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="match-sim">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[5].num}`}
          title="Match simulation"
          subtitle="From rating gap to random goals."
        >
          <ProseParagraph>
            For each simulated match, the model converts the rating gap into an{" "}
            <strong>expected goal difference</strong>, splits total scoring
            between home and away, then draws actual goals from Poisson
            randomness — a standard way to model count data like goals.
          </ProseParagraph>

          <CommandSection title="Step 1 — expected goal difference">
            <ProseParagraph>
              The rating gap drives how much one side is favored. At the
              calibrated constant (285 rating points per expected goal), a
              100-point gap ≈ 0.35 expected goals of margin:
            </ProseParagraph>
            <KatexBlock math="\Delta = \frac{R_{\text{home}} - R_{\text{away}}}{285}" />
          </CommandSection>

          <CommandSection title="Step 2 — split expected goals">
            <ProseParagraph>
              World Cup group matches average about 2.6 total goals. The model
              divides that baseline between the two teams using the expected
              margin Δ (with a floor so neither side expects fewer than 0.2
              goals):
            </ProseParagraph>
            <KatexBlock math="\lambda_{\text{home}} = \max\!\left(0.2,\; \frac{2.6 + \Delta}{2}\right)" />
            <KatexBlock math="\lambda_{\text{away}} = \max\!\left(0.2,\; \frac{2.6 - \Delta}{2}\right)" />
          </CommandSection>

          <CommandSection title="Step 3 — random score">
            <ProseParagraph>
              Actual goals are drawn independently from Poisson distributions
              with those rates. A Poisson draw is like counting rare events in a
              fixed window — it naturally produces 0, 1, 2, 3… goals with
              sensible probabilities.
            </ProseParagraph>
            <KatexBlock math="G_{\text{home}} \sim \text{Poisson}(\lambda_{\text{home}}),\quad G_{\text{away}} \sim \text{Poisson}(\lambda_{\text{away}})" />
          </CommandSection>

          <CommandNote title="Plain English">
            <ProseParagraph>
              Stronger team → higher expected goals → more random paths where
              they score more. Weaker team → still wins sometimes, because
              Poisson noise creates upsets. That is intentional — football is
              not deterministic.
            </ProseParagraph>
          </CommandNote>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="groups">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[6].num}`}
          title="Group stage & tiebreakers"
          subtitle="48 teams, 12 groups, FIFA tiebreak order."
        >
          <CommandSection title="Who advances">
            <ProseParagraph>
              The 2026 format sends the <strong>top two</strong> from each of 12
              groups to the Round of 32, plus the{" "}
              <strong>best eight third-place teams</strong> — 32 knockout
              qualifiers total.
            </ProseParagraph>
          </CommandSection>

          <CommandSection title="FIFA tiebreak order">
            <ProseParagraph>
              When teams are level on points, FIFA applies this cascade (the
              simulator follows the same order):
            </ProseParagraph>
            <ProseList
              items={[
                "Points, then goal difference, then goals scored.",
                "Head-to-head points, head-to-head goal difference, head-to-head goals scored (among tied teams).",
                "Fair-play conduct score (yellow/red cards from ESPN when synced — fewer cards is better).",
                "FIFA ranking as a last resort.",
              ]}
            />
          </CommandSection>

          <CommandSection title="Third-place ranking">
            <ProseParagraph>
              All twelve third-place teams are ranked against each other using
              the same tiebreak toolkit. The top eight join the knockout bracket;
              the official 495-case permutation table assigns each qualifier to
              a fixed Round of 32 slot.
            </ProseParagraph>
          </CommandSection>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="snapshot">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[7].num}`}
          title="Snapshot vs projection"
          subtitle="Today's table is not the same as knockout odds."
        >
          <ProseParagraph>
            The <strong>Groups</strong> tab shows standings from{" "}
            <em>completed matches only</em> — a photograph of the table right now.
            Qualification and bracket tabs show{" "}
            <em>Monte Carlo projections</em> — what happens after simulating
            every remaining group fixture thousands of times.
          </ProseParagraph>

          <CommandNote title="Third-place example">
            <ProseParagraph>
              Suppose a team sits <strong>#9 among third-place teams</strong> in
              today's snapshot. They would <em>not</em> qualify if the group
              stage stopped now. Yet they might still show ~80% knockout odds
              because:
            </ProseParagraph>
            <ProseList
              items={[
                "They may still finish first or second in their group in many simulated paths.",
                "Even as a third-place team, their remaining fixtures could lift them into the top eight third-place sides.",
                "A single completed match can move both group rank and third-place rank simultaneously.",
              ]}
            />
          </CommandNote>

          <ProseParagraph>
            Always ask: <strong>Is this number a snapshot or a projection?</strong>{" "}
            Standings and live table positions are snapshots; percentage columns
            on qualification, bracket, and champion tabs are projections.
          </ProseParagraph>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="knockout">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[8].num}`}
          title="Knockout stage"
          subtitle="Extra time, penalties, and bracket logic."
        >
          <ProseParagraph>
            Knockout matches must produce a winner. The model uses the same
            Poisson goal engine in regulation, then extra time, then penalties if
            needed.
          </ProseParagraph>

          <ProseList
            items={[
              "Regulation — same rating → goals model as the group stage; draws are allowed here.",
              "Extra time — if level after 90 minutes, one extra-time period is simulated at 35% of regulation scoring intensity (fewer goals expected).",
              "Penalties — if still tied, a shootout is resolved with rating-weighted advance probability (individual kicks are not modeled).",
              "Bracket — the 2026 third-place permutation assigns each qualifier to a fixed R32 slot before simulations continue.",
            ]}
          />

          <CommandSection title="Penalty shootout probability">
            <ProseParagraph>
              When extra time still ends level, the stronger side is more likely
              to advance. The formula uses the same 400-point Elo-style scale as
              post-match rating updates:
            </ProseParagraph>
            <KatexBlock math="P(\text{A advances}) = \frac{1}{1 + 10^{(R_B - R_A)/400}}" />
          </CommandSection>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="glossary">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[9].num}`}
          title="Dashboard glossary"
          subtitle="What the hero KPIs and side panels mean."
        >
          <dl className="methodology-glossary">
            <GlossaryEntry term="Projection confidence">
              {projectionConfidenceSummary(modelQuality)} Measures how complete
              and well-calibrated this <em>export run</em> is — simulation
              depth, group-stage results in, and 2022 backtest calibration. It
              does <strong>not</strong> mean &ldquo;84% chance the model is
              right about each match.&rdquo;
            </GlossaryEntry>

            <GlossaryEntry term="Path difficulty">
              On the champion tab, ranks title favorites by the average strength
              of likely opponents on their projected bracket path (higher opponent
              ratings = tougher road). A team can have strong title odds but a
              hard path if their side of the draw is stacked.
            </GlossaryEntry>

            <GlossaryEntry term="Biggest movers">
              Teams whose championship, final, or qualification probabilities
              changed the most since the prior export snapshot. Useful for spotting
              which results or rating updates moved the needle — not a quality
              score.
            </GlossaryEntry>

            <GlossaryEntry term="Markets vs model">
              Compares simulated title probability to implied probability from
              outright winner betting odds. Positive delta = model more bullish
              than the market. Neither side is ground truth; gaps highlight
              disagreement worth investigating.
            </GlossaryEntry>

            <GlossaryEntry term="2022 backtest tab">
              Replays today's simulator on Qatar 2022 with pre-tournament ratings
              frozen at October 2022. Reports knockout-round overlap and whether
              Argentina's title probability ranked sensibly before kickoff.
            </GlossaryEntry>
          </dl>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="backtest">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[10].num}`}
          title="2022 backtest explained simply"
          subtitle="Did the model behave sensibly on a tournament we already know?"
        >
          <ProseParagraph>
            Before trusting a forecast for 2026, it helps to ask:{" "}
            <strong>
              on a past World Cup, did the same code produce reasonable
              pre-tournament odds?
            </strong>{" "}
            The backtest tab answers that by re-running today's simulator on 2022
            data with no group-stage results — as if the tournament had not
            started yet.
          </ProseParagraph>

          <ProseList
            items={[
              "Inputs: 2022 teams, fixtures, and FIFA ratings as of October 2022.",
              "Output: simulated knockout probabilities compared to what actually happened.",
              "Round-of-16 overlap — of the 16 teams the model favored most for the R16, how many actually got there? (Calibration prior: 12 of 16.)",
              "Champion sanity check — was the actual winner (Argentina) in the model's pre-tournament top five?",
            ]}
          />

          <CommandNote title="What it does not prove">
            <ProseParagraph>
              A good 2022 replay does not guarantee 2026 accuracy. Form, injuries,
              and draw luck differ every cycle. The backtest is a{" "}
              <strong>sanity check</strong>, not a report card for every match.
            </ProseParagraph>
          </CommandNote>
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="limitations">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[11].num}`}
          title="Limitations & refresh cadence"
          subtitle="Known gaps and how often data updates."
        >
          <ProseList
            items={[
              ...metadata.data_caveats,
              "Knockout probabilities assume the current bracket projection; third-place permutations can shift as ranks change.",
              "What-if scenarios are CLI-only — not exposed in this dashboard.",
              "Fast refresh tiers may use fewer simulations; projection confidence adjusts if sim depth is capped.",
              "Market odds are outright-winner snapshots only — not live in-play prices.",
              "ESPN card sync for fair-play tiebreakers depends on summary API availability per completed match.",
            ]}
          />

          {metadata.refresh_interval_hours ? (
            <CommandSection title="Refresh cadence">
              <ProseParagraph>
                Exports refresh on a{" "}
                <strong>{metadata.refresh_interval_hours}-hour</strong> cadence
                (aligned to UTC cron). Completed match results, ratings updates,
                and market odds are pulled on that schedule — not continuously.
                {metadata.next_refresh_at ? (
                  <>
                    {" "}
                    Next scheduled refresh:{" "}
                    <strong>{metadata.next_refresh_at}</strong>.
                  </>
                ) : null}
              </ProseParagraph>
            </CommandSection>
          ) : null}

          {metadata.ratings_source ? (
            <ProseParagraph>
              <span className="methodology-prose__p--meta">
                Ratings source for this snapshot:{" "}
                {metadata.ratings_source_url ? (
                  <a
                    href={metadata.ratings_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-border underline-offset-2 hover:text-gold"
                  >
                    {metadata.ratings_source}
                  </a>
                ) : (
                  metadata.ratings_source
                )}
                . Last export: {metadata.generated_at}.
              </span>
            </ProseParagraph>
          ) : null}
        </CommandPanel>
      </MethodologySection>

      <MethodologySection id="live-stats">
        <CommandPanel
          eyebrow={`§${GUIDE_SECTIONS[12].num}`}
          title="This snapshot's numbers"
          subtitle="Live values from the current export."
        >
          <CommandStatGrid>
            <CommandStat label="Monte Carlo runs">
              <p className="command-stat__value--hero">
                {sims.toLocaleString()}
              </p>
            </CommandStat>
            <CommandStat label="Group fixtures complete">
              <p className="command-stat__value--hero">
                {metadata.completed_result_count} / {metadata.fixture_count}
              </p>
              <p className="text-xs text-muted-foreground">
                {(completeness * 100).toFixed(0)}% of group stage
              </p>
            </CommandStat>
            <CommandStat label="Teams in field">
              <p className="command-stat__value--hero">
                {metadata.team_count}
              </p>
            </CommandStat>
            <CommandStat label="Export timestamp">
              <p className="command-stat__value--hero text-sm">
                {metadata.generated_at}
              </p>
            </CommandStat>
          </CommandStatGrid>

          <CommandSection title="Projection confidence breakdown">
            <ProseParagraph>
              Weighted blend of sim depth, results completeness, and 2022
              calibration:
            </ProseParagraph>
            <KatexBlock math={`C = ${Math.round(weights.simulation_depth * 100)}\\% \\cdot S + ${Math.round(weights.group_stage_completeness * 100)}\\% \\cdot R + ${Math.round(weights.backtest_calibration * 100)}\\% \\cdot B`} />

            <CommandStatGrid>
              {confidenceFactors.map((factor) => (
                <CommandStat key={factor.label} label={factor.label}>
                  <p className="command-stat__value--hero">{factor.value}</p>
                </CommandStat>
              ))}
              <CommandStat label="Overall">
                <p className="command-stat__value--hero">
                  {modelQuality.confidence_percent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {modelQuality.confidence_label}
                </p>
              </CommandStat>
            </CommandStatGrid>

            <ProseList
              items={[
                `Sim depth (S) — ${sims.toLocaleString()} / ${modelQuality.target_simulations?.toLocaleString() ?? "10,000"} target.`,
                `Results in (R) — ${metadata.completed_result_count} of ${metadata.fixture_count} group fixtures complete.`,
                `2022 calibration (B) — blend of Round-of-16 overlap (${Math.round(modelQuality.backtest_round_of_16_overlap * 16)}/16) and whether the actual 2022 champion was in the model's pre-tournament top five.`,
              ]}
            />
          </CommandSection>

          {pathDifficulty.length > 0 ? (
            <CommandSection title="Path difficulty (top entry)">
              <ProseParagraph>
                Toughest projected path among title contenders:{" "}
                <strong>{pathDifficulty[0].team}</strong> ({pathDifficulty[0].label}
                , avg opponent rating {pathDifficulty[0].avg_opponent_rating.toFixed(0)}
                ).
              </ProseParagraph>
            </CommandSection>
          ) : null}

          {movement?.has_baseline && movement.biggest_movers.length > 0 ? (
            <CommandSection title="Latest movement">
              <ProseParagraph>
                Compared to baseline from {movement.baseline_generated_at}. Largest
                swing: <strong>{movement.biggest_movers[0].team}</strong> (
                {movement.biggest_movers[0].metric},{" "}
                {movement.biggest_movers[0].delta >= 0 ? "+" : ""}
                {(movement.biggest_movers[0].delta * 100).toFixed(1)} pp).
              </ProseParagraph>
            </CommandSection>
          ) : null}

          {marketComparison?.available && marketComparison.summary ? (
            <CommandSection title="Markets vs model">
              <ProseParagraph>
                Model favorite: {marketComparison.summary.model_favorite_team}.
                Market favorite: {marketComparison.summary.market_favorite_team}.
                {marketComparison.summary.favorites_agree
                  ? " Both agree on the favorite."
                  : " Favorites disagree — see the Markets tab for detail."}
                {" "}Mean absolute gap across compared teams:{" "}
                {(marketComparison.summary.mean_absolute_gap * 100).toFixed(1)} pp.
              </ProseParagraph>
            </CommandSection>
          ) : null}
        </CommandPanel>
      </MethodologySection>
    </CommandPanelStack>
  );
}
