'use client';

import { Button, Result } from 'antd';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle={error?.message || 'An unexpected error occurred.'}
      extra={
        <Button type="primary" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
