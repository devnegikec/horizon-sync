import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

interface WidgetErrorBoundaryProps {
  title: string;
  /**
   * Remounts the recovery state when this value changes. Bump it on refresh /
   * filter changes so the user can retry a widget that already failed.
   */
  resetKey?: unknown;
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  error: string | null;
}

/**
 * A thrown `Error` can have an empty `message` (e.g. `throw new Error()`), so
 * the fallback needs its own text rather than relying on truthiness of the
 * message.
 */
const FALLBACK_MESSAGE = 'An unexpected error occurred while rendering this widget.';

/** Keeps a single failing widget from taking down the whole dashboard section. */
export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error: error.message || FALLBACK_MESSAGE };
  }

  componentDidUpdate(previous: WidgetErrorBoundaryProps): void {
    const { error } = this.state;
    const { resetKey } = this.props;
    if (error !== null && previous.resetKey !== resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    const { title, children } = this.props;
    if (error !== null) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm font-medium">{title} failed to render</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      );
    }
    return children;
  }
}
