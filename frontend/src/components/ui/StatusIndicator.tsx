import React from 'react';
import './StatusIndicator.css';

export type SystemStatusType = 'connected' | 'waiting' | 'anomaly' | 'error' | 'offline';

interface StatusIndicatorProps {
  status: SystemStatusType;
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
}) => {
  const displayLabel = label || status.toUpperCase();

  return (
    <div className={`status-indicator status-${status} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{displayLabel}</span>
    </div>
  );
};
