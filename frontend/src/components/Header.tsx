import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Menu, X, ShieldAlert, Cpu } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPlayerRoute = location.pathname.startsWith('/player');
  const isLeaderboardRoute = location.pathname === '/public-leaderboard';
  const isHomeRoute = location.pathname === '/';

  // Admin Header Variant
  if (isAdminRoute) {
    return (
      <header className="header admin-header">
        <div className="header-container">
          <div className="brand-logo-wrapper">
            <div className="brand-icon admin-icon">
              <ShieldAlert size={20} className="text-red-500" />
            </div>
            <div>
              <div className="brand-text">
                <span>CODE</span><span className="text-red-500">X</span><span>CAPE</span>
              </div>
              <p className="brand-subtitle text-red-500">
                <span className="indicator-dot indicator-active"></span>
                MISSION CONTROL
              </p>
            </div>
          </div>
          <div className="admin-telemetry">
            <div className="telemetry-badge">
              <Cpu size={14} className="text-red-500" />
              <span>SYSTEM: AUTHORIZED</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Player / Public Header Variant
  return (
    <header className="header cyber-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="header-container">
        
        {/* Brand Logo */}
        <Link to="/" className="brand-logo-wrapper">
          <div className="brand-icon">
            <span className="brand-x">X</span>
            <div className="brand-icon-glow animate-pulse-glow"></div>
          </div>
          <div>
            <div className="brand-text">
              <span>CODE</span>
              <span className="brand-text-accent">X</span>
              <span>CAPE</span>
            </div>
            <p className="brand-subtitle">
              <span className="indicator-dot indicator-connected"></span>
              SECURE ESCAPE PROTOCOL
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <Link to="/" className={`nav-link ${isHomeRoute ? 'active-cyan' : ''}`}>
            <span>[ HOME ]</span>
          </Link>
          <Link to="/player/login" className={`nav-link ${isPlayerRoute ? 'active-cyan' : ''}`}>
            <Terminal size={14} />
            <span>[ PLAYER PORTAL ]</span>
          </Link>
          <Link to="/public-leaderboard" className={`nav-link ${isLeaderboardRoute ? 'active-purple' : ''}`}>
            <Trophy size={14} />
            <span>[ LEADERBOARD ]</span>
          </Link>
        </div>

        {/* Telemetry Badge & Actions */}
        <div className="header-actions">
          <div className="telemetry-badge">
            <span className="indicator-dot indicator-active"></span>
            <span className="text-muted">NETWORK:</span>
            <span className="terminal-text" style={{ fontSize: '11px' }}>ONLINE</span>
          </div>

          <Link to="/player/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }}>
              <span style={{ marginRight: '8px' }}>ENTER SESSION</span>
              <Terminal size={12} />
            </button>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in cyber-panel">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isHomeRoute ? 'active-cyan' : ''}`}>
            HOME
          </Link>
          <Link to="/player/login" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isPlayerRoute ? 'active-cyan' : ''}`}>
            <Terminal size={16} /> PLAYER PORTAL
          </Link>
          <Link to="/public-leaderboard" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isLeaderboardRoute ? 'active-purple' : ''}`}>
            <Trophy size={16} /> LEADERBOARD
          </Link>
        </div>
      )}
    </header>
  );
};
