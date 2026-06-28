import { useEffect, useRef } from "react";
import type { TeamProfile } from "../lib/team";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamBadge } from "./TeamBadge";

interface TeamDetailProps {
  team: TeamProfile | null;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 2l10 10M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TeamDetail({ team, onClose }: TeamDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (team) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [team]);

  // Sync native ESC close event back to React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="team-detail-dialog"
      aria-label={team ? `${team.team} details` : "Team details"}
      onClick={handleBackdropClick}
    >
      {team ? <TeamDetailPanel team={team} onClose={onClose} /> : null}
    </dialog>
  );
}

function TeamDetailPanel({
  team,
  onClose,
}: {
  team: TeamProfile;
  onClose: () => void;
}) {
  const {
    standing,
    thirdPlace,
    qualifier,
    qualificationOdds,
    roundOdds,
    groupFinishOdds,
  } = team;

  return (
    <div
      className="team-detail-panel animate-in slide-in-from-right duration-300 ease-out"
      data-group={team.group ?? undefined}
    >
      <button
        type="button"
        onClick={onClose}
        className="team-detail-close"
        aria-label="Close team detail"
        autoFocus
      >
        <CloseIcon />
      </button>

      <div className="team-detail-header">
        <TeamBadge code={team.code} size="lg" />
        <div>
          <h2 className="team-detail-title">{team.team}</h2>
          {team.group && (
            <p className="team-detail-group">Group {team.group}</p>
          )}
        </div>
      </div>

      {standing && (
        <TeamDetailSection title="Group Record">
          <div className="team-detail-stats">
            <MiniStat label="Rank" value={`#${standing.rank}`} />
            <MiniStat label="Played" value={String(standing.played)} />
            <MiniStat
              label="W–D–L"
              value={`${standing.wins}–${standing.draws}–${standing.losses}`}
            />
            <MiniStat
              label="Points"
              value={String(standing.points)}
              emphasize
            />
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
        </TeamDetailSection>
      )}

      {(qualifier || thirdPlace) && (
        <TeamDetailSection title="Qualification Path">
          {qualifier && (
            <p className="team-detail-prose">
              Projected as{" "}
              <span className="team-detail-prose__strong">
                {qualifier.qualifying_path}
              </span>{" "}
              ({qualifier.source}), seed #{qualifier.seed}.
            </p>
          )}
          {thirdPlace && (
            <p className="team-detail-prose" style={{ marginTop: "0.35rem" }}>
              Ranked{" "}
              <span className="team-detail-prose__strong">
                #{thirdPlace.third_rank}
              </span>{" "}
              among third-place teams —{" "}
              <span
                className={
                  thirdPlace.currently_qualifies
                    ? "team-detail-prose__qualify"
                    : "team-detail-prose__eliminate"
                }
              >
                {thirdPlace.currently_qualifies
                  ? "would qualify today"
                  : "would not qualify today"}
              </span>
              .
            </p>
          )}
        </TeamDetailSection>
      )}

      {roundOdds && (
        <TeamDetailSection title="Tournament Progression">
          <div className="team-detail-bars">
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
        </TeamDetailSection>
      )}

      {qualificationOdds && (
        <TeamDetailSection title="Group Stage Odds">
          <div className="team-detail-bars">
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
        </TeamDetailSection>
      )}

      {groupFinishOdds && (
        <TeamDetailSection
          title={
            team.group ? `Group ${team.group} Finish Odds` : "Group Finish Odds"
          }
        >
          <div className="team-detail-bars">
            <ProbabilityBar
              label="Finish 1st"
              value={groupFinishOdds.finish_1_prob}
              valueLabel={groupFinishOdds.finish_1_prob_label}
              tone="gold"
            />
            <ProbabilityBar
              label="Finish 2nd"
              value={groupFinishOdds.finish_2_prob}
              valueLabel={groupFinishOdds.finish_2_prob_label}
              tone="neutral"
            />
            <ProbabilityBar
              label="Finish 3rd"
              value={groupFinishOdds.finish_3_prob}
              valueLabel={groupFinishOdds.finish_3_prob_label}
              tone="crimson"
            />
            <ProbabilityBar
              label="Finish 4th"
              value={groupFinishOdds.finish_4_prob}
              valueLabel={groupFinishOdds.finish_4_prob_label}
              tone="crimson"
            />
          </div>
        </TeamDetailSection>
      )}
    </div>
  );
}

function TeamDetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="team-detail-section">
      <h3 className="team-detail-section-title">{title}</h3>
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
    <div className="team-detail-stat">
      <div className="team-detail-stat__label">{label}</div>
      <div
        className={`team-detail-stat__value${emphasize ? " team-detail-stat__value--gold" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
