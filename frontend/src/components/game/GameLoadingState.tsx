import React from 'react';
import { Cpu } from 'lucide-react';

interface Props {
  message?: string;
}

export const GameLoadingState: React.FC<Props> = ({ message = 'INITIALIZING CODEXCAPE ENVIRONMENT...' }) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 bg-cyber-bg">
      <div className="flex flex-col items-center gap-5 text-cyan-400 font-mono text-center cyber-panel p-8 sm:p-10 rounded-3xl border border-cyan-500/30 shadow-2xl max-w-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-cyan-400/30 animate-spin"></div>
        </div>

        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase font-bold text-white font-mono">{message}</p>
          <div className="w-32 bg-slate-950 h-1.5 rounded-full overflow-hidden mx-auto border border-slate-800">
            <div className="h-full bg-cyan-400 w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

