import React from 'react';
import { Headphones, Radio, Sparkles } from 'lucide-react';
import { soundService } from '../../services/soundService';
import { voiceNarratorService } from '../../services/voiceNarratorService';

interface OpeningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerNumber: number;
  onCommence?: (withAudio: boolean) => void;
}

export const OpeningBriefingModal: React.FC<OpeningBriefingModalProps> = ({
  isOpen,
  onClose,
  playerNumber,
  onCommence,
}) => {

  if (!isOpen) return null;

  const handleCommence = (enableAudio: boolean) => {
    if (enableAudio) {
      voiceNarratorService.setMuted(false);
      soundService.setMuted(false);
      // Play tactile futuristic chime to unlock audio context smoothly
      soundService.playFindWayOutUnlock(0.5);
    } else {
      voiceNarratorService.setMuted(true);
      soundService.setMuted(true);
    }

    if (onCommence) {
      onCommence(enableAudio);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cyber-panel"
        style={{
          maxWidth: '640px',
          width: '100%',
          backgroundColor: 'rgba(6, 13, 24, 0.95)',
          border: '1.5px solid var(--accent-cyan, #00f0ff)',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.3), inset 0 0 30px rgba(0, 240, 255, 0.05)',
          borderRadius: '12px',
          padding: '36px 32px',
          position: 'relative',
          fontFamily: 'var(--font-mono, monospace)',
          textAlign: 'center',
        }}
      >
        {/* Top Telemetry Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
            paddingBottom: '14px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={14} className="animate-pulse" color="#00f0ff" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#00f0ff',
              }}
            >
              AUDIO TELEMETRY CALIBRATION
            </span>
          </div>

          <span
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00f0ff',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            OPERATOR 0{playerNumber}
          </span>
        </div>

        {/* Headphones Visual Icon with Pulsing Halo */}
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, transparent 70%)',
              animation: 'pulseGlow 2.5s infinite alternate',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 240, 255, 0.08)',
              border: '1.5px solid rgba(0, 240, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
            }}
          >
            <Headphones size={40} color="#00f0ff" />
          </div>
        </div>

        {/* Advisory Title & Narrative */}
        <h1
          style={{
            fontSize: '19px',
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#ffffff',
            margin: '0 0 12px 0',
            textShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
          }}
        >
          WEAR EARPHONES FOR THE BEST EXPERIENCE
        </h1>

        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.7,
            color: '#c0d8ec',
            maxWidth: '520px',
            margin: '0 auto 24px auto',
            letterSpacing: '0.02em',
          }}
        >
          Incoming encrypted quantum feed from <strong style={{ color: '#00f0ff' }}>Artemis</strong> and{' '}
          <strong style={{ color: '#ff3344' }}>Node 06</strong>. This escape simulation utilizes synchronized
          character voice narration, spatial alarms, and binaural audio telemetry.
        </p>

        {/* Ambient Waveform Preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            height: '24px',
            marginBottom: '28px',
          }}
        >
          {[8, 14, 20, 12, 18, 24, 16, 10, 22, 14, 8].map((h, idx) => (
            <div
              key={idx}
              style={{
                width: '3px',
                height: `${h}px`,
                backgroundColor: '#00f0ff',
                borderRadius: '1px',
                opacity: 0.8,
              }}
            />
          ))}
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '10px' }}>
            ACOUSTIC HARMONICS OPTIMIZED
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => handleCommence(true)}
            className="btn btn-primary"
            style={{
              padding: '15px 36px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '380px',
              justifyContent: 'center',
            }}
          >
            <Headphones size={16} />
            <span>COMMENCE TRANSMISSION</span>
            <Sparkles size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleCommence(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              padding: '6px 12px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
          >
            [PROCEED MUTED WITHOUT AUDIO]
          </button>
        </div>
      </div>
    </div>
  );
};
