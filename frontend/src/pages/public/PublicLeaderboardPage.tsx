import React, { useState, useEffect } from 'react';
import { Trophy, Award, Clock, Activity, Radio } from 'lucide-react';
import { fetchPublicLeaderboard, PublicLeaderboard } from '../../services/resultsService';
import { webSocketService, WebSocketEventPayload } from '../../services/websocketService';

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
    <div className="min-h-screen bg-[#070a11] text-slate-100 font-mono flex flex-col p-6 sm:p-10">
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 animate-pulse">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-widest text-white uppercase flex items-center gap-3">
              CODEXCAPE <span className="text-cyan-400 text-sm px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40">LIVE LEADERBOARD</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">CodeXcape Live Leaderboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
          <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
          <span className="text-xs text-slate-300 uppercase font-bold">LIVE STOMP REFRESH</span>
        </div>
      </header>

      {/* Live Event Notification Alert */}
      {latestEventMsg && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-sm flex items-center gap-3 shadow-xl animate-bounce">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{latestEventMsg}</span>
        </div>
      )}

      {/* Main Leaderboard Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading live leaderboard standings...
        </div>
      ) : !data ? (
        <div className="text-center text-slate-500 py-12">Leaderboard data unavailable.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* Top Completed Teams (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Award className="w-5 h-5" />
              COMPLETED TEAMS RANKING ({data.completedEntries.length})
            </h2>

            <div className="space-y-3">
              {data.completedEntries.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-xs">
                  No teams have completed all six levels yet. The race is on!
                </div>
              ) : (
                data.completedEntries.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`p-4 rounded-xl border flex items-center justify-between transition shadow-lg ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 shadow-amber-500/10'
                        : entry.rank === 2
                        ? 'bg-gradient-to-r from-slate-800/50 via-slate-900 to-slate-900 border-slate-400/50'
                        : entry.rank === 3
                        ? 'bg-gradient-to-r from-amber-900/20 via-slate-900 to-slate-900 border-amber-700/50'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-lg font-mono ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{entry.rank}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">{entry.teamName}</h3>
                        <p className="text-xs text-emerald-400 font-bold uppercase mt-0.5">COMPLETED ALL 6 LEVELS</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-sm justify-end">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>{entry.formattedDuration}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">Server Time Duration</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Teams In Progress (1 Column) */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" />
              TEAMS IN PROGRESS ({data.activeEntries.length})
            </h2>

            <div className="space-y-2.5">
              {data.activeEntries.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-xs">
                  No active teams in progress.
                </div>
              ) : (
                data.activeEntries.map((entry, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">{entry.teamName}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">{entry.status}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                      LEVEL {entry.currentLevel}
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
