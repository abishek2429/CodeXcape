import React from 'react';
import { KeyRound, Lock, Unlock, Radio } from 'lucide-react';
import { HintData } from '../../types/game';
import { SpotlightCard } from '../cinematic/SpotlightCard';
import { ScrambledText } from '../cinematic/ScrambledText';
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
      style={{
        padding: '20px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={15} color="var(--status-warning)" />
          <h2
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              fontWeight: 800,
              color: 'var(--status-warning)',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            RECOVERED SYSTEM FRAGMENTS
          </h2>
        </div>
        <span
          style={{
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--status-warning)',
            fontWeight: 800,
          }}
        >
          STAGE 0{currentStage} ARCHIVE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {hints.length === 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            &gt; NO RECOVERED FRAGMENTS CURRENTLY RECORDED FOR THIS PROTOCOL_
          </div>
        )}

        {hints.map((hint, idx) => {
          const isUnlocked = hint.isUnlocked && hint.hintContent;
          const integrityPercent = Math.max(42, 85 - idx * 14);

          return (
            <SpotlightCard
              key={`${hint.levelNumber}-${hint.hintNumber || 1}`}
              variant={isUnlocked ? 'cyan' : 'obsidian'}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.04)' : 'rgba(4, 5, 7, 0.6)',
                borderColor: isUnlocked ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-dim)',
                color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {isUnlocked ? <Unlock size={13} /> : <Lock size={13} />}
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
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: isUnlocked ? 'var(--status-warning)' : 'var(--text-muted)',
                    }}
                  >
                    RECOVERED SYSTEM FRAGMENT 0{hint.hintNumber || idx + 1}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    INTEGRITY: {integrityPercent}%
                  </span>
                </div>

                {isUnlocked ? (
                  <div
                    style={{
                      color: 'var(--text-cold-white)',
                      backgroundColor: 'rgba(4, 5, 7, 0.85)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-xs)',
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
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 10px 0' }}>
                      <ScrambledText text="[ENCRYPTED ARCHIVAL TELEMETRY FRAGMENT]" glitchRate={0.06} />
                    </p>
                    {currentLevel === hint.levelNumber && onUseHint && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '10px', padding: '5px 12px' }}
                        onClick={() => handleRequest(hint.hintNumber || 1)}
                      >
                        <Radio size={11} style={{ marginRight: '6px' }} />
                        REQUEST DECRYPTION (FRAGMENT {hint.hintNumber || 1})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};
