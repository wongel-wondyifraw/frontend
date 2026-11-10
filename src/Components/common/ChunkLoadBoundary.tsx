'use client';

import React, { Component, type ReactNode } from 'react';
import { NETWORK_EVENT } from '@/lib/errors';

interface ChunkLoadBoundaryProps {
  id?: string;
  renderFallback: (error: Error, retry: () => void) => ReactNode;
  onRetry?: () => Promise<unknown> | void;
  children: ReactNode;
}

interface ChunkLoadBoundaryState {
  error: Error | null;
  retryCount: number;
}

export default class ChunkLoadBoundary extends Component<
  ChunkLoadBoundaryProps,
  ChunkLoadBoundaryState
> {
  state: ChunkLoadBoundaryState = {
    error: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ChunkLoadBoundaryState> {
    return { error };
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener(NETWORK_EVENT.RESTORED, this.handleNetworkRestored);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        NETWORK_EVENT.RESTORED,
        this.handleNetworkRestored,
      );
    }
  }

  handleNetworkRestored = () => {
    if (this.state.error !== null) {
      void this.handleRetry();
    }
  };

  handleRetry = async () => {
    try {
      await this.props.onRetry?.();
    } catch {
      // Keep retrying re-mount even if prefetcher rejects transiently.
    }
    this.setState((prev) => ({
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.error) {
      return this.props.renderFallback(this.state.error, () => {
        void this.handleRetry();
      });
    }

    return (
      <div
        key={this.state.retryCount}
        id={this.props.id}
        className="chunk-load-boundary"
      >
        {this.props.children}
      </div>
    );
  }
}

