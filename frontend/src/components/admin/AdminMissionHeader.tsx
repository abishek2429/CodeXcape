import React from 'react';
import { ShieldAlert, Radio } from 'lucide-react';
import './AdminMissionHeader.css';

interface AdminMissionHeaderProps {
  eventStatus?: string;
  totalTeams?: number;
  completedTeams?: number;
  activeTeams?: number;
  connectionsCount?: string;
  rightAction?: React.ReactNode;
}

export const AdminMissionHeader: React.FC<AdminMissionHeaderProps> = ({
  eventStatus = 'LIVE',
  totalTeams = 0,
  completedTeams = 0,
  activeTeams = 0,
  connectionsCount = '0 / 0',
  rightAction,
}) => {
  const isLive = eventStatus === 'RUNNING' || eventStatus === 'LIVE';

  return (
    <header className="admin-mission-header">
      <div className="admin-mission-brand">
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(225, 29, 72, 0.12)',
            border: '1px solid var(--accent-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-crimson)',
          }}
        >
          <ShieldAlert size={18} />
        </div>
        <div>
          <div className="admin-mission-title">
            <span>CODEXCAPE</span>
            <span style={{ color: 'var(--accent-crimson)' }}>//</span>
            <span style={{ color: 'var(--accent-cyan)' }}>MISSION CONTROL</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            EVENT COMMAND & TELEMETRY CENTER
          </div>
        </div>
      </div>

      <div className="admin-telemetry-counters">
        {/* Event Status */}
        <div className="admin-counter-pill">
          <span className="admin-counter-label">EVENT STATUS</span>
          <span className={`admin-counter-value ${isLive ? 'value-live' : 'value-warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={12} className={isLive ? 'animate-pulse' : ''} />
            {eventStatus}
          </span>
        </div>

        {/* Active Teams */}
        <div className="admin-counter-pill">
          <span className="admin-counter-label">ACTIVE TEAMS</span>
          <span className="admin-counter-value value-cyan">{activeTeams}</span>
        </div>

        {/* Completed */}
        <div className="admin-counter-pill">
          <span className="admin-counter-label">COMPLETED</span>
          <span className="admin-counter-value value-live">{completedTeams}</span>
        </div>

        {/* In Progress */}
        <div className="admin-counter-pill">
          <span className="admin-counter-label">IN PROGRESS</span>
          <span className="admin-counter-value value-warning">
            {Math.max(0, totalTeams - completedTeams)}
          </span>
        </div>

        {/* Connections */}
        <div className="admin-counter-pill">
          <span className="admin-counter-label">CONNECTIONS</span>
          <span className="admin-counter-value">{connectionsCount}</span>
        </div>

        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};
