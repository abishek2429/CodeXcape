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

    const token = sessionStorage.getItem('codexcape_session');
    let unsubCompleted: (() => void) | null = null;
    let unsubLevel: (() => void) | null = null;

    if (token) {
      const teamId = 0;
      webSocketService.connect(teamId);

      unsubCompleted = webSocketService.subscribe('GAME_COMPLETED', (payload: WebSocketEventPayload) => {
        setLatestEventMsg(payload.message || '⚠️ Escape confirmed: A team has breached all tiers!');
        loadData();
      });

      unsubLevel = webSocketService.subscribe('LEVEL_COMPLETED', () => {
        loadData();
      });
    }

    return () => {
      clearInterval(interval);
      if (unsubCompleted) unsubCompleted();
      if (unsubLevel) unsubLevel();
      if (token) webSocketService.disconnect();
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-void)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', padding: '24px 20px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Background ambient red glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(circle, rgba(225, 6, 19, 0.08) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true" />

      {/* Top Banner Header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-crimson)', paddingBottom: '20px', marginBottom: '28px', gap: '16px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '4px', backgroundColor: 'rgba(214, 168, 75, 0.12)', border: '1.5px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', boxShadow: '0 0 20px rgba(214, 168, 75, 0.2)' }}>
            <Trophy size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-sans)', letterSpacing: '0.12em', color: 'var(--text-cold-white)', margin: 0 }}>
                CODEXCAPE
              </h1>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-crimson-bright)', padding: '2px 8px', borderRadius: '2px', backgroundColor: 'rgba(225, 6, 19, 0.12)', border: '1px solid var(--border-crimson)' }}>
                GLOBAL LEADERBOARD
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              TACTICAL SCOREBOARD & AUTHORITATIVE COMPLETION TELEMETRY
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(8, 8, 10, 0.8)', border: '1px solid var(--border-dim)', padding: '8px 14px', borderRadius: '2px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-success)', boxShadow: '0 0 6px var(--status-success)' }}></span>
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.06em' }}>STOMP SYNC: ACTIVE</span>
          </div>

          <Link
            to="/player/login"
            style={{ textDecoration: 'none' }}
          >
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '11px', letterSpacing: '0.1em' }}>
              <span>JOIN ESCAPE RUN</span>
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </header>

      {/* Live Event Alert Banner */}
      {latestEventMsg && (
        <div style={{ marginBottom: '24px', padding: '14px 18px', borderRadius: '2px', backgroundColor: 'rgba(225, 6, 19, 0.14)', border: '1px solid var(--accent-crimson)', color: '#FFFFFF', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 0 16px rgba(225, 6, 19, 0.3)', position: 'relative', zIndex: 10 }}>
          <Trophy size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <span>{latestEventMsg}</span>
        </div>
      )}

      {/* Main Leaderboard Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: 'var(--text-secondary)', fontSize: '13px', gap: '16px', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent-crimson)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          <span>SYNCHRONIZING TACTICAL SCOREBOARD...</span>
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px 20px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-crimson)', borderRadius: '2px', position: 'relative', zIndex: 10 }}>
          Leaderboard telemetry currently unavailable.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', position: 'relative', zIndex: 10 }}>
          {/* Confirmed Escapes (2 Columns on large screens) */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'var(--font-sans)', color: 'var(--text-cold-white)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Award size={18} color="var(--accent-gold)" />
                <span>CONFIRMED ESCAPES ({data.completedEntries.length})</span>
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ORDERED BY DURATION</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.completedEntries.length === 0 ? (
                <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-dim)', borderRadius: '2px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <Flame size={28} color="rgba(225, 6, 19, 0.5)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>NO TEAMS HAVE BREACHED ALL TIERS YET</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>The escape network is active. First breach claims #1 rank.</p>
                </div>
              ) : (
                data.completedEntries.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  return (
                    <div
                      key={entry.rank}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isFirst
                          ? 'rgba(214, 168, 75, 0.08)'
                          : 'var(--bg-panel-elevated)',
                        border: '1px solid',
                        borderColor: isFirst
                          ? 'var(--accent-gold)'
                          : isSecond || isThird
                          ? 'var(--border-crimson)'
                          : 'var(--border-dim)',
                        boxShadow: isFirst
                          ? '0 0 24px rgba(214, 168, 75, 0.2), inset 0 0 16px rgba(214, 168, 75, 0.05)'
                          : '0 4px 16px rgba(0, 0, 0, 0.6)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Rank Badge */}
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontFamily: 'var(--font-sans)',
                            fontSize: '16px',
                            backgroundColor: isFirst
                              ? 'var(--accent-gold)'
                              : isSecond
                              ? '#999999'
                              : isThird
                              ? 'var(--accent-crimson)'
                              : 'rgba(255, 255, 255, 0.05)',
                            color: isFirst || isSecond ? '#050505' : '#FFFFFF',
                            boxShadow: isFirst ? '0 0 14px rgba(214, 168, 75, 0.5)' : 'none',
                          }}
                        >
                          #{entry.rank}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em', margin: 0 }}>
                              {entry.teamName}
                            </h3>
                            {isFirst && (
                              <span style={{ fontSize: '9px', fontWeight: 800, color: '#050505', backgroundColor: 'var(--accent-gold)', padding: '1px 6px', borderRadius: '2px', letterSpacing: '0.05em' }}>
                                1ST PLACE GOLD
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <p style={{ fontSize: '11px', color: 'var(--status-success)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.04em' }}>
                              <CheckCircle2 size={12} />
                              <span>ALL TIERS BREACHED</span>
                            </p>
                            {Boolean(entry.antiCheatPenalties && entry.antiCheatPenalties > 0) && (
                              <span style={{ fontSize: '10px', color: 'var(--accent-danger)', fontWeight: 700, padding: '1px 6px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '2px', border: '1px solid var(--accent-danger)' }}>
                                ⚠️ -{entry.antiCheatPenalties} PTS PENALTY
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isFirst ? 'var(--accent-gold)' : 'var(--accent-crimson-bright)', fontWeight: 800, fontSize: '15px', justifyContent: 'flex-end' }}>
                          <Clock size={14} />
                          <span>{entry.formattedDuration}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>ELAPSED TIME</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Teams In Progress */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'var(--font-sans)', color: 'var(--accent-crimson-bright)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Activity size={18} color="var(--accent-crimson)" />
                <span>ACTIVE RUNS ({data.activeEntries.length})</span>
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>LIVE NODES</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.activeEntries.length === 0 ? (
                <div style={{ padding: '32px 16px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-dim)', borderRadius: '2px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  No active teams currently in session.
                </div>
              ) : (
                data.activeEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-panel-elevated)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                          {entry.teamName}
                        </p>
                        {Boolean(entry.antiCheatPenalties && entry.antiCheatPenalties > 0) && (
                          <span style={{ fontSize: '9px', color: 'var(--accent-danger)', fontWeight: 700, padding: '1px 5px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '2px', border: '1px solid var(--accent-danger)' }}>
                            ⚠️ -{entry.antiCheatPenalties} PTS
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--accent-crimson-bright)', marginTop: '2px', letterSpacing: '0.06em' }}>
                        STATUS: {entry.status}
                      </p>
                    </div>

                    <span style={{ padding: '3px 8px', borderRadius: '2px', backgroundColor: 'rgba(225, 6, 19, 0.12)', border: '1px solid var(--border-crimson)', color: 'var(--accent-crimson-bright)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
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
