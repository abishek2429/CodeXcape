import React from 'react';
import { CheckCircle2, Lock, Radio } from 'lucide-react';
import { LevelProgressItem } from '../../types/game';

interface LevelProgressProps {
  levels: LevelProgressItem[];
  currentLevel?: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels }) => {
  return (
    <div className="w-full cyber-panel p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-ping text-cyan-400"></span>
          SECURITY CLEARANCE PROGRESSION
        </h2>
        <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30">
          6 COOPERATIVE TIERS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {levels.map((lvl) => {
          const isCompleted = lvl.status === 'COMPLETED';
          const isCurrent = lvl.status === 'CURRENT';
          const isLocked = lvl.status === 'LOCKED';

          return (
            <div
              key={lvl.levelNumber}
              tabIndex={0}
              className={`relative flex flex-col p-3 rounded-xl border font-mono transition-all duration-300 outline-none ${
                isCompleted
                  ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : isCurrent
                  ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/50'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  TIER 0{lvl.levelNumber}
                </span>

                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {isCurrent && <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />}
                {isLocked && <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
              </div>

              <p className="text-[11px] font-sans font-medium truncate text-slate-300" title={lvl.name}>
                {lvl.name.replace(/^Level \d+: /, '')}
              </p>

              {/* Progress bar track */}
              <div className="mt-2.5 w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : isCurrent
                      ? 'w-1/2 bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]'
                      : 'w-0 bg-slate-800'
                  }`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

