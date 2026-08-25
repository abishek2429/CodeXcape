import React from 'react';
import { Terminal, LogOut, ShieldCheck } from 'lucide-react';
import { PlayerInfo } from '../../types/player';
import { SystemConnectionStatus } from '../../types/game';

interface GameHeaderProps {
  player: PlayerInfo;
  currentLevel: number;
  totalLevels: number;
  connectionStatus: SystemConnectionStatus;
  onLogout: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  player,
  currentLevel,
  totalLevels,
  connectionStatus,
  onLogout,
}) => {
  const isPlayer1 = player.playerNumber === 1;

  return (
    <header className="border-b border-slate-800 bg-[#0c101a]/90 backdrop-blur-md sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Branding & Team */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white font-mono leading-none">
                CODE<span className="text-cyan-400">XCAPE</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">ESCAPE ROOM</span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Team Code & Name */}
          <div className="font-mono">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">TEAM:</span>
              <span className="text-sm font-bold text-cyan-300 tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {player.teamCode}
              </span>
            </div>
            {player.teamName && (
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">{player.teamName}</p>
            )}
          </div>
        </div>

        {/* Center: Player Role & Level Badge */}
        <div className="flex items-center gap-3">
          {/* Player Badge */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border shadow-sm ${
              isPlayer1
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-cyan-950/40'
                : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-indigo-950/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPlayer1 ? 'bg-cyan-400' : 'bg-indigo-400'}`}></span>
            <span>PLAYER {player.playerNumber}</span>
          </div>

          {/* Level Progress Indicator */}
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-slate-200">
            LEVEL <span className="text-cyan-400 font-bold">{currentLevel}</span> / {totalLevels}
          </div>
        </div>

        {/* Right: Connection & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="capitalize">{connectionStatus.toLowerCase()}</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Logout / Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
