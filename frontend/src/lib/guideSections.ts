export interface GuideSectionLink {
  id: string;
  title: string;
}

export const GUIDE_SECTIONS: GuideSectionLink[] = [
  { id: "reading-the-projections", title: "Reading the projections" },
  { id: "what-the-model-is-trying-to-do", title: "What the model is trying to do" },
  { id: "what-this-site-is-and-is-not", title: "What this site is — and is not" },
  { id: "the-data-flow", title: "The data flow" },
  { id: "snapshot-versus-projection", title: "Snapshot versus projection" },
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
  { id: "projection-confidence", title: "Projection confidence" },
  { id: "path-difficulty", title: "Path difficulty" },
  { id: "biggest-movers", title: "Biggest movers" },
  { id: "markets-vs-model", title: "Markets versus model" },
  { id: "backtest-2022", title: "The 2022 backtest" },
  { id: "calibration", title: "Calibration, not certainty" },
  { id: "what-model-does-well", title: "What the model does well" },
  { id: "what-model-does-not-know", title: "What the model does not know" },
  { id: "data-caveats", title: "Data caveats & refresh" },
  { id: "current-export", title: "Current export" },
  { id: "how-to-read-dashboard", title: "How to read the dashboard" },
];
