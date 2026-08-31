import React from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { GameHeader } from '../../components/game/GameHeader';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { Radio, Users, Wifi, Terminal, ShieldCheck, Cpu } from 'lucide-react';
import './PlayerWaitingPage.css';

export const PlayerWaitingPage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();

  if (authStatus === 'INITIALIZING' || !player) {
    return <GameLoadingState message="Establishing secure link to waiting room..." />;
  }

  const isP1 = player.playerNumber === 1;

  return (
    <div className="waiting-page">
      <div className="digital-noise-overlay"></div>
      
      <GameHeader
        player={player}
        currentLevel={1}
        totalLevels={6}
        connectionStatus="CONNECTED"
        onLogout={logout}
      />

      <main className="waiting-main">
        <div className="cyber-panel waiting-panel animate-slide-up">
          
          {/* Top illuminated line */}
          <div className="waiting-top-line"></div>

          {/* Standby Pulse Icon */}
          <div className="waiting-icon-wrapper animate-pulse-glow">
            <Radio className="waiting-icon" />
          </div>

          <div className="badge badge-cyan" style={{ marginBottom: '16px' }}>
            <span className="indicator-dot indicator-connected" style={{ marginRight: '8px' }}></span>
            STANDBY FOR EVENT INITIALIZATION
          </div>

          <h1 className="waiting-title">WAITING FOR LAUNCH</h1>

          <p className="terminal-text text-muted waiting-desc">
            &gt; THE EVENT ORGANIZER HAS NOT RELEASED THE LEVEL LOCKS YET.<br/>
            &gt; YOUR NODE IS VERIFIED AND REGISTERED ON THE SECURE NETWORK.
          </p>

          {/* Identity & Teammate Card */}
          <div className="cyber-panel waiting-identity-card">
            <div className="identity-row">
              <span className="identity-label">TEAM CODE</span>
              <span className="identity-value badge badge-cyan">{player.teamCode}</span>
            </div>

            <div className="identity-row">
              <span className="identity-label">ASSIGNED NODE</span>
              <span className={`identity-value badge ${isP1 ? 'badge-cyan' : 'badge-purple'}`}>
                {isP1 ? <Terminal size={14} style={{ marginRight: '4px' }} /> : <Cpu size={14} style={{ marginRight: '4px' }} />}
                PLAYER 0{player.playerNumber} ({isP1 ? 'OPERATOR' : 'ANALYZER'})
              </span>
            </div>

            <div className="identity-row" style={{ borderBottom: 'none' }}>
              <span className="identity-label">
                <Users size={14} style={{ marginRight: '6px' }} /> NETWORK STATUS
              </span>
              <span className="identity-value badge badge-success">
                <Wifi size={12} style={{ marginRight: '4px' }} /> LINK ACTIVE
              </span>
            </div>
          </div>

          <div className="waiting-footer terminal-text text-muted">
            <ShieldCheck size={16} />
            <span>DO NOT REFRESH. GAMEPLAY WILL INITIALIZE AUTOMATICALLY.</span>
          </div>

        </div>
      </main>
    </div>
  );
};
