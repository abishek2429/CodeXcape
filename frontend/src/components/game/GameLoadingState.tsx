import React from 'react';
import { Terminal } from 'lucide-react';

interface Props {
  message?: string;
}

export const GameLoadingState: React.FC<Props> = ({ message = 'Loading Game Environment...' }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#0a0d14]">
      <div className="flex flex-col items-center gap-4 text-cyan-400 font-mono">
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <Terminal className="w-8 h-8 animate-pulse" />
        </div>
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm tracking-widest uppercase font-semibold text-slate-300">{message}</p>
      </div>
    </div>
  );
};
