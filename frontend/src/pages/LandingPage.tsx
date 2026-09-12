import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundService } from '../services/soundService';
import { Volume2, VolumeX } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState<boolean>(() => soundService.isMuted());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRefs = useRef<any[]>([]);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Preload local sound files on mount and cleanup listeners/timers on unmount
  useEffect(() => {
    soundService.preloadHomeSounds();
    return () => {
      timerRefs.current.forEach((t) => clearTimeout(t));
    };
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
    // Prevent overlapping triggers if user clicks while animation is running
    if (stage !== 'idle') return;

    // 1. Play immediate cinematic knock sound (heavy glass / metal terminal impact)
    soundService.playKnockImpact(0.48);

    setStage('knocking');
    setShockwaveActive(true);

    if (prefersReducedMotion) {
      // Reduced motion: shorter visual duration but keep sound effect
      const tRed = setTimeout(() => {
        soundService.playGlitchTransition(0.35);
        setStage('ready');
      }, 500);
      timerRefs.current.push(tRed);
      return;
    }

    // Trigger brief terminal text
    const tNotice = setTimeout(() => {
      setKnockMessage(true);
    }, 120);
    timerRefs.current.push(tNotice);

    // Trigger letter split and escape sequence:
    // Other letters begin escaping away; X begins forward zoom with subtle rising digital whoosh
    const tEscape = setTimeout(() => {
      setLettersEscaped(true);
      // 2. Rising digital whoosh as X surges toward the camera
      soundService.playXApproachWhoosh(0.40);
    }, 200);
    timerRefs.current.push(tEscape);

    // 3. Short low glitch/fade-out sound as X vanishes and Ready screen appears
    const tGlitch = setTimeout(() => {
      soundService.playGlitchTransition(0.42);
    }, 1520);
    timerRefs.current.push(tGlitch);

    // Transition to the Ready screen after the X reaches and vanishes into darkness,
    // including an intentional 100ms extra pause on a clean black/crimson screen
    const tReady = setTimeout(() => {
      setStage('ready');
    }, 1650);
    timerRefs.current.push(tReady);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKnock();
    }
  };

  const toggleAudio = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const next = soundService.toggleMute();
    setIsMuted(next);
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

      {/* Subtle Corner Audio Mute/Unmute Control */}
      <button
        type="button"
        onClick={toggleAudio}
        className="home-audio-control"
        aria-label={isMuted ? 'Enable sound effects' : 'Mute sound effects'}
        title={isMuted ? 'Enable sound effects' : 'Mute sound effects'}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        <span className="audio-control-label">
          {isMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}
        </span>
      </button>

      {/* STAGE 1: INITIAL HOME SCREEN (CODEXCAPE + GIVE IT A KNOCK) */}
      {(stage === 'idle' || stage === 'knocking') && (
        <div className="home-center-stage">
          {/* Impact Shockwaves & Hero X Energy Tunnel */}
          {shockwaveActive && (
            <div className="impact-shockwave-container" aria-hidden="true">
              <div className="impact-shockwave wave-1" />
              <div className="impact-shockwave wave-2" />
              <div className="impact-spark-burst" />
              {lettersEscaped && (
                <>
                  <div className="x-hero-shockwave-ring" />
                  <div className="x-hero-energy-tunnel" />
                  <div className="x-hero-motion-streaks" />
                </>
              )}
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
                const isX = item.isX;
                let escapeClass = '';
                if (lettersEscaped) {
                  escapeClass = isX ? 'letter-x-hero' : `letter-escape letter-idx-${idx}`;
                }
                const isXClass = isX ? 'letter-x-glow' : 'letter-metallic';
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
