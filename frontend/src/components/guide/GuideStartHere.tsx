import { GuideList } from "./GuideSection";

export function GuideStartHere() {
  return (
    <aside className="guide-start-here" aria-label="Start here">
      <p className="guide-start-here__title">Start here</p>
      <GuideList
        items={[
          <>
            <strong>Percentages = frequencies</strong>, not promises. 14% title
            odds means the team wins in roughly 14% of simulated replays from
            today&apos;s snapshot.
          </>,
          <>
            <strong>Simulations run offline.</strong> The site loads{" "}
            <code className="guide-inline-code">app_state.json</code>; everyone
            sees the same numbers for a given export time.
          </>,
          <>
            <strong>Not betting advice.</strong> Markets and models can
            disagree; neither is ground truth.
          </>,
        ]}
      />
    </aside>
  );
}
