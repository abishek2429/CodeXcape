import React from 'react';
import { Terminal, LogOut, Cpu } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';

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
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.4)',
            color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0,217,255,0.25)'
          }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '18px' }}>X</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              <span>CODE</span>
              <span style={{ color: 'var(--accent-cyan)' }}>X</span>
              <span>CAPE</span>
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(0,217,255,0.8)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', display: 'block' }}>
              MISSION CONSOLE
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

        {/* Team Code Pill */}
        <div className="team-pill">
          <span style={{ color: 'var(--text-secondary)' }}>TEAM:</span>
          <span className="team-pill-code">{player.teamCode}</span>
        </div>
      </div>

      {/* Center: Player Role & Level Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className={`player-role-badge ${isPlayer1 ? 'role-badge-p1' : 'role-badge-p2'}`}>
          {isPlayer1 ? <Terminal size={14} /> : <Cpu size={14} />}
          <span>PLAYER 0{player.playerNumber}</span>
        </div>

        <div className="level-indicator">
          <span style={{ color: 'var(--text-secondary)' }}>LEVEL</span>
          <span className="level-num">{currentLevel}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>/ {totalLevels}</span>
        </div>
      </div>

      {/* Right: Telemetry Health & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="level-indicator" style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--status-success)' }}>
          <StatusDot status="connected" />
          <span style={{ textTransform: 'capitalize' }}>{connectionStatus.toLowerCase()}</span>
        </div>

        <Button
          variant="secondary"
          onClick={onLogout}
          title="Disconnect / Logout"
          style={{ padding: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <LogOut size={16} />
        </Button>
      </div>

    </header>
  );
};
