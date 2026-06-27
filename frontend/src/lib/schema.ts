// Runtime validation for outputs/web/app_state.json.
// Keep in sync with src/web_exports.py and types.ts.

import { z } from "zod";

const simulationCountsSchema = z.object({
  group: z.number(),
  tournament: z.number(),
  round: z.number(),
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

export const appStateSchema = z.object({
  metadata: metadataSchema,
  coverage: z.array(groupCoverageSchema),
  fixtures: z.array(fixtureMatchSchema),
  standings: z.array(groupStandingSchema),
  third_place: z.array(thirdPlaceEntrySchema),
  projected_qualifiers: z.array(projectedQualifierSchema),
  bracket: bracketSchema,
  odds: oddsSchema,
});

export type ValidatedAppState = z.infer<typeof appStateSchema>;

export function parseAppState(data: unknown): ValidatedAppState {
  return appStateSchema.parse(data);
}
