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
    <div className="cyber-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-cyan)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-cyan-faded)', border: '1px solid var(--border-cyan)', color: 'var(--accent-cyan)' }}>
            <Terminal size={18} />
          </div>
          <h2 className="terminal-text" style={{ fontSize: '14px', letterSpacing: '0.1em', fontWeight: 700 }}>
            MISSION 0{challenge.levelNumber} // SPECIFICATION
          </h2>
        </div>

        <span className={`badge ${isP1 ? 'badge-cyan' : 'badge-purple'}`}>
          NODE 0{playerNumber} PERSPECTIVE
        </span>
      </div>

      {/* Title & Context */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
          {challenge.title}
        </h3>
        
        {challenge.puzzleContext && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-dim)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>CONTEXT:</span>
            <span className="terminal-text font-bold" style={{ color: 'var(--accent-cyan)' }}>{challenge.puzzleContext}</span>
          </div>
        )}
      </div>

      {/* Evidence & Instructions Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          padding: '24px', 
          borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'rgba(0, 0, 0, 0.6)', 
          border: '1px solid var(--border-dim)', 
          color: 'var(--text-primary)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '14px', 
          lineHeight: 1.8, 
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' 
        }}>
          <div className="text-sm text-gray-400 mb-2 font-bold tracking-wider">EVIDENCE / ARTIFACT:</div>
          <p style={{ whiteSpace: 'pre-line' }}>{challenge.evidence}</p>
        </div>

        {challenge.instructions && (
          <div style={{ 
            padding: '16px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'rgba(10, 25, 20, 0.8)', 
            border: '1px solid var(--border-cyan)', 
            color: 'var(--accent-cyan)', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '13px', 
            lineHeight: 1.6, 
          }}>
            <div className="text-xs mb-2 font-bold tracking-wider opacity-75">INSTRUCTIONS:</div>
            <p style={{ whiteSpace: 'pre-line' }}>{challenge.instructions}</p>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={14} color="var(--accent-cyan)" />
          <span>EXPECTED FORMAT: <strong style={{ color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-void)', padding: '2px 8px', borderRadius: '2px', border: '1px solid var(--border-dim)' }}>{challenge.answerType}</strong></span>
        </div>
        <span>TIER {challenge.levelNumber} OF 6</span>
      </div>
    </div>
  );
};
