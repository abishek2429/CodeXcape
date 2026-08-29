import React from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { GameHeader } from '../../components/game/GameHeader';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { Radio, Users, Wifi, Terminal, ShieldCheck, Cpu } from 'lucide-react';

export const PlayerWaitingPage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();

  if (authStatus === 'INITIALIZING' || !player) {
    return <GameLoadingState message="Establishing secure link to waiting room..." />;
  }

  const isP1 = player.playerNumber === 1;

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans relative">
      <GameHeader
        player={player}
        currentLevel={1}
        totalLevels={6}
        connectionStatus="CONNECTED"
        onLogout={logout}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center relative z-10">
        <div className="w-full cyber-panel hud-corner p-8 sm:p-12 rounded-3xl text-center relative overflow-hidden shadow-2xl border border-cyan-500/30">
          
          {/* Top illuminated line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(0,240,255,0.8)]"></div>

          {/* Standby Pulse Icon */}
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)] animate-pulse-glow">
            <Radio className="w-10 h-10 animate-pulse text-cyan-300" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 radar-ping text-cyan-400"></span>
            STANDBY FOR EVENT INITIALIZATION
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white uppercase mb-3">
            WAITING FOR GAME LAUNCH
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-md mx-auto mb-8 leading-relaxed">
            The event organizer has not released the level locks yet. Your node is verified and registered on the secure network.
          </p>

          {/* Identity & Teammate Card */}
          <div className="max-w-md mx-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-6 font-mono space-y-4 text-left shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider">TEAM CODE</span>
              <span className="text-cyan-400 font-bold text-sm bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/40">
                {player.teamCode}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider">ASSIGNED NODE</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 ${
                isP1 ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30' : 'text-purple-300 bg-purple-950/40 border border-purple-500/30'
              }`}>
                {isP1 ? <Terminal className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                PLAYER 0{player.playerNumber} ({isP1 ? 'OPERATOR' : 'ANALYZER'})
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-xs uppercase tracking-wider">NETWORK STATUS</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                <Wifi className="w-3 h-3" />
                <span>LINK ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Do not refresh this screen. Gameplay will initialize automatically.</span>
          </div>

        </div>
      </main>
    </div>
  );
};

