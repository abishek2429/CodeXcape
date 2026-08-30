import React from 'react';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { HintData } from '../../types/game';
import { Card } from '../ui/Card';

interface HintPanelProps {
  hints: HintData[];
}

export const HintPanel: React.FC<HintPanelProps> = ({ hints }) => {
  return (
    <Card style={{ padding: '20px', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={16} color="var(--status-warning)" />
          <h2 style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: '#fcd34d' }}>
            PASSKEY CLUE VAULT
          </h2>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          6 CRYPTOGRAPHIC SHARDS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {hints.map((hint) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;

          return (
            <div
              key={hint.levelNumber}
              style={{
                padding: '14px', borderRadius: '12px', border: '1px solid', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', transition: 'all 0.2s',
                backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.05)' : 'rgba(15, 23, 42, 0.5)',
                borderColor: isUnlocked ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)',
                color: isUnlocked ? '#fde68a' : 'var(--text-secondary)',
                boxShadow: isUnlocked ? '0 0 15px rgba(245, 158, 11, 0.1)' : 'none'
              }}
            >
              {isUnlocked ? (
                <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--status-warning)', flexShrink: 0 }}>
                  <CheckCircle2 size={14} />
                </div>
              ) : (
                <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  <Lock size={14} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', letterSpacing: '0.05em', color: isUnlocked ? '#fcd34d' : 'var(--text-secondary)' }}>
                    SHARD 0{hint.levelNumber}
                  </span>
                  {isUnlocked && (
                    <span style={{ fontSize: '9px', color: 'var(--status-warning)', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 'bold' }}>
                      UNLOCKED
                    </span>
                  )}
                </div>
                {isUnlocked ? (
                  <p style={{ color: 'var(--text-primary)', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6 }}>
                    {hint.hintContent}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontStyle: 'italic' }}>
                    Complete Level {hint.levelNumber} to decrypt this passkey shard.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
