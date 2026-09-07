import React, { useState, useEffect } from 'react';
import { Trophy, Clock, ShieldCheck } from 'lucide-react';
import { soundService } from '../../services/soundService';
import { CinematicButton } from '../cinematic/CinematicButton';
import './FinalRestorationModal.css';

interface FinalRestorationModalProps {
  isOpen: boolean;
  finalRank?: number;
  elapsedTime?: string;
  onClose: () => void;
}

export const FinalRestorationModal: React.FC<FinalRestorationModalProps> = ({
  isOpen,
  finalRank,
  elapsedTime,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) return;

    soundService.playSystemRestoration();

    const t1 = setTimeout(() => setStep(2), 1200);
    const t2 = setTimeout(() => setStep(3), 2400);
    const t3 = setTimeout(() => setStep(4), 4000);
    const t4 = setTimeout(() => setStep(5), 5200);
    const t5 = setTimeout(() => setStep(6), 6400);
    const t6 = setTimeout(() => setStep(7), 7800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="final-restoration-overlay" role="dialog" aria-modal="true">
      <div className="final-restoration-container">
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--status-success)', paddingBottom: '16px', marginBottom: '24px' }}>
          <ShieldCheck size={36} color="var(--status-success)" />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--status-success)', margin: 0 }}>
              CODEXCAPE // EMERGENCY OVERRIDE VERIFIED
            </h1>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
              ALL 6 RECOVERY SHARDS SYNTHESIZED
            </div>
          </div>
        </div>

        {/* Multi-Step Recovery Sequence */}
        <div className="restoration-step-card">
          <div style={{ color: 'var(--status-success)', fontWeight: 800 }}>
            &gt; STEP 1: ACCESS GRANTED
          </div>

          {step >= 2 && (
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '4px' }}>
              &gt; STEP 2: SYSTEM RECOVERY INITIATED...
            </div>
          )}

          {step >= 3 && (
            <div style={{ margin: '10px 0 10px 16px', color: 'var(--text-primary)' }}>
              &gt; STEP 3: RESTORING NETWORK NODES<br />
              &nbsp;&nbsp;NODE 01 ... <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>RESTORED</span><br />
              &nbsp;&nbsp;NODE 02 ... <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>RESTORED</span><br />
              &nbsp;&nbsp;NODE 03 ... <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>RESTORED</span><br />
              &nbsp;&nbsp;NODE 04 ... <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>RESTORED</span><br />
              &nbsp;&nbsp;NODE 05 ... <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>RESTORED</span>
            </div>
          )}

          {step >= 4 && (
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
              &gt; STEP 4: NODE 06 ... VERIFIED // FAILSAFE DISENGAGED
            </div>
          )}

          {step >= 5 && (
            <div style={{ color: 'var(--status-success)', fontWeight: 800, marginTop: '4px' }}>
              &gt; STEP 5: NETWORK INTEGRITY: 100%
            </div>
          )}

          {step >= 6 && (
            <div style={{ color: 'var(--status-success)', fontWeight: 900, marginTop: '8px', fontSize: '14px', letterSpacing: '0.08em' }}>
              &gt; STEP 6: SYSTEM STABLE // CODEXCAPE COMPLETE
            </div>
          )}
        </div>

        {/* Final Story Reveal in Complete Stillness */}
        {step >= 7 && (
          <div className="story-reveal-block animate-fade-in">
            <div className="story-quote-main">
              YOU FOUND ME.
            </div>
            <div style={{ margin: '12px 0', color: 'var(--text-secondary)' }}>
              BUT THAT WAS NEVER THE REAL TEST.
            </div>
            <div style={{ color: 'var(--text-cold-white)', fontWeight: 700 }}>
              THE REAL TEST WAS WHETHER YOU COULD FIND WHAT WAS HIDDEN IN PLAIN SIGHT.
            </div>
          </div>
        )}

        {/* Official Final Time & Position Strip */}
        {step >= 7 && (
          <div className="final-telemetry-strip animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>FINAL TIME:</span>
              <span style={{ color: 'var(--text-cold-white)', fontWeight: 800, fontSize: '14px' }}>
                {elapsedTime || 'COMPLETED'}
              </span>
            </div>

            {finalRank !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} color="var(--status-warning)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>FINAL OFFICIAL RANK:</span>
                <span style={{ color: 'var(--status-warning)', fontWeight: 900, fontSize: '18px' }}>
                  #{finalRank}
                </span>
              </div>
            )}
          </div>
        )}

        {step >= 7 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <CinematicButton
              variant="primary"
              onClick={onClose}
              style={{ padding: '14px 32px', fontSize: '13px' }}
            >
              <span>DISMISS & VIEW RESTORED ARCHIVE</span>
            </CinematicButton>
          </div>
        )}
      </div>
    </div>
  );
};
