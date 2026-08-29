import React from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { LogOut, Clock } from 'lucide-react';

export const PlayerSessionPage: React.FC = () => {
  const { player, logout } = usePlayerAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-cyber-bg relative overflow-hidden font-sans">
      {/* Background Accent Lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg cyber-panel hud-corner p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 text-center">
        
        {/* Connection Pulse Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>
          <span>NODE TELEMETRY: CONNECTED</span>
        </div>

        <h1 className="text-3xl font-black tracking-wider text-white font-heading uppercase mb-8">
          CODEXCAPE // SESSION
        </h1>

        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 mb-8 text-left space-y-3.5 font-mono text-xs shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 uppercase tracking-wider">TEAM ACCESS CODE</span>
            <span className="text-cyan-400 font-bold text-base tracking-widest">{player?.teamCode}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 uppercase tracking-wider">TEAM IDENTIFIER</span>
            <span className="text-white font-semibold">{player?.teamName || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 uppercase tracking-wider">OPERATIONAL ROLE</span>
            <span className="text-cyan-300 font-bold">
              {player?.playerNumber === 1 ? 'Player 1 (Operator)' : 'Player 2 (Analyzer)'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-wider">PLAYER IDENTITY</span>
            <span className="text-slate-200">{player?.playerName}</span>
          </div>
        </div>

        {/* Waiting Message */}
        <div className="p-6 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 mb-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="font-mono text-xs font-bold tracking-wider uppercase text-white">READY & SYNCHRONIZED</p>
            <p className="text-xs text-slate-400 font-mono mt-1">Your player session is active. Waiting for event organizer to authorize gameplay tier release.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs tracking-wider py-3.5 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 uppercase cursor-pointer shadow-lg"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>DISCONNECT / TERMINATE SESSION</span>
        </button>
      </div>
    </div>
  );
};

