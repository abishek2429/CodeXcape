import React, { useState, useEffect } from 'react';
import {
  Shield,
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  Search,
  KeyRound,
  FileText,
  Activity,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchTeamsProgress,
  startEvent,
  pauseEvent,
  resumeEvent,
  endEvent,
  updateEventPasskey,
  resetTeam,
  fetchAuditLogs,
  AdminDashboardStats,
  AdminTeamProgress,
  AdminAuditLog,
} from '../../services/adminService';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'results' | 'teams' | 'controls' | 'audit'>('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [teams, setTeams] = useState<AdminTeamProgress[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
  const [newPasskey, setNewPasskey] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const eventId = 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await fetchDashboardStats(eventId);
      setStats(statsData);

      const teamsData = await fetchTeamsProgress(eventId, searchTerm, levelFilter);
      setTeams(teamsData);

      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [searchTerm, levelFilter]);

  const handleStart = async () => {
    await startEvent(eventId);
    setActionMsg('Event Started (RUNNING)');
    loadData();
  };

  const handlePause = async () => {
    await pauseEvent(eventId);
    setActionMsg('Event Paused');
    loadData();
  };

  const handleResume = async () => {
    await resumeEvent(eventId);
    setActionMsg('Event Resumed');
    loadData();
  };

  const handleEnd = async () => {
    if (window.confirm('Are you sure you want to end the event? This will stop all active teams.')) {
      await endEvent(eventId);
      setActionMsg('Event Ended (COMPLETED)');
      loadData();
    }
  };

  const handlePasskeyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPasskey.trim())) {
      alert('Passkey must be exactly 6 numeric digits.');
      return;
    }
    if (window.confirm(`Are you sure you want to change the final passkey to ${newPasskey.trim()}?`)) {
      await updateEventPasskey(eventId, newPasskey.trim());
      setActionMsg('Final passkey updated successfully.');
      setNewPasskey('');
      loadData();
    }
  };

  const handleTeamReset = async (teamId: number, teamName: string) => {
    if (window.confirm(`RESET WARNING: Are you sure you want to reset all progress for ${teamName}? This will reset their level back to Level 1.`)) {
      await resetTeam(teamId);
      setActionMsg(`Reset progress for ${teamName}.`);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white uppercase flex items-center gap-2 font-mono">
              CODEXCAPE <span className="text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">ORGANIZER CONTROL PANEL</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Server-Authoritative Live Event Administration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={loadData} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition">
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </a>
        </div>
      </header>

      {/* Action Message Banner */}
      {actionMsg && (
        <div className="bg-cyan-950/80 border-b border-cyan-500/40 px-6 py-2.5 font-mono text-xs text-cyan-200 flex items-center justify-between">
          <span>⚡ {actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-cyan-400 hover:text-cyan-200">Dismiss</button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <nav className="bg-slate-900/50 border-b border-slate-800 px-6 py-2 flex gap-4 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          DASHBOARD METRICS
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'results' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          RESULTS & LEADERBOARD
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'teams' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          TEAM MONITORING ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'controls' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          EVENT CONTROLS & PASSKEY
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'audit' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          AUDIT LOGS ({auditLogs.length})
        </button>
        <a
          href="/public-leaderboard"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/30 transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span>🏆 Public Leaderboard Screen</span>
        </a>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto font-mono">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-widest">EVENT STATUS</p>
                <p className="text-xl font-extrabold text-cyan-400 mt-1 uppercase">{stats.eventStatus}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-widest">TOTAL TEAMS</p>
                <p className="text-xl font-extrabold text-white mt-1">{stats.totalTeams}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-widest">ACTIVE TEAMS</p>
                <p className="text-xl font-extrabold text-amber-400 mt-1">{stats.activeTeams}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 uppercase tracking-widest">COMPLETED TEAMS</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.completedTeams}</p>
              </div>
            </div>

            {/* Level Distribution Progress */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                LIVE TEAMS PER LEVEL DISTRIBUTION
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <div key={lvl} className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-center">
                    <p className="text-xs text-slate-400">LEVEL {lvl}</p>
                    <p className="text-2xl font-extrabold text-cyan-300 mt-1">
                      {stats.levelDistribution[lvl] || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">teams</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Export Buttons Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">EVENT RESULTS & CSV EXPORTS</h3>
                <p className="text-xs text-slate-400 mt-0.5">Download official server-authoritative completion results</p>
              </div>

              <div className="flex gap-3">
                <a
                  href={`/api/admin/events/${eventId}/export/results`}
                  download
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
                >
                  <span>Export Results CSV</span>
                </a>

                <a
                  href={`/api/admin/events/${eventId}/export/progress`}
                  download
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
                >
                  <span>Export Operational Progress CSV</span>
                </a>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Team</th>
                    <th className="p-4">Player 1</th>
                    <th className="p-4">Player 2</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Completed At</th>
                    <th className="p-4 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No team results available.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t, idx) => (
                      <tr key={t.teamId} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-bold text-amber-400 font-mono">
                          {t.gameState === 'COMPLETED' ? `#${idx + 1}` : '-'}
                        </td>
                        <td className="p-4 font-bold text-white">
                          <div>{t.teamName}</div>
                          <div className="text-[10px] text-cyan-400 font-mono">{t.teamCode}</div>
                        </td>
                        <td className="p-4 text-slate-300">{t.player1Name}</td>
                        <td className="p-4 text-slate-300">{t.player2Name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.gameState === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            {t.gameState}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {t.completedAt ? new Date(t.completedAt).toLocaleString() : '-'}
                        </td>
                        <td className="p-4 text-right font-bold text-cyan-300">
                          {t.gameState === 'COMPLETED' ? 'Completed' : `Level ${t.currentLevel}`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search team or player..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLevelFilter(undefined)}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${levelFilter === undefined ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  ALL LEVELS
                </button>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded text-xs font-bold ${levelFilter === lvl ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">Team</th>
                    <th className="p-4">Level</th>
                    <th className="p-4">Player 1 Status</th>
                    <th className="p-4">Player 2 Status</th>
                    <th className="p-4">Hints</th>
                    <th className="p-4">State</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No teams match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t.teamId} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-bold text-white">
                          <div>{t.teamName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">{t.teamCode}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold">
                            Level {t.currentLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 ${t.player1Completed ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                            {t.player1Completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {t.player1Name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 ${t.player2Completed ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                            {t.player2Completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {t.player2Name}
                          </span>
                        </td>
                        <td className="p-4 text-amber-400 font-bold">{t.hintsUnlocked} / 6</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.gameState === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            {t.gameState}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleTeamReset(t.teamId, t.teamName)}
                            className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-[11px] font-bold transition flex items-center gap-1.5 ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Team</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event State Lifecycle Controls */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Play className="w-5 h-5 text-cyan-400" />
                EVENT LIFECYCLE CONTROL
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleStart}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START EVENT (RUNNING)</span>
                </button>

                <button
                  onClick={handlePause}
                  className="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE EVENT (FREEZE GAMEPLAY)</span>
                </button>

                <button
                  onClick={handleResume}
                  className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME EVENT</span>
                </button>

                <button
                  onClick={handleEnd}
                  className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>END EVENT (COMPLETED)</span>
                </button>
              </div>
            </div>

            {/* Passkey Configuration */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                CONFIGURE FINAL PASSKEY
              </h3>

              <form onSubmit={handlePasskeyChange} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Update the secret 6-digit numeric passkey for the final terminal override. The passkey is stored securely as a BCrypt hash and is never sent to clients.
                </p>

                <input
                  type="password"
                  maxLength={6}
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit numeric passkey"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-center text-lg font-mono tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  disabled={newPasskey.length !== 6}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 font-bold text-slate-950 uppercase text-xs transition"
                >
                  Update Passkey Hash
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                ADMINISTRATIVE AUDIT LOG
              </h3>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No administrative audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-cyan-300">{log.adminUsername}</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold">{log.role}</span></td>
                      <td className="p-4 text-emerald-400 font-bold">{log.action}</td>
                      <td className="p-4 text-slate-300">{log.target || '-'}</td>
                    </tr>
                  ))
                ) }
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
