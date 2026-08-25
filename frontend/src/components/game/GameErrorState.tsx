import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const GameErrorState: React.FC<Props> = ({
  message = 'Unable to connect to the game server. Please try again.',
  onRetry,
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#0a0d14]">
      <div className="max-w-md w-full p-8 rounded-xl bg-slate-900/90 border border-red-800/50 shadow-2xl text-center font-mono">
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Connection Error</h2>
        <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs tracking-wider py-3 px-4 rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
};
