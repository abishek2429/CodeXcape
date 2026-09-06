import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ShieldAlert, ArrowRight, Volume2, VolumeX, SkipForward, Radio } from 'lucide-react';
import { soundService } from '../services/soundService';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const [bootPhase, setBootPhase] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Network Topology Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const nodes: { x: number; y: number; vx: number; vy: number; radius: number; isAnomalous: boolean }[] = [];
    const count = Math.min(Math.floor(window.innerWidth / 35), 45);

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 2 + 1,
        isAnomalous: i === 6, // Node 06 anomaly indicator
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;

        if (n1.x < 0) n1.x = width;
        if (n1.x > width) n1.x = 0;
        if (n1.y < 0) n1.y = height;
        if (n1.y > height) n1.y = 0;

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = n1.isAnomalous ? 'rgba(225, 29, 72, 0.7)' : 'rgba(0, 217, 255, 0.35)';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            const isRed = n1.isAnomalous || n2.isAnomalous;
            ctx.strokeStyle = isRed
              ? `rgba(225, 29, 72, ${0.3 * (1 - dist / 130)})`
              : `rgba(0, 217, 255, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = isRed ? 0.8 : 0.4;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Cinematic Boot Step Timeline
  useEffect(() => {
    // If previously seen, start directly at complete portal, or run sequence
    const hasSeen = sessionStorage.getItem('codexcape_landing_boot');
    if (hasSeen === 'true') {
      setBootPhase(5);
      return;
    }

    const t1 = setTimeout(() => {
      setBootPhase(1);
      soundService.playClick();
    }, 600);

    const t2 = setTimeout(() => {
      setBootPhase(2);
      soundService.playClick();
    }, 1700);

    const t3 = setTimeout(() => {
      setBootPhase(3);
      soundService.playClick();
    }, 2800);

    const t4 = setTimeout(() => {
      setBootPhase(4);
      soundService.playAccessDenied();
    }, 3900);

    const t5 = setTimeout(() => {
      setBootPhase(5);
      soundService.playLevelUnlock();
      sessionStorage.setItem('codexcape_landing_boot', 'true');
    }, 5200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipBoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const skipBoot = () => {
    setBootPhase(5);
    sessionStorage.setItem('codexcape_landing_boot', 'true');
    soundService.playClick();
  };

  const toggleSound = () => {
    const next = soundService.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="landing-page">
      <div className="digital-noise-overlay" />
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* Top Utility Bar */}
      <header className="landing-top-bar">
        <div className="system-status-indicator">
          <span className="indicator-dot indicator-connected" />
          <span className="font-mono text-xs letter-spacing-widest">
            {bootPhase >= 5 ? 'SYSTEM STATUS: OPERATIONAL' : 'SYSTEM STATUS: INITIALIZING'}
          </span>
        </div>

        <div className="landing-top-actions">
          {bootPhase < 5 && (
            <button
              type="button"
              onClick={skipBoot}
              className="btn btn-secondary btn-xs font-mono"
              title="Skip Boot Sequence (ESC)"
            >
              <SkipForward size={12} style={{ marginRight: '4px' }} />
              <span>SKIP [ESC]</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            className="btn btn-secondary btn-xs font-mono"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} color="var(--accent-cyan)" />}
            <span style={{ marginLeft: '4px' }}>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>
        </div>
      </header>

      {/* STAGE 1: CINEMATIC BOOT TERMINAL (Phases 0 to 4) */}
      {bootPhase < 5 && (
        <div className="boot-terminal-container">
          <div className="cyber-panel boot-terminal-panel animate-fade-in">
            <div className="terminal-top">
              <Terminal size={16} color="var(--accent-cyan)" />
              <span className="font-mono text-xs text-muted">SECURE KERNEL DIAGNOSTIC // NODE 01-05</span>
            </div>

            <div className="boot-terminal-lines font-mono">
              <div className="boot-line cyan-line">
                CODEXCAPE // SECURE NETWORK
              </div>
              <div className="boot-line muted-line">
                INITIALIZING ENCRYPTED CHANNELS...
              </div>

              {bootPhase >= 2 && (
                <div className="boot-nodes-block animate-fade-in">
                  <div>NODE 01 ... <span className="text-success">ONLINE</span></div>
                  <div>NODE 02 ... <span className="text-success">ONLINE</span></div>
                  <div>NODE 03 ... <span className="text-success">ONLINE</span></div>
                  <div>NODE 04 ... <span className="text-success">ONLINE</span></div>
                  <div>NODE 05 ... <span className="text-success">ONLINE</span></div>
                  <div style={{ marginTop: '6px', color: 'var(--accent-cyan)' }}>
                    NETWORK INTEGRITY: 87%
                  </div>
                </div>
              )}

              {bootPhase >= 3 && (
                <div className="boot-scan-block animate-fade-in">
                  <div className="text-muted">SCANNING DEEP PACKET SUBNETS...</div>
                  <div className="text-warning font-bold flex items-center gap-2">
                    <Radio size={14} />
                    UNKNOWN NODE DETECTED: NODE 06 ... [UNRESOLVED]
                  </div>
                </div>
              )}

              {bootPhase >= 4 && (
                <div className="boot-alert-block animate-glitch">
                  <div className="text-error font-bold flex items-center gap-2">
                    <ShieldAlert size={16} />
                    ERROR: NODE 06 DOES NOT EXIST IN ANY OFFICIAL NETWORK MAP
                  </div>
                  <div className="text-error text-xs" style={{ marginTop: '4px' }}>
                    WARNING: UNAUTHORIZED COMMUNICATION DETECTED
                  </div>
                  <div className="text-muted text-xs">
                    SOURCE: NODE 06 // DESTINATION: UNKNOWN
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: MAIN RESTRICTED SYSTEM PORTAL (Phase 5) */}
      {bootPhase >= 5 && (
        <main className="landing-main animate-slide-up">
          {/* HERO */}
          <section className="hero-section">
            <div className="security-pill">
              <Radio size={12} className="animate-pulse" color="var(--accent-cyan)" />
              <span>INVESTIGATION PROTOCOL ACTIVATED // NODE 06 DETECTED</span>
            </div>

            <h1 className="hero-title">
              CODE<span className="title-accent">X</span>CAPE
            </h1>

            <p className="hero-tagline terminal-text font-mono">
              THINK. CONNECT. ESCAPE.
            </p>

            <p className="hero-desc font-mono">
              The CodeXcape network officially contains five nodes. During a routine integrity scan, the system detects anomalous communication originating from <strong>NODE 06</strong>—a system that does not appear on any map. Two operators required.
            </p>

            <div className="hero-ctas">
              <Link to="/player/login" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  onClick={() => soundService.playClick()}
                  className="btn btn-primary hero-btn animate-pulse-glow"
                >
                  <span>ENTER THE SYSTEM</span>
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </section>

          {/* THE 4 MISSION OBJECTIVES */}
          <section className="section directives-section">
            <div className="section-header">
              <div className="badge badge-cyan" style={{ marginBottom: '12px' }}>
                MISSION DOSSIER
              </div>
              <h2 className="section-title">THE FOUR INVESTIGATION OBJECTIVES</h2>
              <p className="section-subtitle font-mono text-muted">
                Neither operator possesses the complete system state. Synchronize telemetry over verbal link.
              </p>
            </div>

            <div className="grid-4">
              <div className="cyber-panel directive-card">
                <div className="directive-number font-mono">01</div>
                <h3 className="card-title">LOCATE NODE 06</h3>
                <p className="card-desc">
                  Reconstruct collision logs and access panel circuits to isolate the unmapped physical node.
                </p>
              </div>

              <div className="cyber-panel directive-card">
                <div className="directive-number font-mono">02</div>
                <h3 className="card-title">TRACE ITS ORIGIN</h3>
                <p className="card-desc">
                  Assemble encrypted data fragments and follow the hidden packet forwarding route.
                </p>
              </div>

              <div className="cyber-panel directive-card">
                <div className="directive-number font-mono">03</div>
                <h3 className="card-title">DETERMINE PURPOSE</h3>
                <p className="card-desc">
                  Decrypt historical internal archives and correlate forensic evidence boards across collapsed nodes.
                </p>
              </div>

              <div className="cyber-panel directive-card">
                <div className="directive-number font-mono">04</div>
                <h3 className="card-title">RECOVER PASSKEY</h3>
                <p className="card-desc">
                  Synthesize all 6 recovered fragments to authorize the emergency master override console.
                </p>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
};
