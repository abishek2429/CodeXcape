import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Menu, X } from 'lucide-react';
import './Header.css';
import { Button } from './ui/Button';
import { StatusDot } from './ui/StatusDot';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPlayerRoute = location.pathname.startsWith('/player');
  const isLeaderboardRoute = location.pathname === '/public-leaderboard';
  const isHomeRoute = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-container">
        
        {/* Brand Logo with Glowing 'X' */}
        <Link to="/" className="brand-logo-wrapper">
          <div className="brand-icon">
            <span className="brand-x">X</span>
            <div className="absolute inset-0 rounded-xl border border-cyan-400/20 animate-pulse-glow pointer-events-none"></div>
          </div>
          <div>
            <div className="brand-text">
              <span>CODE</span>
              <span className="brand-text-accent">X</span>
              <span>CAPE</span>
            </div>
            <p className="brand-subtitle">
              <StatusDot status="connected" />
              SECURE ESCAPE PROTOCOL
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-nav">
          <Link
            to="/"
            className={`nav-link ${isHomeRoute ? 'active-cyan' : ''}`}
          >
            <span>HOME</span>
          </Link>

          <Link
            to="/player/login"
            className={`nav-link ${isPlayerRoute ? 'active-cyan' : ''}`}
          >
            <Terminal size={14} color="var(--accent-cyan)" />
            <span>PLAYER PORTAL</span>
          </Link>

          <Link
            to="/public-leaderboard"
            className={`nav-link ${isLeaderboardRoute ? 'active-purple' : ''}`}
          >
            <Trophy size={14} color="#fbbf24" />
            <span>LEADERBOARD</span>
          </Link>
        </div>

        {/* Server Telemetry Badge & Mobile Toggle */}
        <div className="header-actions">
          <div className="telemetry-badge">
            <StatusDot status="active" />
            <span className="text-secondary">NETWORK:</span>
            <span className="telemetry-online">ONLINE</span>
          </div>

          <Link to="/player/login" style={{ textDecoration: 'none' }} className="header-btn">
            <Button variant="primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
              <span style={{ marginRight: '8px' }}>ENTER SESSION</span>
              <Terminal size={14} />
            </Button>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isHomeRoute ? 'active-cyan' : ''}`}
          >
            HOME
          </Link>
          <Link
            to="/player/login"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isPlayerRoute ? 'active-cyan' : ''}`}
          >
            <Terminal size={16} color="var(--accent-cyan)" />
            PLAYER PORTAL
          </Link>
          <Link
            to="/public-leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isLeaderboardRoute ? 'active-purple' : ''}`}
          >
            <Trophy size={16} color="#fbbf24" />
            LEADERBOARD
          </Link>
        </div>
      )}
    </header>
  );
};
