import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPlayerRoute = location.pathname.startsWith('/player');
  const isLeaderboardRoute = location.pathname === '/public-leaderboard';
  const isHomeRoute = location.pathname === '/';

  return (
    <header className="border-b border-cyber-border/80 bg-cyber-bg/85 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo with Glowing 'X' */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300">
            <span className="font-heading font-black text-xl text-cyan-300 tracking-wider">X</span>
            <div className="absolute inset-0 rounded-xl border border-cyan-400/20 animate-pulse-glow pointer-events-none"></div>
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-extrabold text-xl tracking-wider text-white">CODE</span>
              <span className="font-heading font-black text-xl tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">X</span>
              <span className="font-heading font-extrabold text-xl tracking-wider text-slate-200">CAPE</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              SECURE ESCAPE PROTOCOL
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 font-mono text-xs">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              isHomeRoute
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <span>HOME</span>
          </Link>

          <Link
            to="/player/login"
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              isPlayerRoute
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>PLAYER PORTAL</span>
          </Link>

          <Link
            to="/public-leaderboard"
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              isLeaderboardRoute
                ? 'bg-purple-500/15 border border-purple-500/40 text-purple-300 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>LEADERBOARD</span>
          </Link>

        </div>

        {/* Server Telemetry Badge & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/90 text-[11px] text-slate-300 font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>
            <span className="text-slate-400">NETWORK:</span>
            <span className="text-emerald-400 font-semibold tracking-wider">ONLINE</span>
          </div>

          <Link
            to="/player/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg cyber-btn-primary font-mono text-xs font-bold tracking-wider"
          >
            <span>ENTER SESSION</span>
            <Terminal className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-cyber-dark/95 backdrop-blur-xl px-4 py-4 space-y-2 font-mono text-xs animate-fade-in">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-lg ${isHomeRoute ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'}`}
          >
            HOME
          </Link>
          <Link
            to="/player/login"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${isPlayerRoute ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'}`}
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            PLAYER PORTAL
          </Link>
          <Link
            to="/public-leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${isLeaderboardRoute ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-300'}`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            LEADERBOARD
          </Link>
        </div>
      )}
    </header>
  );
};

