import React from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { GameHeader } from '../../components/game/GameHeader';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { Clock, Users, Wifi } from 'lucide-react';

export const PlayerWaitingPage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();

  if (authStatus === 'INITIALIZING' || !player) {
    return <GameLoadingState message="Connecting to waiting room..." />;
  }

  const isP1 = player.playerNumber === 1;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      <GameHeader
        player={player}
        currentLevel={1}
        totalLevels={6}
        connectionStatus="CONNECTED"
        onLogout={logout}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-2xl text-center relative overflow-hidden">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

          <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-950/50">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono uppercase mb-2">
            Waiting for the game to begin...
          </h1>

          <p className="text-sm text-slate-400 font-mono mb-8">
            The event organizer has not started the gameplay phase yet. Please standby.
          </p>

          <div className="max-w-md mx-auto bg-slate-950/80 border border-slate-800 rounded-lg p-6 font-mono space-y-4 text-left mb-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-slate-400 text-xs uppercase">Your Team</span>
              <span className="text-cyan-400 font-bold text-base">{player.teamCode}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-slate-400 text-xs uppercase">Your Role</span>
              <span className="text-white font-semibold">Player {player.playerNumber} ({isP1 ? 'Operator' : 'Analyzer'})</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-xs uppercase">Your Teammate</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                <Wifi className="w-3 h-3" />
                <span>Connected</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Please remain on this page. Gameplay will automatically initialize once launched.
          </div>
        </div>
      </main>
    </div>
  );
};
