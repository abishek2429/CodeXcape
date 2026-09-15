import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES, MysteryRiddle } from '../../config/riddleConfig';
import { CinematicButton } from '../cinematic/CinematicButton';
import { soundService } from '../../services/soundService';

interface RiddleRevealModalProps {
  isOpen: boolean;
  unlockedLevelNumber: number; // e.g. 1 -> unlocks Riddle I
  onAcknowledge: () => void;
}

export const RiddleRevealModal: React.FC<RiddleRevealModalProps> = ({
  isOpen,
  unlockedLevelNumber,
  onAcknowledge,
}) => {
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(15);

  const riddle: MysteryRiddle | undefined = SIX_MYSTERY_RIDDLES.find(
    (r) => r.levelNumber === unlockedLevelNumber
  );

  useEffect(() => {
    if (!isOpen || !riddle) return;

    soundService.playClueDiscover();
    setAutoCloseSeconds(15);

    const timer = setInterval(() => {
      setAutoCloseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAcknowledge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, riddle, onAcknowledge]);

  if (!isOpen || !riddle) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(2, 3, 6, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out forwards',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-cyan)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 0 50px rgba(0, 217, 255, 0.25)',
          padding: '32px',
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Glow Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
          }}
        />

        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 217, 255, 0.12)',
              border: '1px solid var(--border-cyan)',
              color: 'var(--accent-cyan)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} />
            <span>RECOVERED RIDDLE // NEW REASONING CLUE</span>
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: 'var(--text-cold-white)',
              margin: '0 0 4px 0',
            }}
          >
            {riddle.romanNumeral}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--accent-cyan)', letterSpacing: '0.06em', fontWeight: 700 }}>
            {riddle.title}
          </div>
        </div>

        {/* Riddle Content Block */}
        <div
          style={{
            backgroundColor: 'rgba(4, 6, 10, 0.85)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-xs)',
            padding: '22px',
            fontSize: '13px',
            lineHeight: '1.8',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            marginBottom: '24px',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6)',
          }}
        >
          {riddle.riddleText}
        </div>

        {/* Sub-status: Fragment Stored */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px dashed var(--border-dim)',
            paddingTop: '16px',
            marginBottom: '20px',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)' }}>
            <CheckCircle2 size={15} />
            <span style={{ fontWeight: 800, letterSpacing: '0.08em' }}>FRAGMENT STORED IN MYSTERY BOARD</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            CONTINUING IN {autoCloseSeconds}S...
          </span>
        </div>

        {/* Continue Action */}
        <CinematicButton
          variant="primary"
          onClick={() => {
            soundService.playClick();
            onAcknowledge();
          }}
          style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em' }}
        >
          <span>CONTINUE TO NEXT LEVEL</span>
          <ArrowRight size={16} />
        </CinematicButton>
      </div>
    </div>
  );
};
