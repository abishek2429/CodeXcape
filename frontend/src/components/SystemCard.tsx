import React from 'react';

interface SystemCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  status: 'ONLINE' | 'OFFLINE' | 'CHECKING' | 'UNKNOWN';
  details?: React.ReactNode;
}

export const SystemCard: React.FC<SystemCardProps> = ({
  title,
  subtitle,
  icon,
  status,
  details
}) => {
  return (
    <div className="cyber-panel cyber-panel-hover p-6 rounded-2xl relative overflow-hidden group border border-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border transition-all ${
            status === 'ONLINE' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]' :
            status === 'OFFLINE' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
            'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
            status === 'ONLINE' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' :
            status === 'OFFLINE' ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40' :
            'bg-amber-950/60 text-amber-400 border border-amber-500/40'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {details && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
          {details}
        </div>
      )}
    </div>
  );
};

