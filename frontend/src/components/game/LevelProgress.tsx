import React from 'react';
import { CheckCircle2, Lock, Radio } from 'lucide-react';
import { LevelProgressItem } from '../../types/game';

interface LevelProgressProps {
  levels: LevelProgressItem[];
  currentLevel: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels }) => {
  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          Game Level Progression
        </h2>
        <span className="text-xs font-mono text-slate-500">6 Interconnected Challenges</span>
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
              className={`relative flex flex-col p-3 rounded-lg border font-mono transition outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Level {lvl.levelNumber}
                </span>

                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isCurrent && <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />}
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              </div>

              <p className="text-[11px] font-sans truncate text-slate-300" title={lvl.name}>
                {lvl.name.replace(/^Level \d+: /, '')}
              </p>

              <div className="mt-2 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-emerald-400'
                      : isCurrent
                      ? 'w-1/2 bg-cyan-400 animate-pulse'
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
