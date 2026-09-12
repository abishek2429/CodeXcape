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
        borderBottom: '1px solid var(--border-crimson)',
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
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
              backgroundColor: 'rgba(225, 6, 19, 0.12)',
              border: '1px solid var(--accent-crimson)',
              color: 'var(--accent-crimson-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-crimson)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '18px' }}>X</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>CODEXCAPE // CRIMSON HUD</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                LEVEL 0{currentLevel} / 0{totalLevels}: {levelName}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(225, 6, 19, 0.12)',
                  color: 'var(--accent-crimson-bright)',
                  padding: '1px 6px',
                  borderRadius: '2px',
                  border: '1px solid var(--border-crimson)',
                  fontWeight: 700,
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
          <div className="badge badge-crimson" style={{ fontSize: '10px', padding: '3px 8px' }}>
            TEAM: {player.teamCode}
          </div>
          <div
            className={`badge ${isPlayer1 ? 'badge-crimson' : 'badge-purple'}`}
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
              backgroundColor: isTimerCritical ? 'rgba(225, 6, 19, 0.2)' : isTimerWarning ? 'rgba(214, 168, 75, 0.12)' : 'rgba(8, 8, 10, 0.8)',
              border: '1px solid',
              borderColor: isTimerCritical ? 'var(--accent-crimson)' : isTimerWarning ? 'var(--status-warning)' : 'var(--border-crimson)',
              color: isTimerCritical ? 'var(--accent-crimson-bright)' : isTimerWarning ? 'var(--status-warning)' : 'var(--accent-crimson-bright)',
              boxShadow: isTimerCritical ? 'var(--glow-crimson-intense)' : 'none',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            <Clock size={14} className={isTimerCritical ? 'animate-pulse' : ''} />
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TIME REMAINING:</span>
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
            backgroundColor: 'rgba(8, 8, 10, 0.7)',
            fontSize: '10px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>OPERATORS:</span>
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
            <ShieldAlert size={12} color="var(--accent-crimson)" />
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
            backgroundColor: 'rgba(8, 8, 10, 0.8)',
            color: isMuted ? 'var(--text-secondary)' : 'var(--accent-crimson-bright)',
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
            color: 'var(--accent-crimson)',
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
