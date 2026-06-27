import { Component, type ErrorInfo, type ReactNode } from "react";

interface TabErrorBoundaryProps {
  tabLabel: string;
  children: ReactNode;
}

interface TabErrorBoundaryState {
  error: Error | null;
}

export class TabErrorBoundary extends Component<
  TabErrorBoundaryProps,
  TabErrorBoundaryState
> {
  state: TabErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Tab render error (${this.props.tabLabel}):`, error, info);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="pitch-card rounded-2xl border border-destructive/40 p-6 text-center"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong in {this.props.tabLabel}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This tab hit an unexpected error. Other tabs should still work — try
            switching away and back, or reload the page.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
