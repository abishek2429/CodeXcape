import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const GameErrorState: React.FC<Props> = ({
  message = 'Unable to establish secure telemetry connection with the game server.',
  onRetry,
}) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 bg-cyber-bg">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl cyber-panel border border-rose-500/40 shadow-2xl text-center font-mono relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-widest mb-3">
          SECURITY EXCEPTION
        </div>

        <h2 className="text-xl font-bold font-heading text-white uppercase tracking-wider mb-2">
          TELEMETRY DISRUPTION
        </h2>
        <p className="text-xs text-rose-200/90 font-mono leading-relaxed mb-6 bg-slate-950/80 p-4 rounded-xl border border-rose-900/40">
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-mono text-xs tracking-wider py-3.5 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 uppercase cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>RE-ESTABLISH CONNECTION</span>
          </button>
        )}
      </div>
    </div>
  );
};

