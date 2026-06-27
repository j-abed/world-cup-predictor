// Mirrors outputs/web/app_state.json, produced by src/web_exports.py.
// Keep in sync with that module's payload shape.

export interface SimulationCounts {
  group: number;
  tournament: number;
  round: number;
}

export interface Metadata {
  generated_at: string;
  team_count: number;
  fixture_count: number;
  completed_result_count: number;
  ratings_source: string | null;
  ratings_source_url: string | null;
  rating_type: string | null;
  simulations: SimulationCounts;
  data_caveats: string[];
}

export interface GroupCoverage {
  group: string;
  team_count: number;
  fixture_count: number;
  expected_fixture_count: number;
  has_complete_fixture_set: boolean;
  missing_from_fixtures: string;
  unexpected_in_fixtures: string;
}

export interface FixtureMatch {
  match_id: number;
  group: string;
  kickoff: string;
  home_team_id: string;
  home_team: string;
  home_code: string;
  away_team_id: string;
  away_team: string;
  away_code: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

export interface GroupStanding {
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

export interface ThirdPlaceEntry {
  third_rank: number;
  group: string;
  team: string;
  code: string;
  team_id: string;
  played: number;
  points: number;
  goal_difference: number;
  goals_for: number;
  goals_against: number;
  currently_qualifies: boolean;
}

export interface ProjectedQualifier {
  seed: number;
  source: string;
  group: string;
  qualifying_path: string;
  team: string;
  code: string;
  team_id: string;
  points: number;
  goal_difference: number;
  goals_for: number;
}

export interface BracketTeamSlot {
  source: string | null;
  team: string | null;
  code: string | null;
}

export interface BracketMatch {
  slot_id: string;
  round: string;
  match_id: number | null;
  home: BracketTeamSlot;
  away: BracketTeamSlot;
  winner_advances_to: number | null;
}

export interface Bracket {
  round_of_32: BracketMatch[];
  round_of_16: BracketMatch[];
  quarterfinals: BracketMatch[];
  semifinals: BracketMatch[];
  final: BracketMatch[];
}

export type BracketRoundKey = keyof Bracket;

export interface GroupFinishProbability {
  team_id: string;
  team: string;
  code: string;
  finish_1_prob: number;
  finish_2_prob: number;
  finish_3_prob: number;
  finish_4_prob: number;
  top_2_prob: number;
  top_3_prob: number;
  finish_1_prob_label: string;
  finish_2_prob_label: string;
  finish_3_prob_label: string;
  finish_4_prob_label: string;
  top_2_prob_label: string;
  top_3_prob_label: string;
}

/** @deprecated Use GroupFinishProbability */
export type GroupDProbability = GroupFinishProbability;

export interface QualificationOdds {
  team_id: string;
  team: string;
  code: string;
  group: string;
  qualify_prob: number;
  first_prob: number;
  second_prob: number;
  third_qualify_prob: number;
  qualify_prob_label: string;
  first_prob_label: string;
  second_prob_label: string;
  third_qualify_prob_label: string;
}

export interface RoundOdds {
  team_id: string;
  team: string;
  code: string;
  group: string;
  r32_prob: number;
  r16_prob: number;
  qf_prob: number;
  sf_prob: number;
  final_prob: number;
  champion_prob: number;
  r32_prob_label: string;
  r16_prob_label: string;
  qf_prob_label: string;
  sf_prob_label: string;
  final_prob_label: string;
  champion_prob_label: string;
}

export interface Odds {
  group_finish: Record<string, GroupFinishProbability[]>;
  qualification: QualificationOdds[];
  round: RoundOdds[];
}

export interface AppState {
  metadata: Metadata;
  coverage: GroupCoverage[];
  fixtures: FixtureMatch[];
  standings: GroupStanding[];
  third_place: ThirdPlaceEntry[];
  projected_qualifiers: ProjectedQualifier[];
  bracket: Bracket;
  odds: Odds;
}
