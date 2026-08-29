import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  ShieldAlert,
  Users,
  Code2,
  Cpu,
  Radio,
  ArrowRight,
  Zap,
  CheckCircle2,
  Layers,
  KeyRound,
  ChevronDown
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle interactive cyber particle grid canvas
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
    const particleCount = Math.min(Math.floor(window.innerWidth / 25), 45);

    const colors = ['rgba(0, 240, 255, 0.4)', 'rgba(168, 85, 247, 0.3)', 'rgba(16, 185, 129, 0.3)'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle nodes and interconnecting telemetry lines
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

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">
      {/* Background Interactive Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-60"
      />

      {/* Decorative Cyber Grid Background & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-3/4 right-1/4 w-[500px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* SECTION 1: HERO */}
      <section className="relative z-10 min-h-[calc(100vh-76px)] flex flex-col items-center justify-center px-4 sm:px-6 py-16 max-w-6xl mx-auto text-center">
        
        {/* Security Clearance Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-ping text-cyan-400"></span>
          <span>HIGH-SECURITY DIGITAL ESCAPE ROOM</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">v2.0</span>
        </div>

        {/* Main Title with futuristic 'X' design */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-heading tracking-tight text-white mb-6 uppercase animate-fade-in">
          CODE<span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.6)]">X</span>CAPE
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200 tracking-wide max-w-3xl mx-auto mb-6">
          THINK. CONNECT. ESCAPE.
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-400 font-mono max-w-2xl mx-auto mb-10 leading-relaxed">
          An immersive two-player collaborative technical escape protocol. Two minds, asymmetric cryptographic clues, six security layers, and one final passkey override.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-16 animate-slide-up">
          <Link
            to="/player/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl cyber-btn-primary font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-3 group"
          >
            <span>ENTER CODEXCAPE</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={() => scrollToSection('how-it-works')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl cyber-btn-secondary font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>HOW IT WORKS</span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={() => scrollToSection('about')}
          className="text-slate-500 hover:text-cyan-400 transition-colors flex flex-col items-center gap-2 cursor-pointer font-mono text-xs"
        >
          <span>EXPLORE PROTOCOL</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
        </button>

      </section>

      {/* SECTION 2: 4 PILLARS (ABOUT) */}
      <section id="about" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            THE FOUR PILLARS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
            MISSION DIRECTIVES
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 01 */}
          <div className="cyber-panel cyber-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="text-3xl font-heading font-black text-slate-700 group-hover:text-cyan-400/40 transition-colors mb-4">
              01
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THINK</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Analyze complex technical riddles, logic matrices, cipher algorithms, and reverse-engineering challenges.
            </p>
          </div>

          {/* Card 02 */}
          <div className="cyber-panel cyber-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="text-3xl font-heading font-black text-slate-700 group-hover:text-purple-400/40 transition-colors mb-4">
              02
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">COMMUNICATE</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Neither player possesses the full puzzle. Share insights, variables, and cross-references over verbal link.
            </p>
          </div>

          {/* Card 03 */}
          <div className="cyber-panel cyber-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="text-3xl font-heading font-black text-slate-700 group-hover:text-emerald-400/40 transition-colors mb-4">
              03
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">SOLVE</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Validate each terminal layer simultaneously. Every verified answer unlocks a cryptographic passkey shard.
            </p>
          </div>

          {/* Card 04 */}
          <div className="cyber-panel cyber-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="text-3xl font-heading font-black text-slate-700 group-hover:text-amber-400/40 transition-colors mb-4">
              04
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">ESCAPE</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Assemble all 6 clue shards, enter the 6-digit master override passkey into the final terminal, and claim victory.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 3: HOW THE GAME WORKS (2-PLAYER CO-OP VISUAL) */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="cyber-panel p-8 sm:p-12 rounded-3xl border border-cyan-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              COOPERATIVE ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
              HOW TWO-PLAYER CO-OP WORKS
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-2">
              Asymmetric information protocol ensures that neither player can escape alone.
            </p>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Player 1 Node */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/40 text-center relative group">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase mb-2">
                PLAYER 01 — OPERATOR
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Receives the primary console challenge, code snippets, and structural logic parameters.
              </p>
            </div>

            {/* Communication & Real-time Link */}
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-full flex items-center justify-center gap-2 mb-3">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-cyan-500/50"></div>
                <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 font-mono text-[11px] font-bold tracking-wider">
                  REAL-TIME LINK
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-cyan-500/50"></div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                Live communication is essential. Both players must submit their individual challenge to unlock the next level.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>BOTH NODES MUST VERIFY</span>
              </div>
            </div>

            {/* Player 2 Node */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-purple-500/40 text-center relative group">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase mb-2">
                PLAYER 02 — ANALYZER
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Receives the complementary key dataset, decipher matrix, and dependent variables.
              </p>
            </div>

          </div>

          {/* Level Unlocked Banner */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>LEVEL SOLVED → PASSKEY SHARD UNLOCKED → PROGRESS TO NEXT TIER</span>
            </div>
            <span className="text-slate-500">6 Interdependent Challenges</span>
          </div>

        </div>
      </section>

      {/* SECTION 4: SIX LEVELS MISSION TIMELINE */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
            <Layers className="w-3.5 h-3.5" />
            MISSION PROGRESSION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
            SIX SECURITY TIERS
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-2">
            Each level increases in difficulty and unlocks a vital clue toward the final 6-digit terminal passkey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Level 01 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-cyan-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">LEVEL 01</span>
              <span className="px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono">TIER: ENTRY</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE ENTRY PROTOCOL</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Initial perimeter scan. Establish synchronized handshake between Operator and Analyzer nodes.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Intro</span>
              <span className="text-cyan-400 font-semibold">Clue Shard #1</span>
            </div>
          </div>

          {/* Level 02 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-cyan-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">LEVEL 02</span>
              <span className="px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono">TIER: NETWORK</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE NETWORK ROUTE</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Trace obfuscated telemetry packets, identify corrupt routing tables, and isolate packet leaks.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Easy</span>
              <span className="text-cyan-400 font-semibold">Clue Shard #2</span>
            </div>
          </div>

          {/* Level 03 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-purple-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-purple-400 tracking-wider">LEVEL 03</span>
              <span className="px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[10px] font-mono">TIER: LOGIC</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE LOGIC CORE</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Solve algorithmic constraints, state transitions, and bitwise verification paradoxes.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Medium</span>
              <span className="text-purple-400 font-semibold">Clue Shard #3</span>
            </div>
          </div>

          {/* Level 04 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-purple-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-purple-400 tracking-wider">LEVEL 04</span>
              <span className="px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[10px] font-mono">TIER: CIPHER</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE CIPHER VAULT</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Decipher multi-layered cryptographic hashes, frequency analysis, and substitution schemas.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Hard</span>
              <span className="text-purple-400 font-semibold">Clue Shard #4</span>
            </div>
          </div>

          {/* Level 05 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-emerald-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">LEVEL 05</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-mono">TIER: SYSTEM</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE SYSTEM KERNEL</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Reverse-engineer security policies, stack trace vulnerabilities, and memory register states.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Expert</span>
              <span className="text-emerald-400 font-semibold">Clue Shard #5</span>
            </div>
          </div>

          {/* Level 06 */}
          <div className="cyber-panel p-6 rounded-2xl relative border-l-4 border-l-amber-400">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">LEVEL 06</span>
              <span className="px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 text-[10px] font-mono">TIER: CLIMAX</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">THE FINAL PROTOCOL</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              The ultimate puzzle. Synthesize all unlocked clues to calculate the 6-digit master override passkey.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-3">
              <span>Difficulty: Master</span>
              <span className="text-amber-400 font-semibold">Escape Override</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: RULES & REGULATIONS */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="cyber-panel p-8 sm:p-10 rounded-3xl border border-slate-800">
          <h2 className="text-2xl font-bold font-heading text-white mb-8 flex items-center gap-3 border-b border-slate-800 pb-4">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            RULES & ESCAPE PROTOCOLS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-heading text-sm mb-1">Two-Player Requirement</h3>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    Teams consist of exactly two players. Both operators must log in using the assigned Team Code.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-heading text-sm mb-1">Fair Play & Tooling</h3>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    No unauthorized automated bots, network interception, or server exploitation. Everything needed is contained in the mission console.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-heading text-sm mb-1">Real-time Leaderboard Tracking</h3>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    Completion times and level completions are tracked authoritatively on the server. The fastest escape wins.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-heading text-sm mb-1">6-Digit Passkey Integrity</h3>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    The final passkey is derived from all 6 unlocked level clues. Enter the passkey into the final terminal to stop the clock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA BANNER */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="cyber-panel cyber-panel-glow p-10 sm:p-14 rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black font-heading text-white mb-4">
              READY TO ENTER THE ARENA?
            </h2>
            <p className="text-sm text-slate-400 font-mono max-w-xl mx-auto mb-8 leading-relaxed">
              Verify your team credentials, connect with your partner node, and prepare for the ultimate technical escape room.
            </p>
            <Link
              to="/player/login"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-xl cyber-btn-primary font-mono font-bold text-sm tracking-wider shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.7)]"
            >
              <span>ENTER CODEXCAPE NOW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 px-6 text-center font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-300">CODE<span className="text-cyan-400">X</span>CAPE</span>
            <span>// HIGH-SECURITY TECHNICAL ESCAPE ROOM</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/player/login" className="hover:text-cyan-400 transition">PLAYER LOGIN</Link>
            <Link to="/public-leaderboard" className="hover:text-cyan-400 transition">LIVE LEADERBOARD</Link>
            <Link to="/admin/events" className="hover:text-cyan-400 transition">ORGANIZER HUB</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

