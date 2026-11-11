'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import {
  NETWORK_EVENT,
  getApiErrorMessage,
  isNetworkUnavailableError,
} from '@/lib/errors';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  const isNetwork = isNetworkUnavailableError(error);

  useEffect(() => {
    if (!isNetwork || typeof window === 'undefined') return undefined;
    const handleRestored = () => reset();
    window.addEventListener(NETWORK_EVENT.RESTORED, handleRestored);
    return () => {
      window.removeEventListener(NETWORK_EVENT.RESTORED, handleRestored);
    };
  }, [isNetwork, reset]);

  return (
    <div id="app-error-boundary" className="app-error-boundary">
      <Result
        status="error"
        title={
          isNetwork ? (
            <span>Network unavailable</span>
          ) : (
            <span>Something went wrong</span>
          )
        }
        subTitle={
          isNetwork ? (
            <span>Waiting for your connection to return.</span>
          ) : (
            <span>
              {getApiErrorMessage(error, 'An unexpected error occurred.')}
            </span>
          )
        }
        extra={
          <Button type="primary" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
