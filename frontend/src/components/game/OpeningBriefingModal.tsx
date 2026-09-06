import React from 'react';
import { Terminal, ShieldAlert, CheckCircle2, Radio } from 'lucide-react';

interface OpeningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerNumber: number;
}

export const OpeningBriefingModal: React.FC<OpeningBriefingModalProps> = ({
  isOpen,
  onClose,
  playerNumber,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '720px',
          width: '100%',
          backgroundColor: 'var(--bg-void)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: '0 0 50px rgba(0, 217, 255, 0.25)',
          padding: '32px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-cyan)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '6px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-cyan-faded)',
                color: 'var(--accent-cyan)',
              }}
            >
              <Terminal size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  letterSpacing: '0.15em',
                  color: 'var(--accent-cyan)',
                }}
              >
                CODEXCAPE // SECURE NETWORK BRIEFING
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                INVESTIGATION PROTOCOL: THE SIXTH NODE
              </div>
            </div>
          </div>

          <span className="badge badge-cyan">
            OPERATOR 0{playerNumber} CONSOLE
          </span>
        </div>

        {/* Narrative Terminal Output */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
            fontSize: '13px',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.9)',
          }}
        >
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
            CODEXCAPE // SECURE NETWORK
          </div>
          <div style={{ marginTop: '8px' }}>
            NODE 01 ... <span style={{ color: 'var(--status-success)' }}>ONLINE</span><br />
            NODE 02 ... <span style={{ color: 'var(--status-success)' }}>ONLINE</span><br />
            NODE 03 ... <span style={{ color: 'var(--status-success)' }}>ONLINE</span><br />
            NODE 04 ... <span style={{ color: 'var(--status-success)' }}>ONLINE</span><br />
            NODE 05 ... <span style={{ color: 'var(--status-success)' }}>ONLINE</span>
          </div>

          <div style={{ marginTop: '12px', color: 'var(--accent-cyan)' }}>
            NETWORK INTEGRITY: 87%
          </div>

          <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
            SCANNING...
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-error)',
              borderRadius: '4px',
            }}
          >
            <div style={{ color: 'var(--status-error)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              UNKNOWN NODE DETECTED
            </div>
            <div style={{ marginTop: '4px' }}>
              NODE 06 ... <span style={{ color: 'var(--status-error)' }}>[UNRESOLVED]</span><br />
              <strong style={{ color: 'var(--status-error)' }}>ERROR: NODE 06 DOES NOT EXIST IN ANY OFFICIAL NETWORK MAP</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--status-warning)',
              borderRadius: '4px',
            }}
          >
            <div style={{ color: 'var(--status-warning)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} />
              WARNING: UNAUTHORIZED COMMUNICATION DETECTED
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              SOURCE: <strong>NODE 06</strong><br />
              DESTINATION: <strong>UNKNOWN</strong><br />
              STATUS: <strong>INVESTIGATION PROTOCOL ACTIVATED</strong><br />
              PERSONNEL: <strong>TWO OPERATORS REQUIRED</strong>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              MISSION OBJECTIVES:
            </div>
            <div style={{ marginTop: '8px', paddingLeft: '8px' }}>
              <div>01 — LOCATE NODE 06</div>
              <div>02 — TRACE ITS ORIGIN</div>
              <div>03 — DETERMINE ITS PURPOSE</div>
              <div>04 — RECOVER THE FINAL ACCESS SEQUENCE</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px dashed var(--border-dim)',
              color: 'var(--status-warning)',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}
          >
            &gt; DO NOT TRUST THE NETWORK MAP.
          </div>
        </div>

        {/* Action button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{ padding: '14px 28px', fontSize: '13px' }}
          >
            <CheckCircle2 size={16} />
            <span>ACKNOWLEDGE & COMMENCE INVESTIGATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
