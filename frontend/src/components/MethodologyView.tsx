import type { AppState } from "../types";
import { GuidePage } from "../pages/GuidePage";

interface MethodologyViewProps {
  appState: AppState;
}

export function MethodologyView({ appState }: MethodologyViewProps) {
  return <GuidePage appState={appState} mode="embedded" />;
}
