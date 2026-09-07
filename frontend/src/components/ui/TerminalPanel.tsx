import React from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { SystemPanel } from './SystemPanel';

interface TerminalPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  systemId?: string;
  title?: string;
  headerAction?: React.ReactNode;
  variant?: 'normal' | 'cyan' | 'crimson';
  className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  children,
  systemId = 'TERM-CONSOLE',
  title = 'TERMINAL',
  headerAction,
  variant = 'cyan',
  className = '',
  ...rest
}) => {
  return (
    <SystemPanel
      systemId={systemId}
      title={title}
      icon={<TerminalIcon size={14} color="var(--accent-cyan)" />}
      headerAction={headerAction}
      variant={variant}
      className={`terminal-panel ${className}`}
      {...rest}
    >
      {children}
    </SystemPanel>
  );
};
