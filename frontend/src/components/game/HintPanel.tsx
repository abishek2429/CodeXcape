import React from 'react';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { HintData } from '../../types/game';

interface HintPanelProps {
  hints: HintData[];
  currentLevel?: number;
  currentStage?: number;
  onUseHint?: (hintNumber: number) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({ hints, currentLevel, currentStage, onUseHint }) => {
  return (
    <div className="cyber-panel" style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-dim)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={16} className="text-warning" />
          <h2 className="terminal-text text-warning" style={{ fontSize: '13px', letterSpacing: '0.1em', fontWeight: 600 }}>
            PASSKEY CLUE VAULT
          </h2>
        </div>
        <span className="badge badge-warning" style={{ fontSize: '10px' }}>
          6 CRYPTOGRAPHIC SHARDS
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {hints.map((hint) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;

          return (
            <div
              key={`${hint.levelNumber}-${hint.hintNumber || 1}`}
              style={{
                padding: '16px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                transition: 'all var(--transition-fast)',
                backgroundColor: isUnlocked ? 'var(--status-warning-dim)' : 'rgba(0,0,0,0.4)',
                borderColor: isUnlocked ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-dim)',
                color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)'
              }}
            >
              {isUnlocked ? (
                <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--status-warning-dim)', color: 'var(--status-warning)', flexShrink: 0 }}>
                  <CheckCircle2 size={16} />
                </div>
              ) : (
                <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Lock size={16} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="terminal-text" style={{ fontWeight: 'bold', letterSpacing: '0.05em', color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                    LEVEL {hint.levelNumber} // HINT {hint.hintNumber || 1}
                  </span>
                  {isUnlocked && (
                    <span className="badge badge-warning" style={{ fontSize: '9px' }}>
                      UNLOCKED
                    </span>
                  )}
                </div>
                {isUnlocked ? (
                  <p style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-panel)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}>
                    {hint.hintContent}
                  </p>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                      &gt; REQUEST THIS HINT WHEN THE CURRENT STAGE NEEDS DIRECTION_
                    </p>
                    {currentLevel === hint.levelNumber && currentStage && onUseHint && (
                      <button type="button" className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '10px' }} onClick={() => onUseHint(hint.hintNumber || 1)}>
                        REQUEST HINT {hint.hintNumber || 1}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
