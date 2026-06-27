// Runtime validation for outputs/web/app_state.json.
// Keep in sync with src/web_exports.py and types.ts.

import { z } from "zod";

const simulationCountsSchema = z.object({
  group: z.number(),
  tournament: z.number(),
  round: z.number(),
});

const scenarioOverrideSchema = z.object({
  match_id: z.number(),
  home_score: z.number(),
  away_score: z.number(),
});

const scenarioMetadataSchema = z.object({
  label: z.string(),
  overrides: z.array(scenarioOverrideSchema),
  simulations: z.number(),
  baseline_generated_at: z.string().optional(),
});

const metadataSchema = z.object({
  generated_at: z.string(),
  team_count: z.number(),
  fixture_count: z.number(),
  completed_result_count: z.number(),
  ratings_source: z.string().nullable(),
  ratings_source_url: z.string().nullable(),
  rating_type: z.string().nullable(),
  simulations: simulationCountsSchema,
  data_caveats: z.array(z.string()),
  next_refresh_at: z.string().optional(),
  refresh_interval_hours: z.number().optional(),
  tournament_final_kickoff: z.string().optional(),
  scenario: scenarioMetadataSchema.optional(),
});

const groupCoverageSchema = z.object({
  group: z.string(),
  team_count: z.number(),
  fixture_count: z.number(),
  expected_fixture_count: z.number(),
  has_complete_fixture_set: z.boolean(),
  missing_from_fixtures: z.string(),
  unexpected_in_fixtures: z.string(),
});

const fixtureMatchSchema = z.object({
  match_id: z.number(),
  group: z.string(),
  kickoff: z.string(),
  home_team_id: z.string(),
  home_team: z.string(),
  home_code: z.string(),
  away_team_id: z.string(),
  away_team: z.string(),
  away_code: z.string(),
  status: z.string(),
  home_score: z.number().nullable(),
  away_score: z.number().nullable(),
});

const groupStandingSchema = z.object({
  group_code: z.string(),
  rank: z.number(),
  team_id: z.string(),
  team: z.string(),
  code: z.string(),
  group: z.string(),
  played: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goals_for: z.number(),
  goals_against: z.number(),
  goal_difference: z.number(),
  points: z.number(),
});

const thirdPlaceEntrySchema = z.object({
  third_rank: z.number(),
  group: z.string(),
  team: z.string(),
  code: z.string(),
  team_id: z.string(),
  played: z.number(),
  points: z.number(),
  goal_difference: z.number(),
  goals_for: z.number(),
  goals_against: z.number(),
  currently_qualifies: z.boolean(),
});

const projectedQualifierSchema = z.object({
  seed: z.number(),
  source: z.string(),
  group: z.string(),
  qualifying_path: z.string(),
  team: z.string(),
  code: z.string(),
  team_id: z.string(),
  points: z.number(),
  goal_difference: z.number(),
  goals_for: z.number(),
});

const bracketTeamSlotSchema = z.object({
  source: z.string().nullable(),
  team: z.string().nullable(),
  code: z.string().nullable(),
});

const bracketMatchSchema = z.object({
  slot_id: z.string(),
  round: z.string(),
  match_id: z.number().nullable(),
  home: bracketTeamSlotSchema,
  away: bracketTeamSlotSchema,
  winner_advances_to: z.number().nullable(),
});

const bracketSchema = z.object({
  round_of_32: z.array(bracketMatchSchema),
  round_of_16: z.array(bracketMatchSchema),
  quarterfinals: z.array(bracketMatchSchema),
  semifinals: z.array(bracketMatchSchema),
  final: z.array(bracketMatchSchema),
});

const groupFinishProbabilitySchema = z.object({
  team_id: z.string(),
  team: z.string(),
  code: z.string(),
  finish_1_prob: z.number(),
  finish_2_prob: z.number(),
  finish_3_prob: z.number(),
  finish_4_prob: z.number(),
  top_2_prob: z.number(),
  top_3_prob: z.number(),
  finish_1_prob_label: z.string(),
  finish_2_prob_label: z.string(),
  finish_3_prob_label: z.string(),
  finish_4_prob_label: z.string(),
  top_2_prob_label: z.string(),
  top_3_prob_label: z.string(),
});

const qualificationOddsSchema = z.object({
  team_id: z.string(),
  team: z.string(),
  code: z.string(),
  group: z.string(),
  qualify_prob: z.number(),
  first_prob: z.number(),
  second_prob: z.number(),
  third_qualify_prob: z.number(),
  qualify_prob_label: z.string(),
  first_prob_label: z.string(),
  second_prob_label: z.string(),
  third_qualify_prob_label: z.string(),
});

const roundOddsSchema = z.object({
  team_id: z.string(),
  team: z.string(),
  code: z.string(),
  group: z.string(),
  r32_prob: z.number(),
  r16_prob: z.number(),
  qf_prob: z.number(),
  sf_prob: z.number(),
  final_prob: z.number(),
  champion_prob: z.number(),
  r32_prob_label: z.string(),
  r16_prob_label: z.string(),
  qf_prob_label: z.string(),
  sf_prob_label: z.string(),
  final_prob_label: z.string(),
  champion_prob_label: z.string(),
});

const oddsSchema = z.object({
  group_finish: z.record(z.string(), z.array(groupFinishProbabilitySchema)),
  qualification: z.array(qualificationOddsSchema),
  round: z.array(roundOddsSchema),
});

const movementMetricSchema = z.enum([
  "champion_prob",
  "final_prob",
  "qualify_prob",
]);

const movementMoverSchema = z.object({
  code: z.string(),
  team: z.string(),
  metric: movementMetricSchema,
  delta: z.number(),
  previous: z.number(),
  current: z.number(),
});

const topChampionChangeSchema = z.object({
  code: z.string(),
  team: z.string(),
  rank: z.number(),
  delta: z.number(),
  previous: z.number(),
  current: z.number(),
});

const movementSchema = z.object({
  has_baseline: z.boolean(),
  baseline_generated_at: z.string().nullable(),
  biggest_movers: z.array(movementMoverSchema),
  top_champion_changes: z.array(topChampionChangeSchema),
});

const liveMatchSummarySchema = z.object({
  match_id: z.number(),
  group: z.string(),
  kickoff: z.string(),
  home_team: z.string(),
  home_code: z.string(),
  away_team: z.string(),
  away_code: z.string(),
  status: z.string(),
  home_score: z.number().nullable(),
  away_score: z.number().nullable(),
});

const liveContextSchema = z.object({
  days_to_final: z.number(),
  final_kickoff: z.string(),
  in_progress_matches: z.array(liveMatchSummarySchema),
  next_match: liveMatchSummarySchema.nullable(),
});

const modelQualitySchema = z.object({
  confidence_score: z.number(),
  confidence_label: z.string(),
  confidence_percent: z.number(),
  components: z.object({
    simulation_factor: z.number(),
    group_stage_completeness: z.number(),
    backtest_calibration: z.number(),
  }),
  backtest_reference: z.string(),
  backtest_round_of_16_overlap: z.number(),
});

const pathDifficultySchema = z.object({
  code: z.string(),
  team: z.string(),
  rank: z.number(),
  score: z.number(),
  label: z.string(),
  avg_opponent_rating: z.number(),
  notes: z.string(),
});

const liveAccuracyMetricSchema = z.object({
  round: z.string(),
  predicted_top_n: z.number(),
  actual_teams_in_top_n: z.number(),
  top_n: z.number(),
});

const liveAccuracySchema = z.object({
  available: z.boolean(),
  round_metrics: z.array(liveAccuracyMetricSchema),
  summary: z.string().nullable(),
});

const marketComparisonTeamSchema = z.object({
  code: z.string(),
  team: z.string(),
  model_champion_prob: z.number(),
  market_implied_prob: z.number(),
  delta: z.number(),
  decimal_odds: z.number(),
});

const marketComparisonSummarySchema = z.object({
  model_favorite_code: z.string(),
  model_favorite_team: z.string(),
  market_favorite_code: z.string(),
  market_favorite_team: z.string(),
  mean_absolute_gap: z.number(),
  compared_team_count: z.number(),
  favorites_agree: z.boolean(),
});

const marketComparisonSchema = z.object({
  available: z.boolean(),
  source: z.string().nullable(),
  as_of: z.string().nullable(),
  methodology: z.string(),
  teams: z.array(marketComparisonTeamSchema),
  summary: marketComparisonSummarySchema.nullable(),
});

export const appStateSchema = z.object({
  metadata: metadataSchema,
  coverage: z.array(groupCoverageSchema),
  fixtures: z.array(fixtureMatchSchema),
  standings: z.array(groupStandingSchema),
  third_place: z.array(thirdPlaceEntrySchema),
  projected_qualifiers: z.array(projectedQualifierSchema),
  bracket: bracketSchema,
  odds: oddsSchema,
  movement: movementSchema.optional(),
  live_context: liveContextSchema.optional(),
  model_quality: modelQualitySchema.optional(),
  path_difficulty: z.array(pathDifficultySchema).optional(),
  live_accuracy: liveAccuracySchema.optional(),
  market_comparison: marketComparisonSchema.optional(),
});

export type ValidatedAppState = z.infer<typeof appStateSchema>;

export function parseAppState(data: unknown): ValidatedAppState {
  return appStateSchema.parse(data);
}
