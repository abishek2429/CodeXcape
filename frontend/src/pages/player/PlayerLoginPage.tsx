import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { Terminal, Cpu, ArrowRight, AlertOctagon, KeyRound } from 'lucide-react';
import './PlayerLoginPage.css';

export const PlayerLoginPage: React.FC = () => {
  const [teamCode, setTeamCode] = useState('');
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = usePlayerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      setErrorMsg('MISSING PARAMETER: TEAM_SECURITY_CODE');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login({
        teamCode: teamCode.trim().toUpperCase(),
        playerNumber,
      });
      navigate('/player/game', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'ACCESS DENIED: CONNECTION REJECTED');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="digital-noise-overlay"></div>
      
      <div className="cyber-panel login-panel animate-slide-up">
        <div className="login-header">
          <div className="badge badge-cyan" style={{ marginBottom: '24px' }}>
            <span className="indicator-dot indicator-connected" style={{ marginRight: '8px' }}></span>
            CLEARANCE TERMINAL
          </div>
          
          <h1 className="login-title">AUTHENTICATION</h1>
          <p className="terminal-text text-muted" style={{ fontSize: '12px' }}>
            &gt; ENTER ASSIGNED TEAM IDENTIFIER AND SELECT CONSOLE NODE_
          </p>
        </div>

        {errorMsg && (
          <div className="cyber-panel error-banner animate-glitch">
            <AlertOctagon size={16} />
            <div>
              <p className="terminal-text text-error font-bold">SECURITY BREACH DETECTED</p>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="teamCode" className="form-label terminal-text">
              <KeyRound size={14} />
              TEAM SECURITY CODE
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="teamCode"
                type="text"
                className="cyber-input"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="> INPUT HEX/ID_"
                disabled={isLoading}
                maxLength={30}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label terminal-text">
              <Cpu size={14} />
              SELECT CONSOLE NODE
            </label>
            <div className="role-grid">
              {/* Player 1 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(1)}
                disabled={isLoading}
                className={`cyber-panel role-btn ${playerNumber === 1 ? 'selected-cyan' : ''}`}
              >
                <div className="role-icon">
                  <Terminal size={18} />
                </div>
                <div className="role-name">NODE 01</div>
                <span className="role-sub">PRIMARY</span>
              </button>

              {/* Player 2 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(2)}
                disabled={isLoading}
                className={`cyber-panel role-btn ${playerNumber === 2 ? 'selected-purple' : ''}`}
              >
                <div className="role-icon">
                  <Cpu size={18} />
                </div>
                <div className="role-name">NODE 02</div>
                <span className="role-sub">SECONDARY</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !teamCode.trim()}
            className="btn btn-primary login-submit animate-pulse-glow"
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

        <div className="login-footer terminal-text text-muted">
          SECURE 256-BIT ENCRYPTED SESSION // CODEXCAPE PROTOCOL
        </div>
      </div>
    </div>
  );
};
