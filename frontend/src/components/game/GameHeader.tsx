import React, { useState, useEffect } from 'react';
import { Terminal, LogOut, Cpu, Clock, Trophy, Volume2, VolumeX } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';
import { StatusDot } from '../ui/StatusDot';
import { soundService } from '../../services/soundService';

interface GameHeaderProps {
  player: PlayerInfo;
  currentLevel: number;
  totalLevels: number;
  currentStage?: number;
  totalStages?: number;
  formattedRemaining?: string;
  remainingSeconds?: number | null;
  currentRank?: number;
  connectionStatus: SystemConnectionStatus;
  onLogout: () => void;
  onOpenBriefing?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  player,
  currentLevel,
  totalLevels,
  currentStage = 1,
  totalStages = 1,
  formattedRemaining,
  remainingSeconds,
  currentRank,
  connectionStatus,
  onLogout,
  onOpenBriefing,
}) => {
  const isPlayer1 = player.playerNumber === 1;
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted());
  const [prevRank, setPrevRank] = useState<number | undefined>(currentRank);
  const [rankShiftNotice, setRankShiftNotice] = useState<string | null>(null);

  useEffect(() => {
    if (currentRank !== undefined && prevRank !== undefined && currentRank !== prevRank) {
      setRankShiftNotice(`#${prevRank} → #${currentRank}`);
      soundService.playRadarPip();
      const timer = setTimeout(() => setRankShiftNotice(null), 4500);
      return () => clearTimeout(timer);
    }
    setPrevRank(currentRank);
  }, [currentRank]);

  const toggleSound = () => {
    const next = soundService.toggleMute();
    setIsMuted(next);
  };

  const isTimerCritical = remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds < 300; // < 5 mins
  const isTimerWarning = remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds < 900; // < 15 mins

  return (
    <header className="game-header" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-cyan)', backgroundColor: 'rgba(5, 6, 8, 0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      
      {/* Left: Branding & Team Pill */}
      <div className="game-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', letterSpacing: '0.05em' }}>
              <span>CODE</span>
              <span className="title-accent">X</span>
              <span>CAPE</span>
            </div>
            <span className="terminal-text text-cyan" style={{ fontSize: '9px', display: 'block', marginTop: '-2px', letterSpacing: '0.1em' }}>
              SECURE CONSOLE
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-dim)' }} />

        {/* Team Code Pill */}
        <div className="team-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <span className="text-muted">TEAM:</span>
          <span className="badge badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>{player.teamCode}</span>
        </div>
      </div>

      {/* Center: Stage Telemetry & Authoritative Timer & Live Rank */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-mono)' }}>
        <div className={`player-role-badge badge ${isPlayer1 ? 'badge-cyan' : 'badge-purple'}`} style={{ fontSize: '11px' }}>
          {isPlayer1 ? <Terminal size={12} /> : <Cpu size={12} />}
          <span>NODE 0{player.playerNumber}</span>
        </div>

        {/* Level & Stage indicator */}
        <div className="level-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)' }}>
          <span className="text-muted">TIER</span>
          <span className="level-num font-bold text-cyan">{currentLevel}</span>
          <span className="text-muted">/ {totalLevels}</span>
          <span style={{ color: 'var(--border-dim)', margin: '0 2px' }}>|</span>
          <span className="text-muted">STAGE</span>
          <span className="font-bold text-primary">{currentStage}/{totalStages}</span>
        </div>

        {/* Authoritative Timer */}
        {formattedRemaining && (
          <div
            className={`level-indicator ${isTimerCritical ? 'animate-pulse' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isTimerCritical ? 'rgba(225, 29, 72, 0.15)' : isTimerWarning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.5)',
              border: '1px solid',
              borderColor: isTimerCritical ? 'var(--accent-crimson)' : isTimerWarning ? 'var(--status-warning)' : 'var(--border-cyan)',
              color: isTimerCritical ? 'var(--accent-crimson)' : isTimerWarning ? 'var(--status-warning)' : 'var(--accent-cyan)',
              boxShadow: isTimerCritical ? 'var(--glow-crimson)' : 'none',
              fontWeight: 'bold',
            }}
          >
            <Clock size={13} />
            <span>{formattedRemaining}</span>
          </div>
        )}

        {/* Masked Position Pill */}
        {currentRank !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--status-warning)',
              fontWeight: 'bold',
            }}
          >
            <Trophy size={13} />
            <span>YOUR POSITION #{currentRank}</span>
            {rankShiftNotice && (
              <span className="badge badge-warning animate-bounce" style={{ fontSize: '9px', padding: '1px 4px', marginLeft: '4px' }}>
                {rankShiftNotice}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Mission Dossier, Sound, Telemetry & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onOpenBriefing && (
          <button
            type="button"
            onClick={onOpenBriefing}
            className="badge badge-cyan"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-cyan)',
              backgroundColor: 'rgba(0, 217, 255, 0.08)',
              fontSize: '10px',
              letterSpacing: '0.05em',
              padding: '5px 10px',
            }}
            title="Review The Sixth Node Investigation Dossier"
          >
            <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <span>MISSION: NODE 06</span>
          </button>
        )}

        {/* Sound Mute Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          style={{
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-dim)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: isMuted ? 'var(--text-muted)' : 'var(--accent-cyan)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Connection Status */}
        <div className="level-indicator badge-success" style={{ backgroundColor: 'var(--status-success-dim)', borderColor: 'var(--status-success)', color: 'var(--status-success)', gap: '6px', padding: '4px 8px', fontSize: '10px' }}>
          <StatusDot status={connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'} />
          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{connectionStatus}</span>
        </div>

        <button
          onClick={onLogout}
          title="Disconnect / Logout"
          style={{ 
            padding: '6px 8px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-dim)', 
            backgroundColor: 'var(--bg-dark)', 
            color: 'var(--status-error)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
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
          <LogOut size={14} />
        </button>
      </div>

    </header>
  );
};
