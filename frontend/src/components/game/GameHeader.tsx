import React, { useState } from 'react';
import { Terminal, LogOut, Cpu, Clock, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';
import { StatusDot } from '../ui/StatusDot';
import { RankDisplay } from '../ui/RankDisplay';
import { CinematicButton } from '../cinematic/CinematicButton';
import { soundService } from '../../services/soundService';
import { GameCountdownTimer } from './GameCountdownTimer';

const LEVEL_NAMES: Record<number, string> = {
  1: 'SYSTEM RECONSTRUCTION',
  2: 'DATA VAULT',
  3: 'NETWORK INCIDENT',
  4: 'ENCRYPTED ROOM',
  5: 'COLLAPSED SYSTEM',
  6: 'THE CORE',
};

interface GameHeaderProps {
  player: PlayerInfo;
  currentLevel: number;
  totalLevels: number;
  currentStage?: number;
  totalStages?: number;
  deadline?: string | null;
  serverTime?: string | null;
  formattedRemaining?: string;
  remainingSeconds?: number | null;
  currentRank?: number;
  connectionStatus: SystemConnectionStatus;
  partnerStatus?: string;
  onLogout: () => void;
  onOpenBriefing?: () => void;
  onTimerExpire?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = React.memo(({
  player,
  currentLevel,
  totalLevels,
  currentStage = 1,
  totalStages = 1,
  deadline,
  serverTime,
  formattedRemaining,
  remainingSeconds,
  currentRank,
  connectionStatus,
  partnerStatus = 'CONNECTED',
  onLogout,
  onOpenBriefing,
  onTimerExpire,
}) => {
  const isPlayer1 = player.playerNumber === 1;
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted());

  const toggleSound = () => {
    const next = soundService.toggleMute();
    setIsMuted(next);
  };

  const isTimerCritical = remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds < 300; // < 5 mins
  const isTimerWarning = remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds < 900; // < 15 mins
  const levelName = LEVEL_NAMES[currentLevel] || `TIER 0${currentLevel}`;

  return (
    <header
      className="game-header"
      style={{
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-cyan)',
        backgroundColor: 'rgba(4, 5, 7, 0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Left: Restricted System Brand & Tier Identifier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 217, 255, 0.08)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-cyan-text)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '18px' }}>X</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>CODEXCAPE // SECURE NETWORK</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                LEVEL 0{currentLevel} / 0{totalLevels}: {levelName}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(0, 217, 255, 0.1)',
                  color: 'var(--accent-cyan)',
                  padding: '1px 6px',
                  borderRadius: '2px',
                  border: '1px solid var(--border-cyan)',
                }}
              >
                STAGE {String(currentStage).padStart(2, '0')} / {String(totalStages).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-dim)' }} />

        {/* Team Code & Active Node Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="badge badge-cyan" style={{ fontSize: '10px', padding: '3px 8px' }}>
            TEAM: {player.teamCode}
          </div>
          <div
            className={`badge ${isPlayer1 ? 'badge-cyan' : 'badge-purple'}`}
            style={{ fontSize: '10px', padding: '3px 8px' }}
          >
            {isPlayer1 ? <Terminal size={11} style={{ marginRight: '4px' }} /> : <Cpu size={11} style={{ marginRight: '4px' }} />}
            <span>NODE 0{player.playerNumber}</span>
          </div>
        </div>
      </div>

      {/* Center: Authoritative Remaining Timer & Masked Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Authoritative Timer */}
        {deadline ? (
          <GameCountdownTimer
            deadline={deadline}
            serverTime={serverTime}
            onExpire={onTimerExpire}
          />
        ) : formattedRemaining ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isTimerCritical ? 'rgba(225, 29, 72, 0.15)' : isTimerWarning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 0, 0, 0.6)',
              border: '1px solid',
              borderColor: isTimerCritical ? 'var(--accent-crimson)' : isTimerWarning ? 'var(--status-warning)' : 'var(--border-cyan)',
              color: isTimerCritical ? 'var(--accent-crimson)' : isTimerWarning ? 'var(--status-warning)' : 'var(--accent-cyan)',
              boxShadow: isTimerCritical ? 'var(--glow-crimson)' : 'none',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            <Clock size={14} className={isTimerCritical ? 'animate-pulse' : ''} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TIME REMAINING:</span>
            <span>{formattedRemaining}</span>
          </div>
        ) : null}

        {/* Player Masked Position with CountUp */}
        {currentRank !== undefined && (
          <RankDisplay currentRank={currentRank} />
        )}
      </div>

      {/* Right: Operator Telemetry Sync, Audio, Briefing & Disconnect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Dual Operator Live Sync Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-dim)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            fontSize: '10px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>OPERATORS:</span>
          <span style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--status-success)', boxShadow: '0 0 4px var(--status-success)' }} />
            OP 01
          </span>
          <span style={{ color: partnerStatus === 'CONNECTED' ? 'var(--status-success)' : 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: partnerStatus === 'CONNECTED' ? 'var(--status-success)' : 'var(--status-warning)', boxShadow: partnerStatus === 'CONNECTED' ? '0 0 4px var(--status-success)' : 'none' }} />
            OP 02
          </span>
        </div>

        {onOpenBriefing && (
          <CinematicButton
            variant="secondary"
            onClick={onOpenBriefing}
            showBrackets={false}
            style={{ padding: '6px 10px', fontSize: '10px', letterSpacing: '0.08em' }}
            title="Review Investigation Dossier"
          >
            <ShieldAlert size={12} color="var(--accent-cyan)" />
            <span>DOSSIER</span>
          </CinematicButton>
        )}

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          style={{
            padding: '6px 10px',
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

        {/* Connection Status Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--status-success)',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          <StatusDot status={connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'} />
          <span>{connectionStatus}</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Disconnect Console"
          style={{
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-dim)',
            backgroundColor: 'var(--bg-panel)',
            color: 'var(--status-error)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
});
