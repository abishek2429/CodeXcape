import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Clock } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';
import { soundService } from '../../services/soundService';
import { GameCountdownTimer } from './GameCountdownTimer';

interface GameHeaderProps {
  player: PlayerInfo;
  currentLevel: number;
  totalLevels?: number;
  currentStage?: number;
  totalStages?: number;
  deadline?: string | null;
  serverTime?: string | null;
  formattedRemaining?: string;
  remainingSeconds?: number | null;
  currentRank?: number;
  teamScore?: number | null;
  connectionStatus: SystemConnectionStatus;
  partnerStatus?: string;
  onLogout: () => void;
  onOpenBriefing?: () => void;
  onOpenTransmission?: () => void;
  onTimerExpire?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = React.memo(({
  player,
  currentLevel,
  currentStage = 1,
  deadline,
  serverTime,
  formattedRemaining,
  teamScore,
  partnerStatus = 'CONNECTED',
  onLogout,
  onTimerExpire,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted());

  const toggleSound = () => {
    const next = soundService.toggleMute();
    setIsMuted(next);
  };

  const isPartnerConnected = partnerStatus === 'CONNECTED';

  return (
    <header
      className="game-hud"
      style={{
        height: '52px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(5, 5, 8, 0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* LEFT: CODEXCAPE & LEVEL / STAGE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '0.14em',
            fontWeight: 900,
            fontSize: '13px',
            color: 'var(--text-cold-white)',
          }}
        >
          <span style={{ color: 'var(--accent-crimson-bright)' }}>CODE</span>
          <span>XCAPE</span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          LEVEL {currentLevel} · STAGE {currentStage}
        </div>
      </div>

      {/* CENTER: TIMER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {deadline ? (
          <GameCountdownTimer
            deadline={deadline}
            serverTime={serverTime}
            onExpire={onTimerExpire}
          />
        ) : formattedRemaining ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '18px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              color: 'var(--text-cold-white)',
            }}
          >
            <Clock size={14} style={{ opacity: 0.6, color: 'var(--text-secondary)' }} />
            <span>{formattedRemaining}</span>
          </div>
        ) : null}
      </div>

      {/* RIGHT: TEAM & SCORE & SUBTLE CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Team with minimal player presence dots */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            TEAM {player.teamCode}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', opacity: 0.85 }}>
            <span
              title="You (P1) Connected"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-success)',
                display: 'inline-block',
              }}
            />
            <span
              title={isPartnerConnected ? 'Teammate Connected' : 'Teammate Reconnecting'}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isPartnerConnected ? 'var(--status-success)' : 'var(--status-warning)',
                display: 'inline-block',
                boxShadow: isPartnerConnected ? '0 0 4px var(--status-success)' : 'none',
              }}
            />
          </div>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

        {/* Score (Single display, unadorned, supports negative scores) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>SCORE</span>
          <span style={{ color: 'var(--accent-cyan)' }}>
            {teamScore !== null && teamScore !== undefined ? teamScore : 0}
          </span>
        </div>

        {/* Subtle controls: sound mute & discrete logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            style={{
              background: 'transparent',
              border: 'none',
              color: isMuted ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
              transition: 'color 0.15s ease',
            }}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Disconnect session"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
              opacity: 0.5,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
});
