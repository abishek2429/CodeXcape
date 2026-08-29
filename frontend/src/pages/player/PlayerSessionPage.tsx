import React from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';

export const PlayerSessionPage: React.FC = () => {
  const { player, logout } = usePlayerAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0a0d14] relative overflow-hidden">
      {/* Background Accent Lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-cyan-900/40 rounded-xl p-8 shadow-2xl relative z-10 text-center">
        
        {/* Connection Pulse Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-xs tracking-wider uppercase mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          Connected ✓
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent mb-8">
          CODEXCAPE
        </h1>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-6 mb-8 text-left space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Team Code</span>
            <span className="text-cyan-400 font-bold text-lg tracking-widest">{player?.teamCode}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Team Name</span>
            <span className="text-white font-semibold">{player?.teamName || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Player Role</span>
            <span className="text-cyan-300 font-semibold">Player {player?.playerNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Player Identity</span>
            <span className="text-slate-200 text-sm">{player?.playerName}</span>
          </div>
        </div>

        {/* Phase 5 Game Area Placeholder Message */}
        <div className="p-6 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-cyan-200 mb-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-sm font-semibold tracking-wide uppercase text-white">Waiting for game...</p>
            <p className="text-xs text-slate-400 mt-1">Your player session is active. Waiting for event organizer to start gameplay.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-sm tracking-wider py-3 px-4 rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 uppercase cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Disconnect / Logout</span>
        </button>
      </div>
    </div>
  );
};
