import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from '../cinematic/SpotlightCard';
import './RecoveryFragment.css';

interface RecoveryFragmentProps {
  fragmentNumber: number;
  title: string;
  content?: string;
  isUnlocked: boolean;
  className?: string;
}

export const RecoveryFragment: React.FC<RecoveryFragmentProps> = ({
  fragmentNumber,
  title,
  content,
  isUnlocked,
  className = '',
}) => {
  return (
    <SpotlightCard
      variant={isUnlocked ? 'cyan' : 'obsidian'}
      className={`recovery-fragment-card ${isUnlocked ? 'is-recovered' : 'is-locked'} ${className}`}
    >
      <div className="recovery-fragment-header">
        <span className="recovery-fragment-id">FRAGMENT 0{fragmentNumber}</span>
        {isUnlocked ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-success)', fontSize: '10px' }}>
            <CheckCircle2 size={12} />
            <span>RECOVERED</span>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '10px' }}>
            <Lock size={12} />
            <span>ENCRYPTED</span>
          </span>
        )}
      </div>

      <div className="recovery-fragment-title">{title}</div>

      {isUnlocked && content && (
        <div className="recovery-fragment-content">
          {content}
        </div>
      )}
    </SpotlightCard>
  );
};
