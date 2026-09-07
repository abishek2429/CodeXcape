import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PixelTransition } from '../cinematic/PixelTransition';
import { CinematicButton } from '../cinematic/CinematicButton';
import { SpotlightCard } from '../cinematic/SpotlightCard';

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
  const [showPixelEffect, setShowPixelEffect] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setShowPixelEffect(false);
      return;
    }

    setShowPixelEffect(true);
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
    <>
      <PixelTransition isActive={showPixelEffect} duration={400} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 5, 7, 0.94)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <SpotlightCard
          variant="cyan"
          style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: 'var(--bg-panel)',
            border: '2px solid var(--accent-cyan)',
            boxShadow: '0 0 60px rgba(0, 217, 255, 0.35)',
            padding: '36px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(0, 217, 255, 0.1)',
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

          <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', letterSpacing: '0.2em', fontWeight: 800 }}>
            LEVEL 0{completedLevelNumber} COMPLETE
          </div>

          <h2
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--text-cold-white)',
              letterSpacing: '0.06em',
              margin: '8px 0 16px 0',
              textTransform: 'uppercase',
            }}
          >
            EVIDENCE VERIFIED // TIER UNLOCKED
          </h2>

          {/* Acquired Fragment Callout */}
          <div
            style={{
              backgroundColor: 'rgba(4, 5, 7, 0.85)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px 20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--status-success)', fontWeight: 800, letterSpacing: '0.1em' }}>
              ACQUIRED RECOVERY FRAGMENT 0{completedLevelNumber}:
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {recoveryFragmentTitle}
            </div>
          </div>

          {/* Next Protocol */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '28px',
            }}
          >
            <span>NEXT PROTOCOL:</span>
            <span style={{ color: 'var(--text-cold-white)', fontWeight: 800 }}>
              LEVEL 0{nextLevelNumber} — {nextLevelName}
            </span>
          </div>

          <CinematicButton
            variant="primary"
            onClick={onClose}
            style={{ width: '100%', padding: '14px', fontSize: '13px' }}
          >
            <span>ENTER NEXT TIER ({countdown}s)</span>
            <ArrowRight size={16} />
          </CinematicButton>
        </SpotlightCard>
      </div>
    </>
  );
};
