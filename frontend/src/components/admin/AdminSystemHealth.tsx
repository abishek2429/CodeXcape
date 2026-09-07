import React from 'react';
import { Activity } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { SpotlightCard } from '../cinematic/SpotlightCard';

interface AdminSystemHealthProps {
  backendOnline?: boolean;
  databaseOnline?: boolean;
  websocketOnline?: boolean;
  eventStatus?: string;
  activeConnections?: number;
  className?: string;
}

export const AdminSystemHealth: React.FC<AdminSystemHealthProps> = ({
  backendOnline = true,
  databaseOnline = true,
  websocketOnline = true,
  eventStatus = 'LIVE',
  activeConnections = 0,
  className = '',
}) => {
  return (
    <SpotlightCard
      variant="cyan"
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-panel-darker)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        marginBottom: '20px',
      }}
      className={className}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
          <Activity size={14} />
          <span>SYSTEM HEALTH & INFRASTRUCTURE MONITOR</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          SECURE MISSION CONTROL KERNEL
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <StatusIndicator
          status={backendOnline ? 'connected' : 'error'}
          label={`BACKEND ${backendOnline ? 'ONLINE' : 'OFFLINE'}`}
        />

        <StatusIndicator
          status={databaseOnline ? 'connected' : 'error'}
          label={`DATABASE ${databaseOnline ? 'ONLINE' : 'OFFLINE'}`}
        />

        <StatusIndicator
          status={websocketOnline ? 'connected' : 'waiting'}
          label={`WEBSOCKET ${websocketOnline ? 'ONLINE' : 'RECONNECTING'}`}
        />

        <StatusIndicator
          status={eventStatus === 'RUNNING' || eventStatus === 'LIVE' ? 'connected' : 'waiting'}
          label={`EVENT: ${eventStatus}`}
        />

        <div
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>ACTIVE CONNECTIONS:</span>
          <strong style={{ color: 'var(--accent-cyan)', fontSize: '13px' }}>{activeConnections}</strong>
        </div>
      </div>
    </SpotlightCard>
  );
};
