import { useEffect } from "react";
import type { TeamProfile } from "../lib/team";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface TeamDetailProps {
  team: TeamProfile | null;
  onClose: () => void;
}

export function TeamDetail({ team, onClose }: TeamDetailProps) {
  useEffect(() => {
    if (!team) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [team, onClose]);

  if (!team) return null;

  const { standing, thirdPlace, qualifier, qualificationOdds, roundOdds, groupDOdds } =
    team;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close team detail"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-pitch-700 bg-pitch-900 p-6 shadow-2xl animate-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-pitch-700 p-1.5 text-pitch-400 transition hover:border-pitch-500 hover:text-pitch-100"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-4 pr-8">
          <TeamBadge code={team.code} size="lg" />
          <div>
            <h2 className="font-display text-2xl font-bold text-pitch-100">
              {team.team}
            </h2>
            {team.group && (
              <p className="text-sm text-pitch-400">Group {team.group}</p>
            )}
          </div>
        </div>

        {standing && (
          <Section title="Group Record">
            <div className="grid grid-cols-4 gap-2 text-center sm:grid-cols-4">
              <MiniStat label="Rank" value={`#${standing.rank}`} />
              <MiniStat label="Pld" value={String(standing.played)} />
              <MiniStat
                label="W–D–L"
                value={`${standing.wins}–${standing.draws}–${standing.losses}`}
              />
              <MiniStat label="Pts" value={String(standing.points)} emphasize />
              <MiniStat label="GF" value={String(standing.goals_for)} />
              <MiniStat label="GA" value={String(standing.goals_against)} />
              <MiniStat
                label="GD"
                value={
                  standing.goal_difference > 0
                    ? `+${standing.goal_difference}`
                    : String(standing.goal_difference)
                }
              />
            </div>
          </Section>
        )}

        {(qualifier || thirdPlace) && (
          <Section title="Qualification Path">
            {qualifier && (
              <p className="text-sm text-pitch-300">
                Projected as{" "}
                <span className="font-medium text-pitch-100">
                  {qualifier.qualifying_path}
                </span>{" "}
                ({qualifier.source}), seed #{qualifier.seed}.
              </p>
            )}
            {thirdPlace && (
              <p className="mt-1.5 text-sm text-pitch-300">
                Ranked{" "}
                <span className="font-medium text-pitch-100">
                  #{thirdPlace.third_rank}
                </span>{" "}
                among third-place teams —{" "}
                <span
                  className={
                    thirdPlace.currently_qualifies
                      ? "font-medium text-emerald-400"
                      : "text-crimson-400"
                  }
                >
                  {thirdPlace.currently_qualifies
                    ? "currently qualifying"
                    : "currently eliminated"}
                </span>
                .
              </p>
            )}
          </Section>
        )}

        {roundOdds && (
          <Section title="Tournament Progression Odds">
            <div className="flex flex-col gap-2.5">
              <ProbabilityBar
                label="Reach Round of 32"
                value={roundOdds.r32_prob}
                valueLabel={roundOdds.r32_prob_label}
                tone="neutral"
              />
              <ProbabilityBar
                label="Reach Round of 16"
                value={roundOdds.r16_prob}
                valueLabel={roundOdds.r16_prob_label}
                tone="neutral"
              />
              <ProbabilityBar
                label="Reach Quarterfinals"
                value={roundOdds.qf_prob}
                valueLabel={roundOdds.qf_prob_label}
                tone="emerald"
              />
              <ProbabilityBar
                label="Reach Semifinals"
                value={roundOdds.sf_prob}
                valueLabel={roundOdds.sf_prob_label}
                tone="emerald"
              />
              <ProbabilityBar
                label="Reach Final"
                value={roundOdds.final_prob}
                valueLabel={roundOdds.final_prob_label}
                tone="gold"
              />
              <ProbabilityBar
                label="Win Tournament"
                value={roundOdds.champion_prob}
                valueLabel={roundOdds.champion_prob_label}
                tone="gold"
                size="lg"
              />
            </div>
          </Section>
        )}

        {qualificationOdds && (
          <Section title="Group Stage Odds">
            <div className="flex flex-col gap-2.5">
              <ProbabilityBar
                label="Qualify for knockouts"
                value={qualificationOdds.qualify_prob}
                valueLabel={qualificationOdds.qualify_prob_label}
                tone="emerald"
              />
              <ProbabilityBar
                label="Win group"
                value={qualificationOdds.first_prob}
                valueLabel={qualificationOdds.first_prob_label}
                tone="gold"
              />
              <ProbabilityBar
                label="Finish 2nd"
                value={qualificationOdds.second_prob}
                valueLabel={qualificationOdds.second_prob_label}
                tone="neutral"
              />
              <ProbabilityBar
                label="Qualify as 3rd-place"
                value={qualificationOdds.third_qualify_prob}
                valueLabel={qualificationOdds.third_qualify_prob_label}
                tone="crimson"
              />
            </div>
          </Section>
        )}

        {groupDOdds && (
          <Section title="Group D Finish Odds">
            <div className="flex flex-col gap-2.5">
              <ProbabilityBar
                label="Finish 1st"
                value={groupDOdds.finish_1_prob}
                valueLabel={groupDOdds.finish_1_prob_label}
                tone="gold"
              />
              <ProbabilityBar
                label="Finish 2nd"
                value={groupDOdds.finish_2_prob}
                valueLabel={groupDOdds.finish_2_prob_label}
                tone="neutral"
              />
              <ProbabilityBar
                label="Finish 3rd"
                value={groupDOdds.finish_3_prob}
                valueLabel={groupDOdds.finish_3_prob_label}
                tone="crimson"
              />
              <ProbabilityBar
                label="Finish 4th"
                value={groupDOdds.finish_4_prob}
                valueLabel={groupDOdds.finish_4_prob_label}
                tone="crimson"
              />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 border-t border-pitch-800 pt-5">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-pitch-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg bg-pitch-850 py-2">
      <div className="text-[10px] uppercase tracking-wide text-pitch-500">
        {label}
      </div>
      <div
        className={`font-mono text-sm font-bold tabular-nums ${
          emphasize ? "text-gold-300" : "text-pitch-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
