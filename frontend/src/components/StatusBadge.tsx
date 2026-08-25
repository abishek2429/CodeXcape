import React from 'react';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'CHECKING' | 'UNKNOWN';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getColors = () => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-green';
      case 'OFFLINE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 glow-red';
      case 'CHECKING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold tracking-wide ${getColors()}`}>
      <span className={`w-2 h-2 rounded-full ${
        status === 'ONLINE' ? 'bg-emerald-400 animate-ping' :
        status === 'OFFLINE' ? 'bg-rose-400' :
        status === 'CHECKING' ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'
      }`} />
      <span>{label || status}</span>
    </div>
  );
};
