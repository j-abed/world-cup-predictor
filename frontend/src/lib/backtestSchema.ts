import { z } from "zod";
import type { Backtest2022 } from "../types/backtest";

const backtestMetadataSchema = z.object({
  tournament: z.string(),
  label: z.string(),
  simulations: z.number(),
  seed: z.number(),
  ratings_as_of: z.string(),
  ratings_source: z.string(),
  methodology: z.string(),
});

const backtestSummarySchema = z.object({
  actual_champion: z.string(),
  actual_champion_team: z.string(),
  predicted_champion_rank: z.number(),
  predicted_champion_probability: z.number(),
  team_count: z.number(),
});

const backtestRoundMetricSchema = z.object({
  round: z.string(),
  predicted_top_n: z.number(),
  actual_teams_in_top_n: z.number(),
  top_n: z.number(),
});

const backtestTeamSchema = z.object({
  team_id: z.string(),
  team: z.string(),
  code: z.string(),
  group: z.string(),
  qualify_prob: z.number(),
  champion_prob: z.number(),
  actual_made_round_of_16: z.boolean(),
  actual_champion: z.boolean(),
});

const backtestUpsetSchema = z.object({
  match: z.string(),
  note: z.string(),
});

const backtestStandingSchema = z.object({
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

const backtest2022Schema = z.object({
  metadata: backtestMetadataSchema,
  summary: backtestSummarySchema,
  round_metrics: z.array(backtestRoundMetricSchema),
  teams: z.array(backtestTeamSchema),
  notable_upsets: z.array(backtestUpsetSchema),
  actual_round_teams: z.record(z.string(), z.array(z.string())),
  standings: z.array(backtestStandingSchema),
});

export function parseBacktest2022(data: unknown): Backtest2022 {
  return backtest2022Schema.parse(data);
}
