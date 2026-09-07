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
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
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
              backgroundColor: 'var(--accent-cyan)',
              boxShadow: '0 0 6px var(--accent-cyan)',
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
            color: 'var(--accent-cyan)',
            backgroundColor: 'rgba(0, 217, 255, 0.08)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-cyan)',
            letterSpacing: '0.08em',
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
              variant={isLevel6Active ? 'danger' : isCompleted ? 'cyan' : isCurrent ? 'cyan' : 'obsidian'}
              showCorners={true}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid',
                borderColor: isLevel6Active
                  ? 'var(--accent-crimson)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.4)'
                  : isCurrent
                  ? 'var(--accent-cyan)'
                  : 'var(--border-dim)',
                backgroundColor: isLevel6Active
                  ? 'rgba(225, 29, 72, 0.12)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.06)'
                  : isCurrent
                  ? 'rgba(0, 217, 255, 0.08)'
                  : 'rgba(4, 5, 7, 0.6)',
                color: isLevel6Active
                  ? 'var(--accent-crimson)'
                  : isCompleted
                  ? 'var(--status-success)'
                  : isCurrent
                  ? 'var(--text-cold-white)'
                  : 'var(--text-muted)',
                boxShadow: isLevel6Active
                  ? '0 0 20px rgba(225, 29, 72, 0.35)'
                  : isCurrent
                  ? '0 0 16px rgba(0, 217, 255, 0.2)'
                  : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em' }}>
                  {isLevel6Active ? 'TIER 06 // CORE' : `TIER 0${lvl.levelNumber}`}
                </span>

                {isCompleted && <CheckCircle2 size={13} color="var(--status-success)" />}
                {isLevel6Active && <Radio size={13} color="var(--accent-crimson)" className="animate-pulse" />}
                {isCurrent && !isLevel6Active && <Radio size={13} color="var(--accent-cyan)" className="animate-pulse" />}
                {isLocked && <Lock size={12} color="var(--text-muted)" />}
              </div>

              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isLevel6Active ? 'var(--accent-crimson)' : isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                  margin: '2px 0 8px 0',
                }}
                title={lvl.name}
              >
                {lvl.name.replace(/^Level \d+: /, '')}
              </p>

              {/* Progress track */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-void)',
                  height: '3px',
                  borderRadius: '1px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-dim)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                    backgroundColor: isCompleted
                      ? 'var(--status-success)'
                      : isLevel6Active
                      ? 'var(--accent-crimson)'
                      : isCurrent
                      ? 'var(--accent-cyan)'
                      : 'transparent',
                    boxShadow: isCompleted
                      ? '0 0 6px var(--status-success)'
                      : isLevel6Active
                      ? '0 0 8px var(--accent-crimson)'
                      : isCurrent
                      ? '0 0 6px var(--accent-cyan)'
                      : 'none',
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
