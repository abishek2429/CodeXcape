import React, { useEffect, useState, useCallback } from 'react';
import { SystemCard } from '../components/SystemCard';
import { fetchHealth } from '../services/api';
import { SystemStatus } from '../types/health';
import { Cpu, Database, Monitor, RefreshCw, Server, Zap } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    frontend: 'ONLINE',
    backend: 'CHECKING',
    database: 'UNKNOWN',
    details: null,
    latencyMs: 0,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealthStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, latencyMs } = await fetchHealth();
      setStatus({
        frontend: 'ONLINE',
        backend: data.status === 'UP' ? 'ONLINE' : 'OFFLINE',
        database: data.database === 'UP' ? 'ONLINE' : 'OFFLINE',
        details: data,
        lastChecked: new Date().toLocaleTimeString(),
        latencyMs,
        error: null,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Backend unreachable';
      setStatus({
        frontend: 'ONLINE',
        backend: 'OFFLINE',
        database: 'OFFLINE',
        details: null,
        lastChecked: new Date().toLocaleTimeString(),
        latencyMs: 0,
        error: errorMessage,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealthStatus();
    const interval = setInterval(checkHealthStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [checkHealthStatus]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between max-w-7xl mx-auto px-6 py-10">
      <div className="space-y-12">
        
        {/* Main Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Phase 1 — Foundation Ready</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight font-mono">
            Technical Escape Room
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-mono font-medium">
            College Technical Event
          </p>

          <div className="pt-4 flex justify-center">
            <div className="glass-card px-6 py-3 rounded-full border border-emerald-500/30 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-base font-extrabold text-emerald-400 font-mono tracking-wider">
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* System Component Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Frontend Status */}
          <SystemCard
            title="React Frontend"
            subtitle="Vite + TypeScript + Tailwind"
            icon={<Monitor className="w-6 h-6" />}
            status={status.frontend}
            details={
              <div className="space-y-1">
                <p><span className="text-slate-500">Status:</span> Frontend: ONLINE</p>
                <p><span className="text-slate-500">Environment:</span> Production/Dev Ready</p>
                <p><span className="text-slate-500">Client Engine:</span> Web Browser UI</p>
              </div>
            }
          />

          {/* Backend Status */}
          <SystemCard
            title="Spring Boot Backend"
            subtitle="Java 21 + Spring Web"
            icon={<Server className="w-6 h-6" />}
            status={status.backend}
            details={
              <div className="space-y-1">
                <p><span className="text-slate-500">Status:</span> Backend: {status.backend}</p>
                <p><span className="text-slate-500">Latency:</span> {status.latencyMs ? `${status.latencyMs} ms` : 'N/A'}</p>
                <p><span className="text-slate-500">Endpoint:</span> GET /api/health</p>
              </div>
            }
          />

          {/* Database Status */}
          <SystemCard
            title="PostgreSQL Database"
            subtitle="PostgreSQL 16 + Flyway"
            icon={<Database className="w-6 h-6" />}
            status={status.database}
            details={
              <div className="space-y-1">
                <p><span className="text-slate-500">Connection:</span> {status.database}</p>
                <p><span className="text-slate-500">Flyway:</span> Initial Setup V1</p>
                <p><span className="text-slate-500">Persistence:</span> Docker Volume Active</p>
              </div>
            }
          />
        </div>

        {/* Live Diagnostics Toolbar */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white font-mono">System Connectivity Check</p>
              <p className="text-xs text-slate-400 font-mono">
                {status.lastChecked ? `Last pinged at ${status.lastChecked}` : 'Checking backend connectivity...'}
              </p>
            </div>
          </div>

          <button
            onClick={checkHealthStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>PING HEALTH API</span>
          </button>
        </div>

      </div>

      {/* Footer info */}
      <footer className="mt-12 text-center text-xs text-slate-500 font-mono border-t border-slate-900 pt-6">
        <p>Technical Escape Room &bull; Two-Player LAN Cooperative Architecture &bull; Central Server Authoritative</p>
      </footer>
    </div>
  );
};
