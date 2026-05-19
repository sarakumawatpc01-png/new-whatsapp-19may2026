"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@repo/ui";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            An unexpected error occurred. We've been notified and are looking into it.
          </p>
          <div className="flex gap-4 pt-4">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            <Button variant="outline" onClick={() => this.setState({ hasError: false })}>Try Again</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
