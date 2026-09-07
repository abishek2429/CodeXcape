import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SystemPanel } from './SystemPanel';

interface EvidencePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  systemId?: string;
  title?: string;
  headerAction?: React.ReactNode;
  variant?: 'normal' | 'cyan' | 'crimson';
  className?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  children,
  systemId = 'EVIDENCE-DOSSIER',
  title = 'FORENSIC EVIDENCE',
  headerAction,
  variant = 'crimson',
  className = '',
  ...rest
}) => {
  return (
    <SystemPanel
      systemId={systemId}
      title={title}
      icon={<ShieldAlert size={14} color="var(--accent-crimson)" />}
      headerAction={headerAction}
      variant={variant}
      className={`evidence-panel ${className}`}
      {...rest}
    >
      {children}
    </SystemPanel>
  );
};
