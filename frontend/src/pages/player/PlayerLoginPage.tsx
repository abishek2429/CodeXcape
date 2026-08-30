import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { Terminal, Cpu, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import './PlayerLoginPage.css';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { StatusDot } from '../../components/ui/StatusDot';

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
      setErrorMsg('Please enter a valid Team Code (e.g. TEAM-001).');
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
      setErrorMsg(err.message || 'Access Denied: Unable to connect to game session. Verify team code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow-cyan"></div>
      <div className="login-glow-purple"></div>

      <Card className="login-panel">
        <div className="login-header">
          <div className="terminal-badge">
            <StatusDot status="connected" />
            CLEARANCE TERMINAL // ACCESS GATE
          </div>
          
          <h1 className="login-title">PLAYER AUTHENTICATION</h1>
          <p className="login-subtitle">
            Enter assigned team identifier and select your console node.
          </p>
        </div>

        {errorMsg && (
          <div className="error-banner">
            <AlertCircle size={16} color="var(--status-error)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fda4af' }}>AUTHENTICATION FAILED</p>
              <p style={{ marginTop: '2px', lineHeight: 1.6 }}>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamCode" className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} color="var(--accent-cyan)" />
                TEAM SECURITY CODE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>CASE INSENSITIVE</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g. TEAM-001"
                disabled={isLoading}
                maxLength={30}
                style={{ paddingRight: '60px' }}
              />
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                HEX/ID
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              SELECT CONSOLE PERSPECTIVE
            </label>
            <div className="role-grid">
              
              {/* Player 1 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(1)}
                disabled={isLoading}
                className={`role-btn ${playerNumber === 1 ? 'selected-cyan' : ''}`}
              >
                <div className="role-icon role-icon-cyan">
                  <Terminal size={16} />
                </div>
                <div className="role-name">PLAYER 01</div>
                <span className="role-sub" style={{ color: playerNumber === 1 ? 'rgba(103, 232, 249, 0.8)' : '' }}>PRIMARY OPERATOR</span>
              </button>

              {/* Player 2 Option */}
              <button
                type="button"
                onClick={() => setPlayerNumber(2)}
                disabled={isLoading}
                className={`role-btn ${playerNumber === 2 ? 'selected-purple' : ''}`}
              >
                <div className="role-icon role-icon-purple">
                  <Cpu size={16} />
                </div>
                <div className="role-name">PLAYER 02</div>
                <span className="role-sub" style={{ color: playerNumber === 2 ? 'rgba(216, 180, 254, 0.8)' : '' }}>CRYPTIC ANALYZER</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !teamCode.trim()}
            className="submit-btn flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>AUTHENTICATING NODE...</span>
            ) : (
              <>
                <span>CONNECT TO ESCAPE CONSOLE</span>
                <ArrowRight size={16} />
              </>
            )}
          </Button>

        </form>

        <div className="login-footer">
          SECURE 256-BIT ENCRYPTED SESSION // CODEXCAPE PROTOCOL
        </div>

      </Card>
    </div>
  );
};
