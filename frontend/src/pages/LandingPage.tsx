import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Code2, Cpu, KeyRound, Terminal } from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Particle Canvas (Network Node Effect)
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

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 40), 50);
    const colors = ['rgba(0, 217, 255, 0.4)', 'rgba(0, 217, 255, 0.1)', 'rgba(139, 92, 246, 0.3)'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 217, 255, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
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

  return (
    <div className="landing-page">
      <div className="digital-noise-overlay"></div>
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* SECTION 1: HERO */}
      <section className="hero-section">
        <div className="security-pill animate-fade-in">
          <span className="indicator-dot indicator-connected"></span>
          <span>SYSTEM ONLINE // PORTAL ACTIVE</span>
        </div>

        <h1 className="hero-title animate-slide-up" style={{ animationDelay: '0.2s' }}>
          CODE<span className="title-accent animate-glitch">X</span>CAPE
        </h1>

        <p className="hero-tagline animate-slide-up terminal-text" style={{ animationDelay: '0.4s' }}>
          THINK. CONNECT. ESCAPE.
        </p>

        <p className="hero-desc animate-slide-up" style={{ animationDelay: '0.5s' }}>
          An immersive two-player collaborative technical escape protocol. Two minds, asymmetric cryptographic clues, six security layers, and one final passkey override.
        </p>

        <div className="hero-ctas animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <Link to="/player/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary animate-pulse-glow" style={{ padding: '16px 32px', fontSize: '16px' }}>
              <span>INITIATE PROTOCOL</span>
              <Terminal size={18} />
            </button>
          </Link>
        </div>
      </section>

      {/* SECTION 2: 4 PILLARS */}
      <section className="section">
        <div className="section-header">
          <div className="badge badge-cyan" style={{ marginBottom: '16px' }}>
            <span className="indicator-dot indicator-active" style={{ marginRight: '8px' }}></span>
            MISSION DIRECTIVES
          </div>
          <h2>THE FOUR PILLARS</h2>
        </div>

        <div className="grid-4">
          <div className="cyber-panel feature-card">
            <div className="feature-icon-wrapper text-cyan">
              <Cpu size={20} />
            </div>
            <h3 className="card-title">THINK</h3>
            <p className="card-desc">Analyze complex technical riddles, logic matrices, cipher algorithms, and reverse-engineering challenges.</p>
          </div>

          <div className="cyber-panel feature-card">
            <div className="feature-icon-wrapper text-purple">
              <Users size={20} />
            </div>
            <h3 className="card-title">COMMUNICATE</h3>
            <p className="card-desc">Neither player possesses the full puzzle. Share insights, variables, and cross-references over verbal link.</p>
          </div>

          <div className="cyber-panel feature-card">
            <div className="feature-icon-wrapper text-success">
              <Code2 size={20} />
            </div>
            <h3 className="card-title">SOLVE</h3>
            <p className="card-desc">Validate each terminal layer simultaneously. Every verified answer unlocks a cryptographic passkey shard.</p>
          </div>

          <div className="cyber-panel feature-card">
            <div className="feature-icon-wrapper text-warning">
              <KeyRound size={20} />
            </div>
            <h3 className="card-title">ESCAPE</h3>
            <p className="card-desc">Assemble all 6 clue shards, enter the 6-digit master override passkey into the final terminal, and claim victory.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
