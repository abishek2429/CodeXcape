import React from 'react';
import { StatusIndicator, SystemStatusType } from './StatusIndicator';
import './SystemHeader.css';

interface SystemHeaderProps {
  systemLabel?: string;
  status?: SystemStatusType;
  statusText?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  systemLabel = 'CODEXCAPE // RESTRICTED KERNEL',
  status = 'connected',
  statusText,
  leftSlot,
  rightSlot,
  className = '',
}) => {
  return (
    <header className={`system-header-bar ${className}`}>
      <div className="system-header-left">
        {leftSlot}
        <span className="system-header-label">{systemLabel}</span>
      </div>

      <div className="system-header-right">
        <StatusIndicator status={status} label={statusText} />
        {rightSlot}
      </div>
    </header>
  );
};
