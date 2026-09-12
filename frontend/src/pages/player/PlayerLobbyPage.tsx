import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { fetchLobbyState, setPlayerReady, startTeamEvent } from '../../services/playerAuthService';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import { PlayerInfo } from '../../types/player';
import { soundService } from '../../services/soundService';
import { SpotlightCard } from '../../components/cinematic/SpotlightCard';
import { CinematicButton } from '../../components/cinematic/CinematicButton';
import { Terminal, Cpu, Users, Shield, AlertOctagon, CheckCircle2, LogOut } from 'lucide-react';
import './PlayerLobbyPage.css';

export const PlayerLobbyPage: React.FC = () => {
  const { player, logout, refreshPlayer } = usePlayerAuth();
  const navigate = useNavigate();

  const [lobbyData, setLobbyData] = useState<PlayerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchLobbyState();
      setLobbyData(data);
      setErrorMsg(null);

      // If team has already started, transition to gameplay
      if (data.gameState && data.gameState !== 'NOT_STARTED') {
        navigate('/player/game', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading lobby state.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization via WebSocket
  useGameWebSocket({
    teamId: player?.teamId,
    playerNumber: player?.playerNumber,
    onRefreshData: loadData,
    onEventStarted: () => {
      soundService.playLevelUnlock();
      setTransitioning(true);
      setTimeout(() => {
        navigate('/player/game', { replace: true });
      }, 1200);
    },
  });

  const isOperator1 = player?.playerNumber === 1;
  const isSelfReady = Boolean(lobbyData?.isReady);
  const isTeammateLoggedIn = Boolean(lobbyData?.teammateLoggedIn);
  const isTeammateReady = Boolean(lobbyData?.teammateReady);
  const teammateNum = isOperator1 ? 2 : 1;
  const teammateName = lobbyData?.teammateName || `OPERATOR 0${teammateNum}`;

  const handleToggleReady = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);

    // If both operators are already verified ready, trigger start confirmation
    if (isSelfReady && isTeammateLoggedIn && isTeammateReady) {
      soundService.playClick();
      setShowConfirmModal(true);
      return;
    }

    // Otherwise toggle self readiness
    try {
      setIsSubmitting(true);
      soundService.playSelect();
      const updated = await setPlayerReady(!isSelfReady);
      setLobbyData(updated);

      // If event has already started, transition to gameplay immediately
      if (updated.gameState && updated.gameState !== 'NOT_STARTED') {
        navigate('/player/game', { replace: true });
        return;
      }

      // If this action completed mutual readiness, trigger start prompt
      if (updated.isReady && updated.teammateReady && updated.teammateLoggedIn) {
        soundService.playChallengeUnlock();
        setShowConfirmModal(true);
      }
    } catch (err: any) {
      soundService.playError();
      setErrorMsg(err.message || 'Failed to update readiness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 4. ENTER ARENA SOUND: Futuristic activation / confirmation
      soundService.playArenaEnter();
      setShowConfirmModal(false);
      setTransitioning(true);

      await startTeamEvent();
      await refreshPlayer();

      // Transition before game entry without delaying navigation
      setTimeout(() => {
        navigate('/player/game', { replace: true });
      }, 1200);
    } catch (err: any) {
      soundService.playError();
      setTransitioning(false);
      setErrorMsg(err.message || 'Failed to start event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    soundService.playClick();
    await logout();
    navigate('/player/login');
  };

  if (transitioning) {
    return (
      <div className="lobby-transition-overlay">
        <div className="lobby-transition-panel animate-fade-in">
          <CheckCircle2 size={48} color="var(--accent-crimson-bright)" className="animate-pulse-glow" />
          <h1 className="transition-title">TEAM VERIFIED</h1>
          <div className="transition-sub">
            &gt; OPERATOR 01 ... READY<br />
            &gt; OPERATOR 02 ... READY
          </div>
          <div className="transition-alert animate-pulse">
            STARTING CODEXCAPE // LEVEL 01
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-lobby-page">
      {/* Background Ambience */}
      <div className="lobby-scanline-overlay" aria-hidden="true" />
      <div className="lobby-ambient-glow" aria-hidden="true" />

      {/* Top Telemetry Strip */}
      <header className="lobby-top-strip">
        <div className="lobby-brand">
          <Shield size={16} color="var(--accent-crimson)" />
          <span>CODEXCAPE</span>
          <span style={{ color: 'var(--accent-crimson)' }}>//</span>
          <span style={{ color: 'var(--text-secondary)' }}>COMMAND ROOM LOBBY</span>
        </div>

        <button onClick={handleLogout} className="lobby-logout-btn" title="Exit to Login">
          <LogOut size={14} />
          <span>LOGOUT</span>
        </button>
      </header>

      {/* Main Center Console */}
      <main className="lobby-main-container">
        <SpotlightCard variant="danger" className="lobby-profile-card animate-slide-up">
          {/* Header */}
          <div className="profile-header">
            <div>
              <div className="profile-super">CLEARANCE LEVEL: OPERATOR</div>
              <h1 className="profile-title">TACTICAL HUD</h1>
            </div>
            <div className="badge-event-status">
              <span className="dot-pulse" />
              <span>STATUS: AWAITING START</span>
            </div>
          </div>

          {errorMsg && (
            <div className="lobby-error-banner animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  loadData();
                }}
                style={{
                  background: 'rgba(225, 6, 19, 0.2)',
                  border: '1px solid var(--accent-crimson)',
                  color: '#ff99a4',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  letterSpacing: '0.05em'
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {/* Section 1: Self Operator */}
          <div className="profile-section">
            <div className="section-title">
              <Terminal size={14} color="var(--accent-crimson)" />
              <span>OPERATOR IDENTIFIER</span>
            </div>
            <div className="section-grid">
              <div className="data-field">
                <span className="field-label">NAME</span>
                <span className="field-value font-bold">{player?.playerName || 'OPERATOR'}</span>
              </div>
              <div className="data-field">
                <span className="field-label">NODE ASSIGNMENT</span>
                <span className="field-value text-crimson font-bold">OPERATOR 0{player?.playerNumber}</span>
              </div>
              <div className="data-field">
                <span className="field-label">LOCAL STATUS</span>
                <span className="field-value status-online">
                  <span className="indicator-dot-red" /> LOGGED IN
                </span>
              </div>
              <div className="data-field">
                <span className="field-label">READINESS</span>
                <span className={`field-value ${isSelfReady ? 'status-ready' : 'status-waiting'}`}>
                  {isSelfReady ? '● READY' : '○ WAITING'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Team */}
          <div className="profile-section">
            <div className="section-title">
              <Users size={14} color="var(--accent-crimson)" />
              <span>TEAM IDENTIFICATION</span>
            </div>
            <div className="section-grid">
              <div className="data-field">
                <span className="field-label">TEAM NAME</span>
                <span className="field-value font-bold">{player?.teamName || 'TEAM'}</span>
              </div>
              <div className="data-field">
                <span className="field-label">TEAM CODE</span>
                <span className="field-value text-crimson font-mono font-bold">{player?.teamCode}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Teammate Live Telemetry */}
          <div className="profile-section">
            <div className="section-title">
              <Cpu size={14} color="var(--accent-crimson)" />
              <span>COOPERATIVE PARTNER NODE (LIVE)</span>
            </div>
            <div className="section-grid">
              <div className="data-field">
                <span className="field-label">TEAMMATE</span>
                <span className="field-value font-bold">{teammateName}</span>
              </div>
              <div className="data-field">
                <span className="field-label">NODE</span>
                <span className="field-value text-secondary font-bold">OPERATOR 0{teammateNum}</span>
              </div>
              <div className="data-field">
                <span className="field-label">CONNECTION STATUS</span>
                <span className={`field-value ${isTeammateLoggedIn ? 'status-online' : 'status-offline'}`}>
                  {isTeammateLoggedIn ? (
                    <>
                      <span className="indicator-dot-red" /> LOGGED IN
                    </>
                  ) : (
                    <>
                      <span className="indicator-dot-gray" /> NOT LOGGED IN
                    </>
                  )}
                </span>
              </div>
              <div className="data-field">
                <span className="field-label">TEAMMATE READINESS</span>
                <span className={`field-value ${isTeammateReady ? 'status-ready' : 'status-waiting'}`}>
                  {isTeammateReady ? '● READY' : '○ NOT READY'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Zone */}
          <div className="lobby-action-zone">
            <div className="status-summary-text">
              {!isTeammateLoggedIn ? (
                <span style={{ color: 'var(--text-secondary)' }}>
                  &gt; WAITING FOR OPERATOR 0{teammateNum} TO AUTHENTICATE_
                </span>
              ) : !isTeammateReady ? (
                <span style={{ color: 'var(--accent-gold)' }}>
                  &gt; OPERATOR 0{teammateNum} LOGGED IN. AWAITING MUTUAL READINESS_
                </span>
              ) : (
                <span style={{ color: 'var(--accent-crimson-bright)', fontWeight: 800 }}>
                  &gt; BOTH OPERATORS READY. AUTHORIZED TO BEGIN MISSION_
                </span>
              )}
            </div>

            <div className="lobby-buttons-row">
              <CinematicButton
                variant={isSelfReady && isTeammateReady ? 'primary' : isSelfReady ? 'secondary' : 'primary'}
                onClick={handleToggleReady}
                withSound={false}
                disabled={isSubmitting || isLoading}
                className="lobby-start-btn"
              >
                {isSelfReady && isTeammateReady ? (
                  <span>START MISSION</span>
                ) : isSelfReady ? (
                  <span>MARK WAITING (TOGGLE READY)</span>
                ) : (
                  <span>CONFIRM READINESS</span>
                )}
              </CinematicButton>
            </div>
          </div>
        </SpotlightCard>
      </main>

      {/* Irreversible Start Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-modal-content animate-slide-up">
            <div className="modal-header">
              <AlertOctagon size={24} color="var(--accent-crimson-bright)" />
              <h2>START MISSION CONFIRMATION</h2>
            </div>

            <p className="modal-body-text">
              Once the mission officially begins:
            </p>

            <ul className="modal-rules-list">
              <li>The authoritative server timer will start (90-minute limit).</li>
              <li>Both operators will transition into <strong>Level 01: System Reconstruction</strong>.</li>
              <li>Your team will be recorded as officially active in the escape network.</li>
            </ul>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="modal-btn-cancel"
                disabled={isSubmitting}
              >
                CANCEL
              </button>
              <CinematicButton
                variant="primary"
                onClick={handleConfirmStart}
                withSound={false}
                disabled={isSubmitting}
                className="modal-btn-confirm"
              >
                <span>CONFIRM START</span>
              </CinematicButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
