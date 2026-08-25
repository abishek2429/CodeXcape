import React from 'react';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { HintData } from '../../types/game';

interface HintPanelProps {
  hints: HintData[];
}

export const HintPanel: React.FC<HintPanelProps> = ({ hints }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl mb-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-amber-400">
          <KeyRound className="w-4 h-4" />
          <h2 className="text-xs tracking-widest uppercase font-bold text-amber-300">
            FINAL PASSKEY CLUES
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">6 Clues to Passkey</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hints.map((hint) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;

          return (
            <div
              key={hint.levelNumber}
              className={`p-3 rounded-lg border text-xs transition flex items-start gap-3 ${
                isUnlocked
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              {isUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              )}

              <div>
                <span className="font-bold text-slate-300 block mb-0.5">
                  Level {hint.levelNumber} Clue
                </span>
                <p className={isUnlocked ? 'text-amber-100 font-sans text-xs' : 'text-slate-500 italic'}>
                  {isUnlocked
                    ? hint.hintContent
                    : `Complete Level ${hint.levelNumber} to unlock this clue.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
