import React from 'react';
import { CheckCircle2, Lock, Radio } from 'lucide-react';
import { LevelProgressItem } from '../../types/game';
import { Card } from '../ui/Card';
import { StatusDot } from '../ui/StatusDot';

interface LevelProgressProps {
  levels: LevelProgressItem[];
  currentLevel?: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels }) => {
  return (
    <Card style={{ padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusDot status="connected" />
          SECURITY CLEARANCE PROGRESSION
        </h2>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(0, 217, 255, 0.8)', backgroundColor: 'rgba(0, 217, 255, 0.1)', padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
          6 COOPERATIVE TIERS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {levels.map((lvl) => {
          const isCompleted = lvl.status === 'COMPLETED';
          const isCurrent = lvl.status === 'CURRENT';
          const isLocked = lvl.status === 'LOCKED';

          let bgColor = 'rgba(15, 23, 42, 0.5)';
          let borderColor = 'rgba(30, 41, 59, 0.8)';
          let textColor = 'var(--text-tertiary)';
          let shadow = 'none';

          if (isCompleted) {
            bgColor = 'rgba(16, 185, 129, 0.1)';
            borderColor = 'rgba(16, 185, 129, 0.5)';
            textColor = '#6ee7b7';
            shadow = '0 0 15px rgba(16, 185, 129, 0.15)';
          } else if (isCurrent) {
            bgColor = 'rgba(0, 217, 255, 0.15)';
            borderColor = 'var(--accent-cyan)';
            textColor = '#a5f3fc';
            shadow = '0 0 20px rgba(0, 217, 255, 0.25)';
          }

          return (
            <div
              key={lvl.levelNumber}
              style={{
                display: 'flex', flexDirection: 'column', padding: '12px', borderRadius: '12px', border: `1px solid ${borderColor}`,
                backgroundColor: bgColor, color: textColor, boxShadow: shadow, transition: 'all 0.3s', fontFamily: 'var(--font-mono)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TIER 0{lvl.levelNumber}
                </span>

                {isCompleted && <CheckCircle2 size={14} color="var(--status-success)" />}
                {isCurrent && <Radio size={14} color="var(--accent-cyan)" className="animate-pulse" />}
                {isLocked && <Lock size={12} color="var(--text-tertiary)" />}
              </div>

              <p style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isLocked ? 'var(--text-tertiary)' : 'var(--text-primary)' }} title={lvl.name}>
                {lvl.name.replace(/^Level \d+: /, '')}
              </p>

              {/* Progress bar track */}
              <div style={{ marginTop: '10px', width: '100%', backgroundColor: 'var(--bg-void)', height: '4px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%', borderRadius: '4px', transition: 'all 0.5s',
                    width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                    backgroundColor: isCompleted ? 'var(--status-success)' : isCurrent ? 'var(--accent-cyan)' : 'transparent',
                    boxShadow: isCompleted ? '0 0 8px rgba(16, 185, 129, 0.8)' : isCurrent ? '0 0 8px rgba(0, 217, 255, 0.8)' : 'none',
                  }}
                  className={isCurrent ? 'animate-pulse' : ''}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
