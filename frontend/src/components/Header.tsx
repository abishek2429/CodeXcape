import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Terminal, Calendar, Home } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <header className="border-b border-slate-800 bg-[#0c101a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 transition">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-white font-mono flex items-center gap-2">
              CODE<span className="text-cyan-400">XCAPE</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">CODEXCAPE</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 font-mono text-xs">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              HOME
            </Link>

            <Link
              to="/player/login"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                location.pathname.startsWith('/player')
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              PLAYER PORTAL
            </Link>

            <Link
              to="/admin/events"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                isAdminActive
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              ORGANIZER HUB
            </Link>
          </nav>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>LAN GAME SERVER</span>
          </div>
        </div>
      </div>
    </header>
  );
};
