import React from 'react';
import { Terminal, Code2 } from 'lucide-react';
import { ChallengeData } from '../../types/game';
import { Card } from '../ui/Card';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;

  return (
    <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: 'var(--accent-cyan)' }}>
              <Terminal size={16} />
            </div>
            <h2 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              MISSION 0{challenge.levelNumber} // CHALLENGE SPECIFICATION
            </h2>
          </div>

          <span className={`player-role-badge ${isP1 ? 'role-badge-p1' : 'role-badge-p2'}`}>
            Player 0{playerNumber} Node Perspective
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {challenge.title}
          </h3>
          {challenge.puzzleContext && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: 'var(--accent-cyan)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Context:</span>
              <span style={{ fontWeight: 600 }}>{challenge.puzzleContext}</span>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', lineHeight: 1.6, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
          <p style={{ whiteSpace: 'pre-line' }}>{challenge.description}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={16} color="var(--accent-cyan)" />
          <span>Expected Format: <strong style={{ color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-void)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{challenge.answerType}</strong></span>
        </div>
        <span>Tier {challenge.levelNumber} of 6</span>
      </div>
    </Card>
  );
};
