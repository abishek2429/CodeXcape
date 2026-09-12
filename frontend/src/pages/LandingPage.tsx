import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundService } from '../services/soundService';
import './LandingPage.css';

// Fragments for the ready screen ambient background
const FRAGMENT_POOL = [
  'NODE 01', 'NODE 02', 'NODE 03', 'NODE 04', 'NODE 05', 'NODE 06',
  'A', 'B', 'C', 'D', 'E', 'X', 'P', 'R', 'O',
  '0', '1', '2', '3', '4', '5', '7', '8', '9',
  '@', '#', '%', '&', '/', '\\', '>', '_', '+', '=', '!', '?',
  'ROOT_ACCESS', 'UNKNOWN', 'TRACE', 'ECHO', 'SIGNAL_FOUND', '02:13',
];

const FRAGMENT_COLORS = [
  '#E10613', // primary crimson
  '#FF2446', // bright red
  '#5E0008', // deep dark red
  '#8B0E1B', // dark red
  '#888888', // gray
  '#666666', // dark gray
  'rgba(245, 245, 245, 0.4)', // dim metallic white
];

interface FragmentItem {
  id: number;
  text: string;
  x: number; // 0-100vw
  y: number; // 0-100vh
  color: string;
  opacity: number;
  fontSize: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

const LETTERS = [
  { char: 'C', key: 'c1' },
  { char: 'O', key: 'o1' },
  { char: 'D', key: 'd1' },
  { char: 'E', key: 'e1' },
  { char: 'X', key: 'x1', isX: true },
  { char: 'C', key: 'c2' },
  { char: 'A', key: 'a1' },
  { char: 'P', key: 'p1' },
  { char: 'E', key: 'e2' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  // Stages: 'idle' -> 'knocking' -> 'ready'
  const [stage, setStage] = useState<'idle' | 'knocking' | 'ready'>('idle');
  const [knockMessage, setKnockMessage] = useState(false);
  const [lettersEscaped, setLettersEscaped] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Generate 42 wandering fragments with deterministic seeded distribution
  const fragments: FragmentItem[] = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const text = FRAGMENT_POOL[i % FRAGMENT_POOL.length];
      const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
      const opacity = 0.22 + ((i * 7) % 30) / 100; // 0.22 to 0.51
      const fontSize = 10 + (i % 6) * 2; // 10px to 20px
      const x = (i * 23) % 94 + 3; // percentage
      const y = (i * 37) % 90 + 5;
      const duration = 14 + (i % 12) * 1.5; // 14s to 30s
      const delay = -(i * 1.3);
      const dx = ((i % 5) - 2) * 24; // drift offsets
      const dy = (((i + 2) % 5) - 2) * 24;
      return { id: i, text, x, y, color, opacity, fontSize, duration, delay, dx, dy };
    });
  }, []);

  const handleKnock = () => {
    if (stage !== 'idle') return;

    soundService.playClick();
    setStage('knocking');
    setShockwaveActive(true);

    if (prefersReducedMotion) {
      // Reduced motion: short fade without violent screen shake or 3D letter scatter
      setTimeout(() => {
        setStage('ready');
      }, 500);
      return;
    }

    // Trigger brief terminal text
    setTimeout(() => {
      setKnockMessage(true);
    }, 150);

    // Trigger individual 3D letter escape sequence
    setTimeout(() => {
      setLettersEscaped(true);
    }, 320);

    // Direct transition to the Ready screen after ~1.25s
    setTimeout(() => {
      setStage('ready');
    }, 1300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKnock();
    }
  };

  const handleProceedToLogin = () => {
    soundService.playClick();
    navigate('/player/login');
  };

  return (
    <div
      ref={containerRef}
      className={`crimson-home-container ${stage === 'knocking' ? 'knock-shake' : ''}`}
    >
      {/* Background Deep Crimson Radial Smoke & Scanlines */}
      <div className="crimson-bg-smoke" aria-hidden="true" />
      <div className="crimson-grid-lines" aria-hidden="true" />
      <div className="crimson-scanlines" aria-hidden="true" />

      {/* Floating Red Embers */}
      <div className="crimson-embers-layer" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, idx) => (
          <span
            key={idx}
            className="crimson-ember"
            style={{
              left: `${(idx * 17) % 98}%`,
              animationDuration: `${6 + (idx % 5) * 2}s`,
              animationDelay: `${idx * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* STAGE 1: INITIAL HOME SCREEN (CODEXCAPE + GIVE IT A KNOCK) */}
      {(stage === 'idle' || stage === 'knocking') && (
        <div className="home-center-stage">
          {/* Impact Pulse shockwaves on Knock */}
          {shockwaveActive && (
            <div className="impact-shockwave-container" aria-hidden="true">
              <div className="impact-shockwave wave-1" />
              <div className="impact-shockwave wave-2" />
              <div className="impact-spark-burst" />
            </div>
          )}

          {/* Interactive Title with Idle Hover & 3D Letter Escape */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Knock to activate CodeXcape"
            onClick={handleKnock}
            onKeyDown={handleKeyDown}
            className={`codexcape-title-interactive ${stage === 'knocking' ? 'is-knocking' : ''}`}
          >
            <h1 className="codexcape-title-display">
              {LETTERS.map((item, idx) => {
                const escapeClass = lettersEscaped ? `letter-escape letter-idx-${idx}` : '';
                const isXClass = item.isX ? 'letter-x-glow' : 'letter-metallic';
                return (
                  <span
                    key={item.key}
                    className={`title-letter ${isXClass} ${escapeClass}`}
                    style={{ '--letter-idx': idx } as React.CSSProperties}
                  >
                    {item.char}
                  </span>
                );
              })}
            </h1>
          </div>

          {/* Subtitle / Knock status */}
          <div className="knock-caption-wrapper">
            {knockMessage ? (
              <div className="knock-terminal-notice animate-fade-in">
                <span className="notice-glitch-icon">▲</span>
                <span>KNOCK DETECTED // ACCESSING HIDDEN NETWORK</span>
              </div>
            ) : (
              <p className="give-knock-text">GIVE IT A KNOCK</p>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: READY SCREEN */}
      {stage === 'ready' && (
        <div className="ready-screen-stage animate-fade-in">
          {/* 30-50 Wandering Fragments Behind Central Text */}
          <div className="wandering-fragments-canvas" aria-hidden="true">
            {fragments.map((frag) => (
              <span
                key={frag.id}
                className="wandering-fragment"
                style={{
                  left: `${frag.x}%`,
                  top: `${frag.y}%`,
                  color: frag.color,
                  opacity: frag.opacity,
                  fontSize: `${frag.fontSize}px`,
                  animationDuration: `${frag.duration}s`,
                  animationDelay: `${frag.delay}s`,
                  '--dx': `${frag.dx}px`,
                  '--dy': `${frag.dy}px`,
                } as React.CSSProperties}
              >
                {frag.text}
              </span>
            ))}
          </div>

          {/* Foreground Central Hero Text & CTA */}
          <div className="ready-screen-content">
            <div className="ready-text-box">
              <h1 className="ready-heading-line">THERE IS ONE WAY OUT.</h1>
              <h2 className="ready-subheading-line">CAN YOU FIND IT?</h2>
            </div>

            <div className="ready-action-box">
              <button
                type="button"
                onClick={handleProceedToLogin}
                className="crimson-cta-btn"
                autoFocus
              >
                <span className="cta-btn-text">FIND THE WAY OUT</span>
                <span className="cta-btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
