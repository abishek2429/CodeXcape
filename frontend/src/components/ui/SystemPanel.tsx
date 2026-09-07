import React from 'react';
import './SystemPanel.css';

interface SystemPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  systemId?: string;
  title?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: 'normal' | 'cyan' | 'crimson';
  showNotches?: boolean;
  className?: string;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  children,
  systemId,
  title,
  icon,
  headerAction,
  variant = 'normal',
  showNotches = true,
  className = '',
  ...rest
}) => {
  return (
    <div className={`system-panel system-panel-${variant} ${className}`} {...rest}>
      {showNotches && (
        <>
          <div className="system-panel-notch-tl" />
          <div className="system-panel-notch-tr" />
          <div className="system-panel-notch-bl" />
          <div className="system-panel-notch-br" />
        </>
      )}

      {(title || systemId || headerAction) && (
        <div className="system-panel-header">
          <div className="system-panel-title-group">
            {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
            {systemId && <span className="system-panel-tag">[{systemId}]</span>}
            {title && <span className="system-panel-title">{title}</span>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className="system-panel-body">{children}</div>
    </div>
  );
};
