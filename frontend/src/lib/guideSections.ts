export interface GuideSectionLink {
  id: string;
  title: string;
}

export interface GuideSectionTier {
  label: string;
  hint: string;
  sections: GuideSectionLink[];
}

export const GUIDE_TIERS: GuideSectionTier[] = [
  {
    label: "Read this first",
    hint: "~5 min",
    sections: [
      { id: "reading-the-projections", title: "Reading the projections" },
      { id: "snapshot-versus-projection", title: "Snapshot vs projection" },
      { id: "how-to-read-dashboard", title: "How to read the dashboard" },
      { id: "what-this-site-is-and-is-not", title: "What this site is — and is not" },
    ],
  },
  {
    label: "How the engine works",
    hint: "~10 min",
    sections: [
      { id: "what-the-model-is-trying-to-do", title: "What the model is trying to do" },
      { id: "the-data-flow", title: "The data flow" },
      { id: "why-monte-carlo", title: "Why Monte Carlo simulation" },
      { id: "one-simulation", title: "What happens in one simulation" },
      { id: "why-10000-runs", title: "Why 10,000 runs" },
      { id: "team-ratings", title: "Team ratings" },
      { id: "ratings-to-scores", title: "Ratings to match scores" },
      { id: "drawing-scoreline", title: "Drawing the scoreline" },
      { id: "group-tiebreakers", title: "Group stage & tiebreakers" },
      { id: "third-place-race", title: "The third-place race" },
      { id: "knockout-bracket", title: "Building the knockout bracket" },
      { id: "knockout-matches", title: "Knockout matches" },
      { id: "counting-probabilities", title: "Counting advancement probabilities" },
      { id: "probability-swings", title: "Why probabilities swing" },
      { id: "model-constants", title: "Model constants (reference)" },
    ],
  },
  {
    label: "Dashboard metrics & limits",
    hint: "~5 min",
    sections: [
      { id: "projection-confidence", title: "Projection confidence" },
      { id: "path-difficulty", title: "Path difficulty" },
      { id: "biggest-movers", title: "Biggest movers" },
      { id: "markets-vs-model", title: "Markets versus model" },
      { id: "backtest-2022", title: "The 2022 backtest" },
      { id: "model-limits", title: "Model limits & calibration" },
      { id: "current-export", title: "Current export" },
      { id: "data-caveats", title: "Data caveats & refresh" },
    ],
  },
];

export const GUIDE_SECTIONS: GuideSectionLink[] = GUIDE_TIERS.flatMap(
  (tier) => tier.sections,
);
