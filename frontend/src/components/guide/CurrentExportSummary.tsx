import type { GuideExportSnapshot } from "../../lib/guideStats";
import { CodeBlock, GuideList, GuideProse } from "./GuideSection";

interface CurrentExportSummaryProps {
  snapshot: GuideExportSnapshot;
}

export function CurrentExportSummary({ snapshot }: CurrentExportSummaryProps) {
  return (
    <>
      <GuideProse>
        The current snapshot reflects the latest exported model state. At the
        time of this export:
      </GuideProse>

      <GuideList
        items={[
          <>
            <strong>Monte Carlo runs:</strong> {snapshot.monteCarloRuns}
          </>,
          <>
            <strong>Group-stage matches complete:</strong>{" "}
            {snapshot.groupResults}
          </>,
          <>
            <strong>Group-stage completion:</strong>{" "}
            {snapshot.groupCompletionPercent}
          </>,
          <>
            <strong>Teams in field:</strong> {snapshot.teamCount}
          </>,
          <>
            <strong>Ratings source:</strong>{" "}
            {snapshot.ratingsSourceUrl ? (
              <a
                href={snapshot.ratingsSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="guide-link"
              >
                {snapshot.ratingsSource}
              </a>
            ) : (
              snapshot.ratingsSource
            )}
          </>,
          <>
            <strong>Export timestamp:</strong> {snapshot.exportTimestamp}
          </>,
          <>
            <strong>Refresh cadence:</strong> {snapshot.refreshCadence}
          </>,
          snapshot.nextRefresh ? (
            <>
              <strong>Next scheduled refresh:</strong> {snapshot.nextRefresh}
            </>
          ) : null,
          <>
            <strong>Projection confidence:</strong>{" "}
            {snapshot.projectionConfidence}
          </>,
          snapshot.liveMatchLabel ? (
            <>
              <strong>Featured match:</strong> {snapshot.liveMatchLabel}
              {snapshot.liveGroupLabel
                ? ` (${snapshot.liveGroupLabel})`
                : null}
            </>
          ) : null,
        ].filter(Boolean)}
      />

      {snapshot.movementBaseline ? (
        <>
          <GuideProse>The latest movement baseline is:</GuideProse>
          <CodeBlock>{snapshot.movementBaseline}</CodeBlock>
        </>
      ) : null}

      {snapshot.biggestMover ? (
        <>
          <GuideProse>The largest recent swing is:</GuideProse>
          <CodeBlock>{snapshot.biggestMover}</CodeBlock>
        </>
      ) : null}

      {snapshot.modelFavorite && snapshot.marketFavorite ? (
        <>
          <GuideProse>
            The model and market currently disagree at the top of the title
            board:
          </GuideProse>
          <GuideList
            items={[
              <>
                <strong>Model favorite:</strong> {snapshot.modelFavorite}
              </>,
              <>
                <strong>Market favorite:</strong> {snapshot.marketFavorite}
              </>,
              snapshot.meanAbsoluteGap ? (
                <>
                  <strong>Mean absolute model-market gap:</strong>{" "}
                  {snapshot.meanAbsoluteGap} across compared teams
                </>
              ) : null,
              snapshot.favoritesAgree === false ? (
                <>The favorites disagree — see the Markets tab for detail.</>
              ) : snapshot.favoritesAgree === true ? (
                <>Both agree on the favorite.</>
              ) : null,
            ].filter(Boolean)}
          />
          <GuideProse>
            That disagreement is not unusual. The model and the market are not
            using identical information, and they may weigh the same information
            differently.
          </GuideProse>
        </>
      ) : null}
    </>
  );
}
