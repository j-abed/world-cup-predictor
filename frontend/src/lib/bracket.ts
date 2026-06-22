import type { Bracket, BracketMatch, BracketRoundKey } from "../types";

export const ROUND_SEQUENCE: BracketRoundKey[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinals",
  "semifinals",
  "final",
];

/**
 * Bracket rounds aren't guaranteed to be in an order where consecutive
 * matches feed the same next-round match. Reorder a round's matches so that
 * every consecutive pair feeds the same match in `nextRound`, in the same
 * left-to-right order as `nextRound` itself. This is what lets the bracket
 * UI draw connector lines between adjacent cards.
 */
export function orderFeeders(
  round: BracketMatch[],
  nextRound: BracketMatch[],
): BracketMatch[] {
  const feedersByTarget = new Map<number, BracketMatch[]>();

  for (const match of round) {
    if (match.winner_advances_to == null) continue;
    const feeders = feedersByTarget.get(match.winner_advances_to) ?? [];
    feeders.push(match);
    feedersByTarget.set(match.winner_advances_to, feeders);
  }

  const ordered: BracketMatch[] = [];
  const placed = new Set<string>();

  for (const next of nextRound) {
    if (next.match_id == null) continue;
    const feeders = (feedersByTarget.get(next.match_id) ?? []).sort(
      (a, b) => (a.match_id ?? 0) - (b.match_id ?? 0),
    );
    for (const feeder of feeders) {
      ordered.push(feeder);
      placed.add(feeder.slot_id);
    }
  }

  for (const match of round) {
    if (!placed.has(match.slot_id)) ordered.push(match);
  }

  return ordered;
}

/** Every round, correctly ordered so adjacent matches pair up across rounds. */
export function orderedBracketRounds(bracket: Bracket): Record<BracketRoundKey, BracketMatch[]> {
  const ordered: Partial<Record<BracketRoundKey, BracketMatch[]>> = {
    final: bracket.final,
  };

  for (let i = ROUND_SEQUENCE.length - 2; i >= 0; i -= 1) {
    const roundKey = ROUND_SEQUENCE[i];
    const nextKey = ROUND_SEQUENCE[i + 1];
    const nextOrdered = ordered[nextKey] ?? bracket[nextKey];
    ordered[roundKey] = orderFeeders(bracket[roundKey], nextOrdered);
  }

  return ordered as Record<BracketRoundKey, BracketMatch[]>;
}

export function pairUp<T>(items: T[]): [T, T | undefined][] {
  const pairs: [T, T | undefined][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1]]);
  }
  return pairs;
}
