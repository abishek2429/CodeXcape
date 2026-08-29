import React from 'react';
import { Terminal, LogOut, Cpu } from 'lucide-react';
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
    <header className="border-b border-cyan-500/20 bg-cyber-bg/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Branding & Team Identifier */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <span className="font-heading font-black text-lg text-cyan-300">X</span>
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                <span className="font-heading font-extrabold text-base tracking-wider text-white">CODE</span>
                <span className="font-heading font-black text-base tracking-wider text-cyan-400">X</span>
                <span className="font-heading font-extrabold text-base tracking-wider text-slate-200">CAPE</span>
              </div>
              <span className="text-[9px] text-cyan-400/80 font-mono tracking-widest uppercase block">
                MISSION CONSOLE
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Team Code Pill */}
          <div className="font-mono flex items-center gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider hidden sm:inline">TEAM:</span>
            <span className="text-xs font-bold text-cyan-300 tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-inner">
              {player.teamCode}
            </span>
            {player.teamName && (
              <span className="text-xs text-slate-400 font-mono hidden md:inline truncate max-w-[150px]">
                ({player.teamName})
              </span>
            )}
          </div>
        </div>

        {/* Center: Player Role & Level Badge */}
        <div className="flex items-center gap-3">
          {/* Player Role Badge */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 border shadow-md ${
              isPlayer1
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-cyan-950/40'
                : 'bg-purple-950/60 border-purple-500/50 text-purple-300 shadow-purple-950/40'
            }`}
          >
            {isPlayer1 ? <Terminal className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
            <span>PLAYER 0{player.playerNumber}</span>
            <span className="text-[9px] opacity-75 hidden sm:inline">({isPlayer1 ? 'OPERATOR' : 'ANALYZER'})</span>
          </div>

          {/* Level Progress Indicator */}
          <div className="px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-semibold text-slate-200 shadow-inner flex items-center gap-1.5">
            <span className="text-slate-400">LEVEL</span>
            <span className="text-cyan-400 font-bold text-sm">{currentLevel}</span>
            <span className="text-slate-500">/ {totalLevels}</span>
          </div>
        </div>

        {/* Right: Telemetry Health & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>
            <span className="capitalize">{connectionStatus.toLowerCase()}</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Disconnect / Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

