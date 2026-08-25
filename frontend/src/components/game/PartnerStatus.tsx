import React from 'react';
import { Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { PartnerStatusData } from '../../types/game';

interface PartnerStatusProps {
  partner: PartnerStatusData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  const isConnected = partner.status === 'CONNECTED';
  const isReconnecting = partner.status === 'RECONNECTING';

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300">YOUR TEAMMATE</h2>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
            isConnected
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : isReconnecting
              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300 animate-pulse'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          {isConnected && <Wifi className="w-3.5 h-3.5" />}
          {isReconnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {!isConnected && !isReconnecting && <WifiOff className="w-3.5 h-3.5" />}
          <span>{partner.status}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Player {partner.playerNumber}</p>
          <p className="text-xs text-slate-400">{partner.displayName}</p>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-2.5 py-1 rounded text-xs border ${
              partner.challengeCompleted
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {partner.challengeCompleted ? 'Challenge Completed ✓' : 'In Progress...'}
          </span>
          {partner.statusMessage && (
            <p className="text-[10px] text-slate-500 mt-1">{partner.statusMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};
