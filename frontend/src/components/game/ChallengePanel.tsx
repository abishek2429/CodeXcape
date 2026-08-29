import React from 'react';
import { Terminal, Code2 } from 'lucide-react';
import { ChallengeData } from '../../types/game';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;

  return (
    <div className="cyber-panel hud-corner p-6 sm:p-7 rounded-2xl border border-cyan-500/30 shadow-2xl mb-6 flex flex-col justify-between min-h-[280px]">
      <div>
        {/* Header HUD Tag */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-mono tracking-widest text-cyan-300 font-bold uppercase">
              MISSION 0{challenge.levelNumber} // CHALLENGE SPECIFICATION
            </h2>
          </div>

          <span className={`text-[11px] font-mono px-3 py-1 rounded-full border font-bold uppercase ${
            isP1 ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
          }`}>
            Player 0{playerNumber} Node Perspective
          </span>
        </div>

        {/* Challenge Title & Puzzle Context */}
        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight">
            {challenge.title}
          </h3>
          {challenge.puzzleContext && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300">
              <span className="text-slate-500 uppercase">Context:</span>
              <span className="font-semibold">{challenge.puzzleContext}</span>
            </div>
          )}
        </div>

        {/* Challenge Content Description Box */}
        <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 font-mono text-sm leading-relaxed tracking-normal shadow-inner relative overflow-hidden">
          <p className="whitespace-pre-line font-mono">{challenge.description}</p>
        </div>
      </div>

      {/* Footer Format Info */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>Expected Format: <strong className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{challenge.answerType}</strong></span>
        </div>
        <span className="text-slate-500">Tier {challenge.levelNumber} of 6</span>
      </div>
    </div>
  );
};

