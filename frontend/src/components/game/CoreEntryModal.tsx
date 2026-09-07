import React, { useEffect } from 'react';
import { ShieldAlert, ArrowRight, Radio } from 'lucide-react';
import { CinematicButton } from '../cinematic/CinematicButton';
import { soundService } from '../../services/soundService';
import './CoreEntryModal.css';

interface CoreEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoreEntryModal: React.FC<CoreEntryModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      soundService.playCoreActivation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="core-entry-overlay" role="dialog" aria-modal="true">
      <div className="core-entry-panel">
        <div className="core-entry-header">
          <div className="core-entry-title">
            <ShieldAlert size={18} color="var(--accent-crimson)" />
            <span>CODEXCAPE // CORE ACCESS</span>
          </div>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              backgroundColor: 'rgba(225, 29, 72, 0.15)',
              border: '1px solid var(--accent-crimson)',
              color: 'var(--accent-crimson)',
              fontWeight: 800,
            }}
          >
            CRITICAL EVENT
          </span>
        </div>

        <div className="core-entry-body">
          <div className="core-entry-line">
            <span style={{ color: 'var(--accent-cyan)' }}>&gt;</span>
            <span>AUTHENTICATING TWO OPERATORS...</span>
          </div>
          <div className="core-entry-line" style={{ color: 'var(--status-success)', marginLeft: '16px' }}>
            <span>OPERATOR 01 ... VERIFIED</span>
          </div>
          <div className="core-entry-line" style={{ color: 'var(--status-success)', marginLeft: '16px' }}>
            <span>OPERATOR 02 ... VERIFIED</span>
          </div>

          <div className="core-node-status">
            <div style={{ color: 'var(--accent-crimson)', fontWeight: 800, marginBottom: '6px' }}>
              NETWORK STATUS:
            </div>
            <div style={{ color: 'var(--status-warning)' }}>
              NODE 01 ... DEGRADED<br />
              NODE 02 ... DEGRADED<br />
              NODE 03 ... DEGRADED<br />
              NODE 04 ... DEGRADED<br />
              <span style={{ color: 'var(--accent-crimson)', fontWeight: 800 }}>NODE 05 ... CRITICAL</span>
            </div>
          </div>

          <div className="core-entry-line" style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
            <Radio size={14} className="animate-pulse" />
            <span>UNKNOWN NODE: NODE 06 ... ACTIVE</span>
          </div>

          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid var(--accent-crimson)',
              color: 'var(--accent-crimson)',
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            &gt; RECOVERY PROTOCOL DETECTED // AUTHORIZE OVERRIDE CONSOLE
          </div>
        </div>

        <CinematicButton
          variant="danger"
          onClick={onClose}
          style={{ width: '100%', padding: '14px', fontSize: '13px' }}
        >
          <span>ENTER THE CORE WORKSPACE</span>
          <ArrowRight size={16} />
        </CinematicButton>
      </div>
    </div>
  );
};
