import React from 'react';
import { Terminal, Lock } from 'lucide-react';

interface FinalTerminalProps {
  isUnlocked: boolean;
}

export const FinalTerminal: React.FC<FinalTerminalProps> = ({ isUnlocked }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal className="w-4 h-4" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-cyan-300">
            FINAL TERMINAL ACCESS
          </h2>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
            isUnlocked
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border border-slate-800 text-slate-500'
          }`}
        >
          {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
        </span>
      </div>

      <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Final Escape Lock
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Complete all six levels to assemble your passkey clues and activate the final terminal override.
          </p>
        </div>
      </div>
    </div>
  );
};
