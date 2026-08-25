import React from 'react';
import { SystemConnectionStatus } from '../../types/game';
import { Signal, SignalLow, SignalZero } from 'lucide-react';

interface ConnectionStatusProps {
  status: SystemConnectionStatus;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const isConnected = status === 'CONNECTED';
  const isConnecting = status === 'CONNECTING' || status === 'RECONNECTING';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono">
      {isConnected && <Signal className="w-3.5 h-3.5 text-emerald-400" />}
      {isConnecting && <SignalLow className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
      {!isConnected && !isConnecting && <SignalZero className="w-3.5 h-3.5 text-red-400" />}

      <span className="text-slate-400">SERVER:</span>
      <span
        className={`font-bold ${
          isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-red-400'
        }`}
      >
        {status}
      </span>
    </div>
  );
};
