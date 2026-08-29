import React, { useState, useEffect } from 'react';
import { Trophy, Award, Clock, Activity, Flame, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchPublicLeaderboard, PublicLeaderboard } from '../../services/resultsService';
import { webSocketService, WebSocketEventPayload } from '../../services/websocketService';
import { Link } from 'react-router-dom';

export const PublicLeaderboardPage: React.FC = () => {
  const [data, setData] = useState<PublicLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestEventMsg, setLatestEventMsg] = useState<string | null>(null);

  const eventId = 1;

  const loadData = async () => {
    try {
      const res = await fetchPublicLeaderboard(eventId);
      setData(res);
    } catch (err) {
      console.error('Failed to load public leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);

    const teamId = 0; // Public subscription fallback
    webSocketService.connect(teamId);

    const unsubCompleted = webSocketService.subscribe('GAME_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestEventMsg(payload.message || '🎉 A team has escaped CodeXcape!');
      loadData();
    });

    const unsubLevel = webSocketService.subscribe('LEVEL_COMPLETED', () => {
      loadData();
    });

    return () => {
      clearInterval(interval);
      unsubCompleted();
      unsubLevel();
      webSocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 font-mono flex flex-col p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-pulse-glow">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-widest text-white uppercase">
                CODEXCAPE
              </h1>
              <span className="text-[11px] text-cyan-300 font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
                LIVE ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
              REAL-TIME GLOBAL LEADERBOARD & ESCAPE TIMINGS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800/90 px-4 py-2 rounded-xl shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-ping text-emerald-400"></span>
            <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">STOMP LIVE SYNC</span>
          </div>

          <Link
            to="/player/login"
            className="px-4 py-2 rounded-xl cyber-btn-primary font-mono text-xs font-bold tracking-wider flex items-center gap-1.5"
          >
            <span>JOIN ARENA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Live Event Notification Alert */}
      {latestEventMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-slide-up">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{latestEventMsg}</span>
        </div>
      )}

      {/* Main Leaderboard Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Synchronizing live scoreboard telemetry...</span>
        </div>
      ) : !data ? (
        <div className="text-center text-slate-500 py-16 cyber-panel rounded-2xl border border-slate-800">
          Leaderboard telemetry currently unavailable.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          
          {/* Completed Escapes (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-heading text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>CONFIRMED ESCAPES ({data.completedEntries.length})</span>
              </h2>
              <span className="text-[11px] text-slate-500">SORTED BY SERVER DURATION</span>
            </div>

            <div className="space-y-3">
              {data.completedEntries.length === 0 ? (
                <div className="p-10 rounded-2xl cyber-panel border border-slate-800 text-center text-slate-400 text-xs">
                  <Flame className="w-8 h-8 text-amber-500/40 mx-auto mb-2 animate-pulse" />
                  <p className="font-bold uppercase tracking-wider text-slate-300">NO TEAMS HAVE ESCAPED YET</p>
                  <p className="text-slate-500 text-[11px] mt-1">The race to breach all 6 security tiers is currently active.</p>
                </div>
              ) : (
                data.completedEntries.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 shadow-xl ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-amber-950/40 via-cyber-surface to-cyber-bg border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                        : entry.rank === 2
                        ? 'bg-gradient-to-r from-slate-800/40 via-cyber-surface to-cyber-bg border-slate-400/50 shadow-[0_0_20px_rgba(148,163,184,0.1)]'
                        : entry.rank === 3
                        ? 'bg-gradient-to-r from-amber-900/25 via-cyber-surface to-cyber-bg border-amber-700/50 shadow-[0_0_20px_rgba(180,83,9,0.1)]'
                        : 'cyber-panel border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-black font-heading text-lg ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-950 shadow-[0_0_15px_rgba(203,213,225,0.3)]'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.3)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        #{entry.rank}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white font-heading tracking-wide flex items-center gap-2">
                          {entry.teamName}
                          {entry.rank === 1 && (
                            <span className="text-[9px] text-amber-300 bg-amber-950/80 px-2 py-0.2 rounded-full border border-amber-500/40 font-bold uppercase">
                              1ST PLACE
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-emerald-400 font-mono font-semibold uppercase mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ALL 6 TIERS BREACHED</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-base justify-end">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>{entry.formattedDuration}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">ELAPSED TIME</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Teams In Progress (1 Column) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-heading text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>ACTIVE TEAMS ({data.activeEntries.length})</span>
              </h2>
              <span className="text-[11px] text-slate-500">LIVE TELEMETRY</span>
            </div>

            <div className="space-y-2.5">
              {data.activeEntries.length === 0 ? (
                <div className="p-8 rounded-2xl cyber-panel border border-slate-800 text-center text-slate-500 text-xs">
                  No active teams currently in session.
                </div>
              ) : (
                data.activeEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl cyber-panel border border-slate-800/90 flex items-center justify-between hover:border-cyan-500/30 transition-all"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-200 font-heading">{entry.teamName}</p>
                      <p className="text-[10px] text-cyan-400/80 uppercase font-mono mt-0.5">
                        STATUS: {entry.status}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                      TIER 0{entry.currentLevel}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

