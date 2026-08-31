import React from 'react';
import { Terminal, LogOut, Cpu } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';
import { StatusDot } from '../ui/StatusDot';

interface GameHeaderProps {
  player: PlayerInfo;
  currentLevel: number;
  totalLevels: number;
  connectionStatus: SystemConnectionStatus;
  onLogout: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  player,
  currentLevel,
  totalLevels,
  connectionStatus,
  onLogout,
}) => {
  const isPlayer1 = player.playerNumber === 1;

  return (
    <header className="game-header">
      
      {/* Branding & Team Identifier */}
      <div className="game-header-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-faded)', border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-cyan-text)'
          }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '18px' }}>X</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              <span>CODE</span>
              <span className="title-accent">X</span>
              <span>CAPE</span>
            </div>
            <span className="terminal-text text-cyan" style={{ fontSize: '9px', display: 'block', marginTop: '-2px' }}>
              MISSION CONSOLE
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-dim)', margin: '0 8px' }}></div>

        {/* Team Code Pill */}
        <div className="team-pill">
          <span className="text-muted">TEAM:</span>
          <span className="badge badge-cyan">{player.teamCode}</span>
        </div>
      </div>

      {/* Center: Player Role & Level Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className={`player-role-badge badge ${isPlayer1 ? 'badge-cyan' : 'badge-purple'}`}>
          {isPlayer1 ? <Terminal size={12} /> : <Cpu size={12} />}
          <span>NODE 0{player.playerNumber}</span>
        </div>

        <div className="level-indicator">
          <span className="text-muted">TIER</span>
          <span className="level-num">{currentLevel}</span>
          <span className="text-muted">/ {totalLevels}</span>
        </div>
      </div>

      {/* Right: Telemetry Health & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="level-indicator badge-success" style={{ backgroundColor: 'var(--status-success-dim)', borderColor: 'var(--status-success)', color: 'var(--status-success)', gap: '6px' }}>
          <StatusDot status={connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'} />
          <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>{connectionStatus}</span>
        </div>

        <button
          onClick={onLogout}
          title="Disconnect / Logout"
          style={{ 
            padding: '8px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-dim)', 
            backgroundColor: 'var(--bg-dark)', 
            color: 'var(--status-error)', 
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--status-error-dim)';
            e.currentTarget.style.borderColor = 'var(--status-error)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-dark)';
            e.currentTarget.style.borderColor = 'var(--border-dim)';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>

    </header>
  );
};
