import React from 'react';
import { KeyRound, Lock, Unlock, Radio } from 'lucide-react';
import { HintData } from '../../types/game';
import { soundService } from '../../services/soundService';

interface HintPanelProps {
  hints: HintData[];
  currentLevel?: number;
  currentStage?: number;
  onUseHint?: (hintNumber: number) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  currentLevel,
  currentStage = 1,
  onUseHint,
}) => {
  const handleRequest = (hintNum: number) => {
    soundService.playClick();
    if (onUseHint) {
      onUseHint(hintNum);
    }
  };

  return (
    <div
      className="cyber-panel"
      style={{
        padding: '20px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={15} className="text-warning" />
          <h2
            className="terminal-text text-warning"
            style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}
          >
            RECOVERED SYSTEM FRAGMENTS
          </h2>
        </div>
        <span className="badge badge-warning" style={{ fontSize: '9px', padding: '2px 6px' }}>
          STAGE 0{currentStage} ARCHIVE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {hints.length === 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            &gt; NO RECOVERED FRAGMENTS FOR ACTIVE PROTOCOL_
          </div>
        )}

        {hints.map((hint, idx) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;
          const integrityPercent = Math.max(54, 88 - idx * 14);

          return (
            <div
              key={`${hint.levelNumber}-${hint.hintNumber || 1}`}
              className={isUnlocked ? 'animate-fade-in' : ''}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.05)' : 'rgba(5, 6, 8, 0.5)',
                borderColor: isUnlocked ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-dim)',
                color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      letterSpacing: '0.08em',
                      color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
                    }}
                  >
                    RECOVERED SYSTEM FRAGMENT
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    INTEGRITY: {integrityPercent}%
                  </span>
                </div>

                {isUnlocked ? (
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'rgba(5, 6, 8, 0.8)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    &gt; {hint.hintContent}
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 8px 0' }}>
                      [ENCRYPTED TECHNICAL TELEMETRY]
                    </p>
                    {currentLevel === hint.levelNumber && onUseHint && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '10px', padding: '4px 10px' }}
                        onClick={() => handleRequest(hint.hintNumber || 1)}
                      >
                        <Radio size={11} style={{ marginRight: '4px' }} />
                        REQUEST DECRYPTION ({hint.hintNumber || 1})
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
