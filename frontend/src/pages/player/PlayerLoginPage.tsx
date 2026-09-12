import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { Terminal, Cpu, ArrowRight, AlertOctagon, KeyRound } from 'lucide-react';
import { soundService } from '../../services/soundService';
import './PlayerLoginPage.css';

export const PlayerLoginPage: React.FC = () => {
  const [teamCode, setTeamCode] = useState('');
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, player, authStatus } = usePlayerAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (authStatus === 'AUTHENTICATED' && player) {
      if (player.gameState === 'NOT_STARTED') {
        navigate('/player/lobby', { replace: true });
      } else {
        navigate('/player/game', { replace: true });
      }
    }
  }, [authStatus, player, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      soundService.playError();
      setErrorMsg('MISSING PARAMETER: TEAM_SECURITY_CODE');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const playerInfo = await login({
        teamCode: teamCode.trim().toUpperCase(),
        playerNumber,
      });
      soundService.playClick();
      if (playerInfo.gameState === 'NOT_STARTED') {
        navigate('/player/lobby', { replace: true });
      } else {
        navigate('/player/game', { replace: true });
      }
    } catch (err: any) {
      soundService.playError();
      setErrorMsg(err.message || 'ACCESS DENIED: CONNECTION REJECTED');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Ambience */}
      <div className="login-ambient-glow" aria-hidden="true" />
      <div className="login-scanlines" aria-hidden="true" />

      <div className="cyber-panel login-panel animate-slide-up">
        {/* Terminal Header */}
        <div className="login-header">
          <div className="badge badge-crimson" style={{ marginBottom: '20px' }}>
            <span className="indicator-dot indicator-connected" style={{ marginRight: '8px' }}></span>
            CRIMSON CLEARANCE TERMINAL
          </div>

          <h1 className="login-title">AUTHENTICATION</h1>
          <p className="terminal-text text-secondary" style={{ fontSize: '12px' }}>
            &gt; ENTER ASSIGNED TEAM IDENTIFIER AND SELECT CONSOLE NODE_
          </p>
        </div>

        {/* Honest Error Notice */}
        {errorMsg && (
          <div className="cyber-panel error-banner animate-glitch">
            <AlertOctagon size={16} className="text-error" />
            <div>
              <p className="terminal-text text-error font-bold" style={{ fontSize: '12px' }}>AUTHENTICATION FAILED</p>
              <p className="text-secondary" style={{ fontSize: '11px', marginTop: '3px' }}>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="teamCode" className="form-label terminal-text">
              <KeyRound size={14} color="var(--accent-crimson)" />
              <span>TEAM SECURITY CODE</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="teamCode"
                type="text"
                className="cyber-input"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="> INPUT HEX / ID_"
                disabled={isLoading}
                maxLength={30}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label terminal-text">
              <Cpu size={14} color="var(--accent-crimson)" />
              <span>SELECT CONSOLE NODE</span>
            </label>
            <div className="role-grid">
              {/* Operator 1 */}
              <button
                type="button"
                onClick={() => {
                  soundService.playSelect();
                  setPlayerNumber(1);
                }}
                disabled={isLoading}
                className={`cyber-panel role-btn ${playerNumber === 1 ? 'selected-crimson' : ''}`}
              >
                <div className="role-icon">
                  <Terminal size={18} />
                </div>
                <div className="role-name">NODE 01</div>
                <span className="role-sub">PRIMARY OPERATOR</span>
              </button>

              {/* Operator 2 */}
              <button
                type="button"
                onClick={() => {
                  soundService.playSelect();
                  setPlayerNumber(2);
                }}
                disabled={isLoading}
                className={`cyber-panel role-btn ${playerNumber === 2 ? 'selected-crimson' : ''}`}
              >
                <div className="role-icon">
                  <Cpu size={18} />
                </div>
                <div className="role-name">NODE 02</div>
                <span className="role-sub">COOPERATIVE PARTNER</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !teamCode.trim()}
            className="btn btn-primary login-submit"
          >
            {isLoading ? (
              <span className="terminal-text">&gt; AUTHENTICATING...</span>
            ) : (
              <>
                <span>CONNECT TO CONSOLE</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer terminal-text text-secondary">
          SECURE 256-BIT ENCRYPTED SESSION // CRIMSON PROTOCOL
        </div>
      </div>
    </div>
  );
};
