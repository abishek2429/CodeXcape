import React from 'react';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { HintData } from '../../types/game';

interface HintPanelProps {
  hints: HintData[];
}

export const HintPanel: React.FC<HintPanelProps> = ({ hints }) => {
  return (
    <div className="cyber-panel p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-amber-400">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-amber-300">
            PASSKEY CLUE VAULT
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
          6 CRYPTOGRAPHIC SHARDS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hints.map((hint) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;

          return (
            <div
              key={hint.levelNumber}
              className={`p-3.5 rounded-xl border text-xs transition-all duration-200 flex items-start gap-3 ${
                isUnlocked
                  ? 'bg-amber-950/25 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
              }`}
            >
              {isUnlocked ? (
                <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded-md bg-slate-900 text-slate-600 shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold tracking-wider ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                    SHARD 0{hint.levelNumber}
                  </span>
                  {isUnlocked && (
                    <span className="text-[9px] text-amber-400 uppercase tracking-widest bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40 font-bold">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className={isUnlocked ? 'text-slate-200 font-mono text-xs leading-relaxed bg-slate-950/80 p-2 rounded-lg border border-amber-500/20' : 'text-slate-500 text-[11px] italic'}>
                  {isUnlocked
                    ? hint.hintContent
                    : `Complete Level ${hint.levelNumber} to decrypt this passkey shard.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

