import type { Bracket, BracketMatch, QualificationOdds, RoundOdds } from "../types";
import { ROUND_SEQUENCE } from "./bracket";

export interface PathTimelineStep {
  stage: string;
  shortLabel: string;
  detail: string;
  prob: number;
  probLabel: string;
}

function findMatchById(bracket: Bracket, matchId: number): BracketMatch | undefined {
  for (const roundKey of ROUND_SEQUENCE) {
    const match = bracket[roundKey].find((entry) => entry.match_id === matchId);

    if (match) {
      return match;
    }
  }

  return undefined;
}

function roundOddsByCode(round: RoundOdds[]): Map<string, RoundOdds> {
  return new Map(round.map((entry) => [entry.code, entry]));
}

function extractMatchId(source: string | null): number | null {
  if (!source) {
    return null;
  }

  const matchId = Number(source.match(/(\d+)/)?.[1]);

  return Number.isFinite(matchId) ? matchId : null;
}

function favoriteTeamName(
  match: BracketMatch,
  oddsByCode: Map<string, RoundOdds>,
): string {
  const homeCode = match.home.code;
  const awayCode = match.away.code;

  if (homeCode && homeCode !== "TBD" && awayCode && awayCode !== "TBD") {
    const homeProb = oddsByCode.get(homeCode)?.champion_prob ?? 0;
    const awayProb = oddsByCode.get(awayCode)?.champion_prob ?? 0;

    return homeProb >= awayProb
      ? (match.home.team ?? homeCode)
      : (match.away.team ?? awayCode);
  }

  if (homeCode && homeCode !== "TBD") {
    return match.home.team ?? homeCode;
  }

  if (awayCode && awayCode !== "TBD") {
    return match.away.team ?? awayCode;
  }

  return "TBD";
}

function opponentFromWinnerSource(
  source: string | null,
  bracket: Bracket,
  oddsByCode: Map<string, RoundOdds>,
): string {
  const matchId = extractMatchId(source);

  if (matchId === null) {
    return "TBD";
  }

  const feeder = findMatchById(bracket, matchId);

  if (!feeder) {
    return "TBD";
  }

  return favoriteTeamName(feeder, oddsByCode);
}

function opponentFromOtherFeeder(
  match: BracketMatch,
  ourFeederMatchId: number,
  bracket: Bracket,
  oddsByCode: Map<string, RoundOdds>,
): string {
  const homeFeederId = extractMatchId(match.home.source);
  const opponentSource =
    homeFeederId === ourFeederMatchId ? match.away.source : match.home.source;

  return opponentFromWinnerSource(opponentSource, bracket, oddsByCode);
}

function directOpponent(match: BracketMatch, code: string): string {
  if (match.home.code === code) {
    return match.away.team ?? "TBD";
  }

  if (match.away.code === code) {
    return match.home.team ?? "TBD";
  }

  return "TBD";
}

const ROUND_SHORT: Record<string, string> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  Quarterfinals: "QF",
  Semifinals: "SF",
  Final: "Final",
};

export function buildPathToFinal(
  code: string,
  bracket: Bracket,
  round: RoundOdds[],
  qualification: QualificationOdds[],
): PathTimelineStep[] {
  const teamOdds = round.find((entry) => entry.code === code);
  const teamQual = qualification.find((entry) => entry.code === code);

  if (!teamOdds) {
    return [];
  }

  const oddsByCode = roundOddsByCode(round);
  const steps: PathTimelineStep[] = [
    {
      stage: "group",
      shortLabel: `GRP ${teamOdds.group}`,
      detail: "1st place",
      prob: teamQual?.first_prob ?? 0,
      probLabel: teamQual?.first_prob_label.trim() ?? "—",
    },
  ];

  const entryMatch = bracket.round_of_32.find(
    (match) => match.home.code === code || match.away.code === code,
  );

  if (!entryMatch?.match_id) {
    return steps;
  }

  const knockoutProbs = [
    { prob: teamOdds.r32_prob, label: teamOdds.r32_prob_label },
    { prob: teamOdds.r16_prob, label: teamOdds.r16_prob_label },
    { prob: teamOdds.qf_prob, label: teamOdds.qf_prob_label },
    { prob: teamOdds.sf_prob, label: teamOdds.sf_prob_label },
    { prob: teamOdds.champion_prob, label: teamOdds.champion_prob_label },
  ];

  let current: BracketMatch | undefined = entryMatch;
  let previousMatchId = entryMatch.match_id;

  for (let index = 0; index < knockoutProbs.length; index += 1) {
    if (!current) {
      break;
    }

    const opponentName =
      index === 0
        ? directOpponent(current, code)
        : opponentFromOtherFeeder(
            current,
            previousMatchId,
            bracket,
            oddsByCode,
          );

    const roundShort =
      ROUND_SHORT[current.round] ?? current.round.slice(0, 3).toUpperCase();
    const probEntry = knockoutProbs[index];

    steps.push({
      stage: roundShort.toLowerCase(),
      shortLabel: roundShort,
      detail: opponentName,
      prob: probEntry.prob,
      probLabel: probEntry.label.trim(),
    });

    if (!current.winner_advances_to) {
      break;
    }

    previousMatchId = current.match_id ?? previousMatchId;
    current = findMatchById(bracket, current.winner_advances_to);
  }

  return steps;
}

export function computeVolatility(team: RoundOdds): number {
  const probs = [
    team.r32_prob,
    team.r16_prob,
    team.qf_prob,
    team.sf_prob,
    team.final_prob,
    team.champion_prob,
  ];
  const drops = probs.slice(1).map((value, dropIndex) => probs[dropIndex] - value);
  const mean = drops.reduce((sum, value) => sum + value, 0) / drops.length;
  const variance =
    drops.reduce((sum, value) => sum + (value - mean) ** 2, 0) / drops.length;

  return Math.round(Math.sqrt(variance) * 1000) / 10;
}

export function trendSeries(team: RoundOdds, delta?: number): number[] {
  const base = [
    team.r32_prob,
    team.r16_prob,
    team.qf_prob,
    team.sf_prob,
    team.final_prob,
    team.champion_prob,
  ];

  if (delta === undefined || delta === 0) {
    return base;
  }

  return [
    ...base.slice(0, -1),
    Math.max(0, team.champion_prob - delta),
    team.champion_prob,
  ];
}
