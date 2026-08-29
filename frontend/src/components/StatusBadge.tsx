import React from 'react';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'CHECKING' | 'UNKNOWN' | 'ACTIVE' | 'REGISTERED' | 'COMPLETED' | 'PAUSED' | 'DISQUALIFIED' | 'READY' | 'RUNNING' | 'DRAFT';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getColors = () => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
      case 'RUNNING':
      case 'COMPLETED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'OFFLINE':
      case 'DISQUALIFIED':
        return 'bg-rose-950/60 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      case 'CHECKING':
      case 'PAUSED':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'READY':
      case 'REGISTERED':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]';
      case 'DRAFT':
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const isPulsing = ['ONLINE', 'ACTIVE', 'RUNNING'].includes(status);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold tracking-wide ${getColors()}`}>
      <span className={`w-2 h-2 rounded-full ${
        isPulsing ? 'bg-emerald-400 radar-ping text-emerald-400' :
        status === 'OFFLINE' || status === 'DISQUALIFIED' ? 'bg-rose-400' :
        status === 'CHECKING' || status === 'PAUSED' ? 'bg-amber-400 animate-pulse' :
        status === 'READY' || status === 'REGISTERED' ? 'bg-cyan-400' : 'bg-slate-400'
      }`} />
      <span>{label || status}</span>
    </div>
  );
};

