import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

interface WidgetErrorBoundaryProps {
  title: string;
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  error: string | null;
}

/** Keeps a single failing widget from taking down the whole dashboard section. */
export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error: error.message };
  }

  render() {
    const { error } = this.state;
    const { title, children } = this.props;
    if (error) {
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
