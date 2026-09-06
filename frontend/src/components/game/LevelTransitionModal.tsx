import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface LevelTransitionModalProps {
  isOpen: boolean;
  completedLevelNumber: number;
  nextLevelNumber: number;
  nextLevelName: string;
  recoveryFragmentTitle: string;
  onClose: () => void;
}

export const LevelTransitionModal: React.FC<LevelTransitionModalProps> = ({
  isOpen,
  completedLevelNumber,
  nextLevelNumber,
  nextLevelName,
  recoveryFragmentTitle,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="cyber-panel animate-scale-up"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--bg-void)',
          border: '2px solid var(--accent-cyan)',
          boxShadow: '0 0 60px rgba(0, 217, 255, 0.35)',
          padding: '36px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-cyan-faded)',
            border: '2px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 25px rgba(0, 217, 255, 0.4)',
          }}
        >
          <ShieldCheck size={36} />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', letterSpacing: '0.2em', fontWeight: 'bold' }}>
          LEVEL 0{completedLevelNumber} COMPLETE
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: 'var(--text-primary)',
            margin: '12px 0',
            letterSpacing: '0.05em',
          }}
        >
          {recoveryFragmentTitle} CONFIRMED
        </h2>

        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            margin: '20px 0',
            fontSize: '12px',
            lineHeight: 1.8,
            color: 'var(--status-warning)',
          }}
        >
          &gt; UNKNOWN SOURCE REMAINS ACTIVE...<br />
          &gt; ROUTING INVESTIGATION TO NEXT NETWORK NODE...
        </div>

        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NEXT NODE TARGET:</span>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'var(--accent-cyan)',
              marginTop: '4px',
            }}
          >
            {nextLevelName.toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '4px', fontWeight: 'bold' }}>
            LEVEL 0{nextLevelNumber} UNLOCKED
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '14px', fontSize: '13px' }}
        >
          <span>ENGAGE NEXT NODE ({countdown}s)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
