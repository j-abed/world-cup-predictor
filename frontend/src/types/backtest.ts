export interface BacktestMetadata {
  tournament: string;
  label: string;
  simulations: number;
  seed: number;
  ratings_as_of: string;
  ratings_source: string;
  methodology: string;
}

export interface BacktestSummary {
  actual_champion: string;
  actual_champion_team: string;
  predicted_champion_rank: number;
  predicted_champion_probability: number;
  team_count: number;
}

export interface BacktestRoundMetric {
  round: string;
  predicted_top_n: number;
  actual_teams_in_top_n: number;
  top_n: number;
}

export interface BacktestTeam {
  team_id: string;
  team: string;
  code: string;
  group: string;
  qualify_prob: number;
  champion_prob: number;
  actual_made_round_of_16: boolean;
  actual_champion: boolean;
}

export interface BacktestUpset {
  match: string;
  note: string;
}

export interface BacktestStanding {
  group_code: string;
  rank: number;
  team_id: string;
  team: string;
  code: string;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface Backtest2022 {
  metadata: BacktestMetadata;
  summary: BacktestSummary;
  round_metrics: BacktestRoundMetric[];
  teams: BacktestTeam[];
  notable_upsets: BacktestUpset[];
  actual_round_teams: Record<string, string[]>;
  standings: BacktestStanding[];
}
