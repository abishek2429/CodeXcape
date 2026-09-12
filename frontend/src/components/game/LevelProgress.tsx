import React from 'react';
import { CheckCircle2, Lock, Radio } from 'lucide-react';
import { LevelProgressItem } from '../../types/game';
import { SpotlightCard } from '../cinematic/SpotlightCard';

interface LevelProgressProps {
  levels: LevelProgressItem[];
  currentLevel?: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels }) => {
  return (
    <div
      style={{
        padding: '16px 20px',
        marginBottom: '20px',
        backgroundColor: 'var(--bg-panel-elevated)',
        border: '1px solid var(--border-crimson)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.75)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-crimson)',
              boxShadow: '0 0 6px var(--accent-crimson)',
            }}
          />
          <h2
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              margin: 0,
            }}
          >
            RESTRICTED TIER PROGRESSION
          </h2>
        </div>

        <span
          style={{
            fontSize: '10px',
            color: 'var(--accent-crimson-bright)',
            backgroundColor: 'rgba(225, 6, 19, 0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-crimson)',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          6 COOPERATIVE TIERS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        {levels.map((lvl) => {
          const isCompleted = lvl.status === 'COMPLETED';
          const isCurrent = lvl.status === 'CURRENT';
          const isLocked = lvl.status === 'LOCKED';
          const isLevel6Active = lvl.levelNumber === 6 && isCurrent;

          return (
            <SpotlightCard
              key={lvl.levelNumber}
              variant={isLevel6Active || isCurrent ? 'danger' : 'obsidian'}
              showCorners={true}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid',
                borderColor: isLevel6Active
                  ? 'var(--accent-crimson-bright)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.4)'
                  : isCurrent
                  ? 'var(--accent-crimson)'
                  : 'var(--border-dim)',
                backgroundColor: isLevel6Active
                  ? 'rgba(225, 6, 19, 0.2)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.06)'
                  : isCurrent
                  ? 'rgba(225, 6, 19, 0.12)'
                  : 'rgba(8, 8, 10, 0.6)',
                color: isLevel6Active
                  ? 'var(--accent-crimson-bright)'
                  : isCompleted
                  ? 'var(--status-success)'
                  : isCurrent
                  ? 'var(--text-cold-white)'
                  : 'var(--text-muted)',
                boxShadow: isLevel6Active
                  ? '0 0 20px rgba(225, 6, 19, 0.4)'
                  : isCurrent
                  ? '0 0 16px rgba(225, 6, 19, 0.25)'
                  : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em' }}>
                  TIER 0{lvl.levelNumber}
                </span>
                {isCompleted ? (
                  <CheckCircle2 size={13} color="var(--status-success)" />
                ) : isCurrent ? (
                  <Radio size={13} color="var(--accent-crimson-bright)" className="animate-pulse" />
                ) : (
                  <Lock size={13} color="var(--text-muted)" />
                )}
              </div>

              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  opacity: isLocked ? 0.5 : 0.85,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lvl.name}
              </span>

              {/* Progress bar inside tile */}
              <div
                style={{
                  marginTop: '8px',
                  height: '3px',
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '1px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: isCompleted ? '100%' : isCurrent ? '45%' : '0%',
                    backgroundColor: isCompleted
                      ? 'var(--status-success)'
                      : isLevel6Active
                      ? 'var(--accent-crimson-bright)'
                      : 'var(--accent-crimson)',
                    boxShadow: isCurrent ? '0 0 6px var(--accent-crimson)' : 'none',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};
