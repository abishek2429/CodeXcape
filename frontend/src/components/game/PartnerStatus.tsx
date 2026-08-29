import React from 'react';
import { Users, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { PartnerStatusData } from '../../types/game';

interface PartnerStatusProps {
  partner: PartnerStatusData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  const isConnected = partner.status === 'CONNECTED';
  const isReconnecting = partner.status === 'RECONNECTING';

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-slate-200">
            PARTNER NODE TELEMETRY
          </h2>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
            isConnected
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : isReconnecting
              ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300 animate-pulse'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>}
          {isReconnecting && <RefreshCw className="w-3 h-3 animate-spin" />}
          {!isConnected && !isReconnecting && <WifiOff className="w-3 h-3" />}
          <span>{partner.status}</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">PLAYER 0{partner.playerNumber}</span>
            <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-500/30">
              REMOTE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{partner.displayName}</p>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
              partner.challengeCompleted
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {partner.challengeCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SOLVED</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>ANALYZING...</span>
              </>
            )}
          </span>
          {partner.statusMessage && (
            <p className="text-[10px] text-slate-500 mt-1">{partner.statusMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

