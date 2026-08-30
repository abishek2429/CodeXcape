import React from 'react';

type Status = 'connected' | 'active' | 'disconnected' | 'pending';

interface StatusDotProps {
  status: Status;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '' }) => {
  return (
    <span 
      className={`indicator-dot indicator-${status} ${className}`} 
      title={`Status: ${status}`}
    />
  );
};
