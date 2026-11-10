'use client';

import React from 'react';
import { Button } from 'antd';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useNetwork } from '@/context/NetworkContext';
import './NetworkStatusBanner.css';

export default function NetworkStatusBanner() {
  const { status, checking, checkConnection } = useNetwork();

  if (status === 'online') {
    return null;
  }

  const isRestored = status === 'restored';

  return (
    <div
      id="network-status-banner"
      className={
        isRestored
          ? 'network-status-banner network-status-banner--restored'
          : 'network-status-banner network-status-banner--offline'
      }
      role="status"
      aria-live="polite"
    >
      <div className="network-status-banner-content">
        {isRestored ? (
          <Wifi
            size={16}
            className="network-status-banner-icon"
            aria-hidden="true"
          />
        ) : (
          <WifiOff
            size={16}
            className="network-status-banner-icon"
            aria-hidden="true"
          />
        )}
        {isRestored ? (
          <span className="network-status-banner-text">Network restored</span>
        ) : (
          <span className="network-status-banner-text">Network unavailable</span>
        )}
      </div>
      {!isRestored ? (
        <Button
          size="small"
          type="primary"
          danger
          loading={checking}
          icon={<RefreshCw size={12} />}
          onClick={() => void checkConnection()}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}
