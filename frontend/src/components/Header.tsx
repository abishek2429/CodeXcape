import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Menu, X, ShieldAlert } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = location.pathname;
  const isHomeRoute = pathname === '/';
  const isLoginRoute =
    pathname === '/player/login' ||
    pathname === '/admin/login' ||
    pathname === '/login';

  // Rule: Home page: no header. Login page: no header.
  if (isHomeRoute || isLoginRoute) {
    return null;
  }

  const isAdminRoute = pathname.startsWith('/admin');
  const isPlayerRoute = pathname.startsWith('/player');
  const isLeaderboardRoute = pathname === '/public-leaderboard';

  // Admin Header Variant (on admin dashboard and management pages)
  if (isAdminRoute) {
    return (
      <header className="header admin-header">
        <div className="header-container">
          <Link to="/" className="brand-logo-wrapper">
            <div className="brand-icon admin-icon">
              <ShieldAlert size={20} color="var(--accent-crimson)" />
            </div>
            <div>
              <div className="brand-text">
                <span>CODE</span>
                <span className="brand-text-accent">X</span>
                <span>CAPE</span>
              </div>
              <p className="brand-subtitle">
                <span className="indicator-dot indicator-connected"></span>
                MISSION CONTROL
              </p>
            </div>
          </Link>

          <nav className="desktop-nav">
            <Link to="/" className="nav-link">
              <span>[ HOME ]</span>
            </Link>
            <Link to="/player/lobby" className="nav-link">
              <Terminal size={14} />
              <span>[ PLAYER PORTAL ]</span>
            </Link>
            <Link to="/public-leaderboard" className="nav-link">
              <Trophy size={14} />
              <span>[ LEADERBOARD ]</span>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Player / Public Pages Header Variant
  // Shows ONLY: HOME, PLAYER PORTAL, LEADERBOARD
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

        {/* Desktop Navigation: Shows strictly HOME, PLAYER PORTAL, LEADERBOARD */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <Link to="/" className={`nav-link ${isHomeRoute ? 'active-crimson' : ''}`}>
            <span>[ HOME ]</span>
          </Link>
          <Link to="/player/lobby" className={`nav-link ${isPlayerRoute ? 'active-crimson' : ''}`}>
            <Terminal size={14} />
            <span>[ PLAYER PORTAL ]</span>
          </Link>
          <Link to="/public-leaderboard" className={`nav-link ${isLeaderboardRoute ? 'active-crimson' : ''}`}>
            <Trophy size={14} />
            <span>[ LEADERBOARD ]</span>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in cyber-panel">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isHomeRoute ? 'active-crimson' : ''}`}>
            HOME
          </Link>
          <Link to="/player/lobby" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isPlayerRoute ? 'active-crimson' : ''}`}>
            <Terminal size={16} /> PLAYER PORTAL
          </Link>
          <Link to="/public-leaderboard" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-link ${isLeaderboardRoute ? 'active-crimson' : ''}`}>
            <Trophy size={16} /> LEADERBOARD
          </Link>
        </div>
      )}
    </header>
  );
};
