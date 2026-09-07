import React from 'react';
import { Info, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ScrambledText } from '../cinematic/ScrambledText';
import './SystemMessage.css';

export type SystemMessageType = 'info' | 'success' | 'warning' | 'danger';

interface SystemMessageProps {
  message: string;
  type?: SystemMessageType;
  withScramble?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  message,
  type = 'info',
  withScramble = false,
  action,
  className = '',
}) => {
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--status-success)" />;
      case 'warning':
        return <AlertTriangle size={16} color="var(--status-warning)" />;
      case 'danger':
        return <ShieldAlert size={16} color="var(--accent-crimson)" />;
      case 'info':
      default:
        return <Info size={16} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div className={`system-message-banner system-message-${type} ${className}`} role="alert">
      <div style={{ display: 'flex', alignItems: 'center' }}>{renderIcon()}</div>
      <div className="system-message-text">
        {withScramble ? <ScrambledText text={message} glitchRate={0.08} /> : message}
      </div>
      {action && <div className="system-message-action">{action}</div>}
    </div>
  );
};
