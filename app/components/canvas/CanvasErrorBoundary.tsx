"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "../shared/ErrorFallback";

type CanvasErrorBoundaryProps = {
  children: ReactNode;
  onReset?: () => void;
};

type CanvasErrorBoundaryState = {
  error: Error | null;
};

export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Canvas error boundary:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback-stage">
          <ErrorFallback
            error={this.state.error}
            message="Something broke in the canvas view. Your saved layout in this browser should still be there — try again or reload."
            onRetry={this.handleRetry}
            showReload
            title="Canvas ran into a problem"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
