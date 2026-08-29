import React from 'react';
import { Radio } from 'lucide-react';

interface GameStatusProps {
  message: string | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl cyber-panel border border-cyan-500/30 text-cyan-200 font-mono text-xs flex items-center gap-3.5 shadow-xl animate-fade-in">
      <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
        <Radio className="w-4 h-4 animate-pulse" />
      </div>

      <div className="flex-1">
        <span className="font-bold text-cyan-300 uppercase tracking-widest text-[10px] block mb-0.5">
          GAME TELEMETRY DIRECTIVE
        </span>
        <p className="text-slate-200 font-mono text-xs">{message}</p>
      </div>
    </div>
  );
};

