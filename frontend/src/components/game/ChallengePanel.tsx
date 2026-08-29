import React from 'react';
import { HelpCircle, Code2 } from 'lucide-react';
import { ChallengeData } from '../../types/game';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl mb-6 flex flex-col justify-between min-h-[260px]">
      <div>
        {/* Header Tag */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-mono tracking-widest text-cyan-300 font-bold uppercase">
              YOUR CHALLENGE — LEVEL {challenge.levelNumber}
            </h2>
          </div>

          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            Player {playerNumber} Perspective
          </span>
        </div>

        {/* Challenge Title & Puzzle Context */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-white font-mono tracking-tight">
            {challenge.title}
          </h3>
          {challenge.puzzleContext && (
            <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              Puzzle Context: {challenge.puzzleContext}
            </span>
          )}
        </div>

        {/* Challenge Content Description */}
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 text-slate-200 font-sans text-base leading-relaxed tracking-normal shadow-inner">
          <p className="whitespace-pre-line">{challenge.description}</p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>Expected format: <strong className="text-slate-200">{challenge.answerType}</strong></span>
        </div>
        <span>Level {challenge.levelNumber} / 6</span>
      </div>
    </div>
  );
};
