import React from 'react';
import { ChallengeData } from '../../types/game';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;

  return (
    <section className="puzzle-section" aria-label="Current Puzzle">
      {/* 1. STAGE TITLE */}
      <div className="puzzle-header">
        <h1 className="puzzle-title">
          {challenge.title}
        </h1>

        {/* 2. SHORT MISSION / CONTEXT */}
        {(challenge.puzzleContext || challenge.instructions) && (
          <p className="puzzle-mission">
            {challenge.puzzleContext || challenge.instructions}
          </p>
        )}
      </div>

      {/* 3. YOUR INTELLIGENCE — ASYMMETRIC CLUE PANEL */}
      <div className="intelligence-panel">
        <div className="intelligence-header">
          <div className="intelligence-label">
            <span className="intelligence-indicator" />
            <span>YOUR INTELLIGENCE</span>
          </div>

          <div className="intelligence-coop-tag">
            OPERATOR 0{playerNumber} · PART {isP1 ? 'A' : 'B'}
          </div>
        </div>

        {/* Evidence / Code / Problem Data */}
        <div className="intelligence-body">
          <pre className="intelligence-content">
            {challenge.evidence}
          </pre>
        </div>

        {/* Cooperative Mechanic Reminder */}
        <div className="intelligence-coop-reminder">
          <span className="coop-reminder-text">
            YOUR TEAMMATE HAS ANOTHER PART. COMMUNICATE TO SOLVE.
          </span>
        </div>
      </div>

      {/* Additional Instructions (if distinct from mission text) */}
      {challenge.instructions && challenge.puzzleContext && (
        <div className="puzzle-instructions">
          <span className="instructions-label">DIRECTIVE:</span>
          <span className="instructions-text">{challenge.instructions}</span>
        </div>
      )}
    </section>
  );
};
