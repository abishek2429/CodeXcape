import React, { useState, useEffect } from 'react';
import {
  Shield,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Search,
  KeyRound,
  FileText,
  Activity,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  Clock,
  UserX,
  AlertOctagon,
  Power,
  Users,
  BookOpen,
  Eye,
  FileCheck,
  Edit3,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchTeamsProgress,
  startEvent,
  pauseEvent,
  resumeEvent,
  endEvent,
  emergencyStopEvent,
  pauseTeam,
  resumeTeam,
  revokeSession,
  updateEventPasskey,
  resetTeam,
  fetchAuditLogs,
  fetchEventContent,
  fetchEventValidation,
  saveQuestion,
  saveHint,
  testAnswer,
  fetchPlayerSafePreview,
  AdminDashboardStats,
  AdminTeamProgress,
  AdminAuditLog,
} from '../../services/adminService';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'teams' | 'controls' | 'results' | 'audit'>('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [teams, setTeams] = useState<AdminTeamProgress[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newPasskey, setNewPasskey] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Phase 16 State
  const [contentData, setContentData] = useState<any>(null);
  const [readinessData, setReadinessData] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [editingP1Q, setEditingP1Q] = useState('');
  const [editingP1A, setEditingP1A] = useState('');
  const [editingP2Q, setEditingP2Q] = useState('');
  const [editingP2A, setEditingP2A] = useState('');
  const [editingHint, setEditingHint] = useState('');
  const [testCandidateAnswer, setTestCandidateAnswer] = useState('');
  const [testPlayerRole, setTestPlayerRole] = useState<'PLAYER_1' | 'PLAYER_2'>('PLAYER_1');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [safePreview, setSafePreview] = useState<any>(null);
  const [previewPlayerNum, setPreviewPlayerNum] = useState<number | null>(null);

  const eventId = 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await fetchDashboardStats(eventId);
      setStats(statsData);

      const teamsData = await fetchTeamsProgress(eventId, searchTerm, levelFilter, statusFilter);
      setTeams(teamsData);

      const logs = await fetchAuditLogs();
      setAuditLogs(logs);

      const content = await fetchEventContent(eventId);
      setContentData(content);

      const validation = await fetchEventValidation(eventId);
      setReadinessData(validation);
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
  }, [searchTerm, levelFilter, statusFilter]);

  useEffect(() => {
    if (contentData && contentData.levels) {
      const lvl = contentData.levels.find((l: any) => l.levelNumber === selectedLevel);
      if (lvl) {
        setEditingP1Q(lvl.player1Question || '');
        setEditingP1A(lvl.player1Answer || '');
        setEditingP2Q(lvl.player2Question || '');
        setEditingP2A(lvl.player2Answer || '');
        setEditingHint(lvl.hint || '');
      }
    }
  }, [selectedLevel, contentData]);

  const handleStart = async () => {
    if (readinessData && !readinessData.overallReady) {
      alert(`CANNOT START EVENT: Mandatory content validation failed.\nErrors:\n` + readinessData.validationErrors.join('\n'));
      return;
    }
    if (window.confirm('CONFIRM ACTION: Are you sure you want to START the event? Teams will be allowed to begin gameplay.')) {
      try {
        await startEvent(eventId);
        setActionMsg('Event Started (RUNNING)');
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handlePause = async () => {
    if (window.confirm('CONFIRM ACTION: Are you sure you want to PAUSE the event? New answer submissions will be frozen.')) {
      await pauseEvent(eventId);
      setActionMsg('Event Paused');
      loadData();
    }
  };

  const handleResume = async () => {
    if (window.confirm('CONFIRM ACTION: Are you sure you want to RESUME the event?')) {
      await resumeEvent(eventId);
      setActionMsg('Event Resumed');
      loadData();
    }
  };

  const handleEnd = async () => {
    if (window.confirm('IRREVERSIBLE ACTION: Are you sure you want to END the event? Gameplay submissions will be permanently closed.')) {
      await endEvent(eventId);
      setActionMsg('Event Ended (COMPLETED)');
      loadData();
    }
  };

  const handleEmergencyStop = async () => {
    await emergencyStopEvent(eventId, emergencyReason);
    setActionMsg(`🚨 EMERGENCY STOP EXECUTED: ${emergencyReason || 'Organizer Emergency'}`);
    setShowEmergencyModal(false);
    setEmergencyReason('');
    loadData();
  };

  const handleSaveLevelContent = async () => {
    try {
      await saveQuestion(eventId, selectedLevel, {
        playerNumber: 'PLAYER_1',
        questionContent: editingP1Q,
        expectedAnswer: editingP1A,
      });
      await saveQuestion(eventId, selectedLevel, {
        playerNumber: 'PLAYER_2',
        questionContent: editingP2Q,
        expectedAnswer: editingP2A,
      });
      await saveHint(eventId, selectedLevel, editingHint);

      setActionMsg(`Saved configuration for Level ${selectedLevel}`);
      loadData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleTestAnswer = async () => {
    try {
      const res = await testAnswer(eventId, selectedLevel, testPlayerRole, testCandidateAnswer);
      setTestResult(res.result);
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    }
  };

  const handleOpenPlayerPreview = async (playerNum: number) => {
    try {
      const prev = await fetchPlayerSafePreview(eventId, selectedLevel, playerNum);
      setSafePreview(prev);
      setPreviewPlayerNum(playerNum);
    } catch (err: any) {
      alert(`Preview failed: ${err.message}`);
    }
  };

  const handlePauseTeamAction = async (teamId: number, teamName: string) => {
    if (window.confirm(`Are you sure you want to PAUSE gameplay for ${teamName}?`)) {
      await pauseTeam(teamId);
      setActionMsg(`Paused team ${teamName}`);
      loadData();
    }
  };

  const handleResumeTeamAction = async (teamId: number, teamName: string) => {
    await resumeTeam(teamId);
    setActionMsg(`Resumed team ${teamName}`);
    loadData();
  };

  const handleRevokeSessionAction = async (sessionId: number | undefined, playerName: string) => {
    if (!sessionId) {
      alert('No active session found to revoke.');
      return;
    }
    if (window.confirm(`Revoke active session for ${playerName}? The player will be forced to log in again.`)) {
      await revokeSession(sessionId);
      setActionMsg(`Revoked active session for ${playerName}`);
      loadData();
    }
  };

  const handlePasskeyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPasskey.trim())) {
      alert('Passkey must be exactly 6 numeric digits.');
      return;
    }
    if (window.confirm(`Are you sure you want to update the secret 6-digit final passkey?`)) {
      await updateEventPasskey(eventId, newPasskey.trim());
      setActionMsg('Final passkey updated successfully.');
      setNewPasskey('');
      loadData();
    }
  };

  const handleTeamReset = async (teamId: number, teamName: string) => {
    if (window.confirm(`RESET WARNING: Are you sure you want to reset progress for ${teamName}? Their state will return to Level 1.`)) {
      await resetTeam(teamId);
      setActionMsg(`Reset progress for ${teamName}.`);
      loadData();
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Not Started';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              CODEXCAPE <span className="text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">ORGANIZER CONTROL CENTER</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Server-Authoritative Content Management & Live Event Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 transition animate-pulse"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>EMERGENCY STOP</span>
          </button>
          <button onClick={loadData} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition">
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </a>
        </div>
      </header>

      {/* Action Banner */}
      {actionMsg && (
        <div className="bg-cyan-950/90 border-b border-cyan-500/40 px-6 py-2.5 font-mono text-xs text-cyan-200 flex items-center justify-between">
          <span>⚡ {actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-cyan-400 hover:text-cyan-200">Dismiss</button>
        </div>
      )}

      {/* Emergency Stop Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500/80 rounded-xl p-6 max-w-md w-full font-mono space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertOctagon className="w-7 h-7" />
              <h2 className="text-lg font-extrabold uppercase">EMERGENCY STOP CONFIRMATION</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will immediately block all answer, hint, and final passkey submissions across the server for all teams.
            </p>
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Reason for Emergency Stop:</label>
              <input
                type="text"
                placeholder="e.g. Server connectivity drop / Emergency pause"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={handleEmergencyStop}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold"
              >
                EXECUTE EMERGENCY STOP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Player Preview Modal */}
      {previewPlayerNum && safePreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/60 rounded-xl p-6 max-w-lg w-full font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-cyan-400 uppercase flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                SAFE PLAYER {previewPlayerNum} PREVIEW — LEVEL {safePreview.levelNumber}
              </h2>
              <button onClick={() => setPreviewPlayerNum(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-400 font-bold uppercase">Question Content (Player {previewPlayerNum}):</p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {safePreview.questionContent}
              </div>
              <p className="text-slate-400 font-bold uppercase mt-3">Progressive Hint:</p>
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded text-amber-200 leading-relaxed font-mono whitespace-pre-wrap">
                {safePreview.hintContent}
              </div>
              <p className="text-[10px] text-emerald-400 font-bold italic mt-2">
                ✓ Safe Player View Verified: Expected Answer, Partner Question, and Passkey are strictly hidden.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewPlayerNum(null)}
                className="px-4 py-2 rounded bg-cyan-600 text-slate-950 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <nav className="bg-slate-900/50 border-b border-slate-800 px-6 py-2 flex gap-3 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          CONTROL CENTER METRICS
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'content' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>CONTENT & READINESS</span>
          {readinessData && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${readinessData.overallReady ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'}`}>
              {readinessData.overallReady ? 'READY' : 'NOT READY'}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'teams' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          TEAM & PLAYER CONTROL ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'controls' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          EVENT CONTROLS & PASSKEY
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${activeTab === 'results' ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          RESULTS & LEADERBOARD
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
          <span>🏆 Public Screen</span>
        </a>
      </nav>

      {/* Main Dashboard Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto font-mono space-y-6">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Event Metrics Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  EVENT STATUS
                </p>
                <p className={`text-lg font-extrabold mt-1 uppercase ${
                  stats.eventStatus === 'RUNNING' ? 'text-emerald-400' : stats.eventStatus === 'PAUSED' ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {stats.eventStatus}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  EVENT DURATION
                </p>
                <p className="text-lg font-extrabold text-cyan-300 mt-1">
                  {formatDuration(stats.eventDurationSeconds)}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  TOTAL TEAMS
                </p>
                <p className="text-lg font-extrabold text-white mt-1">{stats.totalTeams}</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  COMPLETED TEAMS
                </p>
                <p className="text-lg font-extrabold text-emerald-400 mt-1">{stats.completedTeams}</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-red-400" />
                  DISCONNECTED PLAYERS
                </p>
                <p className={`text-lg font-extrabold mt-1 ${stats.disconnectedPlayers > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {stats.disconnectedPlayers}
                </p>
              </div>
            </div>

            {/* Live Connection Matrix Overview */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                LIVE TWO-PLAYER CONNECTION MONITORING MATRIX
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">BOTH PLAYERS ONLINE</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.bothPlayersOnlineTeams}</p>
                  </div>
                  <Wifi className="w-7 h-7 text-emerald-500/40" />
                </div>
                <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">ONE PLAYER OFFLINE</p>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.onePlayerOfflineTeams}</p>
                  </div>
                  <WifiOff className="w-7 h-7 text-amber-500/40" />
                </div>
                <div className="bg-slate-950 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">BOTH PLAYERS OFFLINE</p>
                    <p className="text-2xl font-extrabold text-red-400 mt-1">{stats.bothPlayersOfflineTeams}</p>
                  </div>
                  <UserX className="w-7 h-7 text-red-500/40" />
                </div>
              </div>
            </div>

            {/* Level Distribution Bar */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                LIVE TEAMS PER LEVEL DISTRIBUTION
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <div key={lvl} className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-center">
                    <p className="text-xs text-slate-400 font-bold">LEVEL {lvl}</p>
                    <p className="text-2xl font-extrabold text-cyan-300 mt-1">
                      {stats.levelDistribution[lvl] || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">teams active</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 16: Content Management & Readiness Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6 font-mono">
            {/* Pre-Event Readiness Overview Box */}
            {readinessData && (
              <div className={`p-6 rounded-xl border ${readinessData.overallReady ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-red-950/30 border-red-500/50'} space-y-4`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white uppercase flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-cyan-400" />
                      PRE-EVENT CONTENT READINESS CHECKLIST
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Automated validation of all 6 levels, 12 questions, answers, hints, and passkey</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider ${
                    readinessData.overallReady ? 'bg-emerald-600 text-slate-950' : 'bg-red-600 text-white animate-pulse'
                  }`}>
                    {readinessData.overallReady ? 'OVERALL: READY TO START' : 'OVERALL: NOT READY'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-bold">
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">LEVELS (6)</p>
                    <p className={readinessData.levelsReady ? 'text-emerald-400' : 'text-red-400'}>{readinessData.levelsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">QUESTIONS (12)</p>
                    <p className={readinessData.questionsReady ? 'text-emerald-400' : 'text-red-400'}>{readinessData.questionsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">ANSWERS (12)</p>
                    <p className={readinessData.answersReady ? 'text-emerald-400' : 'text-red-400'}>{readinessData.answersReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">HINTS (6)</p>
                    <p className={readinessData.hintsReady ? 'text-emerald-400' : 'text-red-400'}>{readinessData.hintsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">PASSKEY (6-DIGIT)</p>
                    <p className={readinessData.passkeyReady ? 'text-emerald-400' : 'text-red-400'}>{readinessData.passkeyReady ? '✓ READY' : '✗ MISSING'}</p>
                  </div>
                </div>

                {!readinessData.overallReady && readinessData.validationErrors.length > 0 && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 rounded text-xs text-red-200 space-y-1 font-mono">
                    <p className="font-extrabold uppercase">Required Actions Before Starting Event:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {readinessData.validationErrors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Level Selector Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                const summary = readinessData?.levelSummaries?.[lvl];
                const isReady = summary?.levelReady;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
                      selectedLevel === lvl ? 'bg-cyan-600 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>LEVEL {lvl}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isReady ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                      {isReady ? '✓' : '!'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level Content Editor Form */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  CONFIGURE LEVEL {selectedLevel} QUESTIONS & HINT
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenPlayerPreview(1)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>P1 Player View</span>
                  </button>
                  <button
                    onClick={() => handleOpenPlayerPreview(2)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>P2 Player View</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player 1 Question Box */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">PLAYER 1 QUESTION & ANSWER</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Question Content:</label>
                    <textarea
                      rows={4}
                      value={editingP1Q}
                      onChange={(e) => setEditingP1Q(e.target.value)}
                      placeholder="Enter Player 1 challenge question..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Expected Answer (Secret):</label>
                    <input
                      type="text"
                      value={editingP1A}
                      onChange={(e) => setEditingP1A(e.target.value)}
                      placeholder="Enter expected answer string..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Player 2 Question Box */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">PLAYER 2 QUESTION & ANSWER</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Question Content:</label>
                    <textarea
                      rows={4}
                      value={editingP2Q}
                      onChange={(e) => setEditingP2Q(e.target.value)}
                      placeholder="Enter Player 2 challenge question..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Expected Answer (Secret):</label>
                    <input
                      type="text"
                      value={editingP2A}
                      onChange={(e) => setEditingP2A(e.target.value)}
                      placeholder="Enter expected answer string..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Progressive Hint Box */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">LEVEL {selectedLevel} PROGRESSIVE HINT</h4>
                <textarea
                  rows={2}
                  value={editingHint}
                  onChange={(e) => setEditingHint(e.target.value)}
                  placeholder="Enter progressive hint unlocked upon level completion..."
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Answer Simulator & Save Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                {/* Answer Test Preview Simulator */}
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <select
                    value={testPlayerRole}
                    onChange={(e) => setTestPlayerRole(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-cyan-300"
                  >
                    <option value="PLAYER_1">P1 Test</option>
                    <option value="PLAYER_2">P2 Test</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Candidate Answer..."
                    value={testCandidateAnswer}
                    onChange={(e) => setTestCandidateAnswer(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono w-40"
                  />
                  <button
                    onClick={handleTestAnswer}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
                  >
                    Test Answer
                  </button>
                  {testResult && (
                    <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${testResult === 'CORRECT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-red-950 text-red-300 border border-red-500'}`}>
                      {testResult}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSaveLevelContent}
                  className="px-5 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition w-full sm:w-auto"
                >
                  Save Level {selectedLevel} Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by team name, code, or player name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                <span className="text-xs text-slate-400 font-bold">STATUS:</span>
                {['ALL', 'ONLINE', 'OFFLINE', 'COMPLETED', 'IN_PROGRESS'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded text-xs font-bold ${statusFilter === st ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {st}
                  </button>
                ))}

                <span className="text-xs text-slate-400 font-bold ml-2">LEVEL:</span>
                <button
                  onClick={() => setLevelFilter(undefined)}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${levelFilter === undefined ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  ALL
                </button>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded text-xs font-bold ${levelFilter === lvl ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams & Players Control Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">Team</th>
                    <th className="p-4">Level</th>
                    <th className="p-4">Player 1</th>
                    <th className="p-4">Player 2</th>
                    <th className="p-4">Connection</th>
                    <th className="p-4">Hints</th>
                    <th className="p-4 text-right">Organizer Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No teams match the search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t.teamId} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-bold text-white">
                          <div>{t.teamName}</div>
                          <div className="text-[10px] text-cyan-400">{t.teamCode}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold">
                            Level {t.currentLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${t.player1Connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className={t.player1Completed ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{t.player1Name}</span>
                            {t.player1SessionId && (
                              <button
                                title="Revoke Session"
                                onClick={() => handleRevokeSessionAction(t.player1SessionId, t.player1Name)}
                                className="text-[10px] text-red-400 hover:text-red-300 ml-1 underline"
                              >
                                [Revoke]
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${t.player2Connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className={t.player2Completed ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{t.player2Name}</span>
                            {t.player2SessionId && (
                              <button
                                title="Revoke Session"
                                onClick={() => handleRevokeSessionAction(t.player2SessionId, t.player2Name)}
                                className="text-[10px] text-red-400 hover:text-red-300 ml-1 underline"
                              >
                                [Revoke]
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.connectionStatus === 'BOTH_ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                            t.connectionStatus === 'ONE_OFFLINE' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-red-950 text-red-300 border border-red-500/30'
                          }`}>
                            {t.connectionStatus || 'OFFLINE'}
                          </span>
                        </td>
                        <td className="p-4 text-amber-400 font-bold">{t.hintsUnlocked} / 6</td>
                        <td className="p-4 text-right space-x-2">
                          {t.status === 'PAUSED' ? (
                            <button
                              onClick={() => handleResumeTeamAction(t.teamId, t.teamName)}
                              className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition"
                            >
                              Resume Team
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePauseTeamAction(t.teamId, t.teamName)}
                              className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition"
                            >
                              Pause Team
                            </button>
                          )}
                          <button
                            onClick={() => handleTeamReset(t.teamId, t.teamName)}
                            className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-[11px] font-bold transition inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {/* Organizer Event Controls */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Power className="w-5 h-5 text-cyan-400" />
                EVENT LIFECYCLE CONTROLS
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleStart}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START EVENT (ALLOW GAMEPLAY)</span>
                </button>

                <button
                  onClick={handlePause}
                  className="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE EVENT (FREEZE ALL TEAMS)</span>
                </button>

                <button
                  onClick={handleResume}
                  className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME EVENT</span>
                </button>

                <button
                  onClick={handleEnd}
                  className="w-full py-3 px-4 rounded-lg bg-red-700 hover:bg-red-600 text-white font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>END EVENT (PERMANENTLY CLOSE GAMEPLAY)</span>
                </button>
              </div>
            </div>

            {/* Passkey Management */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                FINAL PASSKEY HASH CONFIGURATION
              </h3>

              <form onSubmit={handlePasskeyChange} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Update the secret 6-digit passkey used for final terminal validation. Passkeys are BCrypt-hashed on the server and are never transmitted to player clients.
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

        {activeTab === 'results' && (
          <div className="space-y-6 font-mono">
            {/* CSV Exports */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">EVENT RESULTS & CSV EXPORTS</h3>
                <p className="text-xs text-slate-400 mt-0.5">Download official server-authoritative leaderboard results</p>
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
                  <span>Export Progress CSV</span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
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
                          <div className="text-[10px] text-cyan-400">{t.teamCode}</div>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl font-mono">
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
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
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
                      <td className="p-4 text-slate-400">{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
