import React, { useState, useEffect } from 'react';
import './AdminDashboardPage.css';
import {
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
  Trash2,
  Radio,
  Terminal,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchTeamsProgress,
  fetchActiveSessions,
  resetTeamCredentials,
  resetAllSessionsAndCredentials,
  revokeTeamSessions,
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
  AdminActiveSession,
  AdminAuditLog,
} from '../../services/adminService';
import {
  fetchAdminAntiCheatEvents,
  fetchAdminAntiCheatSummaries,
  AntiCheatSummary,
  AntiCheatAuditItem,
} from '../../services/antiCheatService';
import { AdminMissionHeader } from '../../components/admin/AdminMissionHeader';
import { AdminSystemHealth } from '../../components/admin/AdminSystemHealth';
import { webSocketService } from '../../services/websocketService';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'teams' | 'sessions' | 'anticheat' | 'controls' | 'results' | 'audit'>('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [teams, setTeams] = useState<AdminTeamProgress[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdminActiveSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'ACTIVE_ONLY' | 'BOTH_ONLINE' | 'WAITING' | 'OFFLINE'>('ALL');
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [teamToReset, setTeamToReset] = useState<{ id: number; name: string; code: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
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
  const [editingP1Ev, setEditingP1Ev] = useState('');
  const [editingP1Inst, setEditingP1Inst] = useState('');
  const [editingP1A, setEditingP1A] = useState('');
  const [editingP2Ev, setEditingP2Ev] = useState('');
  const [editingP2Inst, setEditingP2Inst] = useState('');
  const [editingP2A, setEditingP2A] = useState('');
  const [editingHint, setEditingHint] = useState('');
  const [testCandidateAnswer, setTestCandidateAnswer] = useState('');
  const [testPlayerRole, setTestPlayerRole] = useState<'PLAYER_1' | 'PLAYER_2'>('PLAYER_1');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [safePreview, setSafePreview] = useState<any>(null);
  const [previewPlayerNum, setPreviewPlayerNum] = useState<number | null>(null);

  // Anti-Cheat Telemetry State
  const [antiCheatEvents, setAntiCheatEvents] = useState<AntiCheatAuditItem[]>([]);
  const [antiCheatSummaries, setAntiCheatSummaries] = useState<AntiCheatSummary[]>([]);
  const [antiCheatFilter, setAntiCheatFilter] = useState<'ALL' | 'PENALIZED_ONLY'>('ALL');
  const [antiCheatSearch, setAntiCheatSearch] = useState('');

  const eventId = 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchDashboardStats(eventId),
        fetchTeamsProgress(eventId, searchTerm, levelFilter, statusFilter),
        fetchAuditLogs(),
        fetchEventContent(eventId),
        fetchEventValidation(eventId),
        fetchActiveSessions(eventId),
        fetchAdminAntiCheatEvents(eventId),
        fetchAdminAntiCheatSummaries(eventId),
      ]);

      const [statsRes, teamsRes, logsRes, contentRes, validationRes, sessionsRes, acEventsRes, acSummRes] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value);
      if (contentRes.status === 'fulfilled') setContentData(contentRes.value);
      if (validationRes.status === 'fulfilled') setReadinessData(validationRes.value);
      if (sessionsRes.status === 'fulfilled') setActiveSessions(sessionsRes.value);
      if (acEventsRes && acEventsRes.status === 'fulfilled') setAntiCheatEvents(acEventsRes.value);
      if (acSummRes && acSummRes.status === 'fulfilled') setAntiCheatSummaries(acSummRes.value);

      const isAuthError = results.some(
        (r) => r.status === 'rejected' && (r.reason?.message?.includes('401') || r.reason?.message?.includes('unauthorized') || r.reason?.message?.includes('UNAUTHORIZED'))
      );
      if (isAuthError) {
        console.warn('Admin session expired or unauthorized');
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);

    let refreshDebounceTimer: any = null;
    const triggerCoalescedAdminRefresh = () => {
      if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer);
      }
      refreshDebounceTimer = setTimeout(() => {
        refreshDebounceTimer = null;
        loadData();
      }, 300);
    };

    webSocketService.connectAdmin();
    const unsubState = webSocketService.subscribe('GAME_STATE_UPDATED', triggerCoalescedAdminRefresh);
    const unsubLevel = webSocketService.subscribe('LEVEL_COMPLETED', triggerCoalescedAdminRefresh);
    const unsubStage = webSocketService.subscribe('STAGE_COMPLETED', triggerCoalescedAdminRefresh);
    const unsubGame = webSocketService.subscribe('GAME_COMPLETED', triggerCoalescedAdminRefresh);
    const unsubRank = webSocketService.subscribe('RANK_CHANGED', triggerCoalescedAdminRefresh);
    const unsubConn = webSocketService.subscribe('PLAYER_CONNECTED', triggerCoalescedAdminRefresh);
    const unsubDisc = webSocketService.subscribe('PLAYER_DISCONNECTED', triggerCoalescedAdminRefresh);
    const unsubAntiCheat = webSocketService.subscribe('ANTI_CHEAT_EVENT', (eventData: any) => {
      if (eventData) {
        setAntiCheatEvents((prev) => [eventData, ...prev.slice(0, 99)]);
        triggerCoalescedAdminRefresh();
      }
    });

    return () => {
      clearInterval(interval);
      if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer);
        refreshDebounceTimer = null;
      }
      unsubState();
      unsubLevel();
      unsubStage();
      unsubGame();
      unsubRank();
      unsubConn();
      unsubDisc();
      unsubAntiCheat();
      webSocketService.disconnect();
    };
  }, [searchTerm, levelFilter, statusFilter]);

  useEffect(() => {
    if (contentData && contentData.levels) {
      const lvl = contentData.levels.find((l: any) => l.levelNumber === selectedLevel);
      if (lvl) {
        setEditingP1Ev(lvl.player1Evidence || '');
        setEditingP1Inst(lvl.player1Instructions || '');
        setEditingP1A(lvl.player1Answer || '');
        setEditingP2Ev(lvl.player2Evidence || '');
        setEditingP2Inst(lvl.player2Instructions || '');
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
        evidence: editingP1Ev,
        instructions: editingP1Inst,
        expectedAnswer: editingP1A,
      });
      await saveQuestion(eventId, selectedLevel, {
        playerNumber: 'PLAYER_2',
        evidence: editingP2Ev,
        instructions: editingP2Inst,
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

  const handleResetTeamCredentialsAction = async (teamId: number, teamName: string, teamCode: string) => {
    setIsResetting(true);
    try {
      await resetTeamCredentials(teamId);
      setActionMsg(`CREDENTIALS PURGED: Active sessions and credentials for ${teamName} (${teamCode}) were completely reset in database.`);
      setTeamToReset(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset team credentials');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRevokeTeamSessionsAction = async (teamId: number, teamName: string) => {
    if (!window.confirm(`Revoke all active sessions for team "${teamName}"? Connected players will be disconnected immediately.`)) return;
    try {
      await revokeTeamSessions(teamId);
      setActionMsg(`All active sessions for team ${teamName} were terminated.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke team sessions');
    }
  };

  const handleResetAllCredentialsAction = async () => {
    setIsResetting(true);
    try {
      await resetAllSessionsAndCredentials();
      setActionMsg('GLOBAL DIRECTIVE EXECUTED: All team sessions and credentials have been purged and reset in the database.');
      setShowResetAllModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset all credentials');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredSessionTeams = teams.filter((t) => {
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase().trim();
      const match =
        t.teamName.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q) ||
        (t.player1Name && t.player1Name.toLowerCase().includes(q)) ||
        (t.player2Name && t.player2Name.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (sessionFilter === 'ACTIVE_ONLY') {
      return Boolean(t.isLoggedIn);
    }
    if (sessionFilter === 'BOTH_ONLINE') {
      return t.connectionStatus === 'BOTH_ONLINE';
    }
    if (sessionFilter === 'WAITING') {
      return Boolean(t.isLoggedIn) && t.connectionStatus !== 'BOTH_ONLINE';
    }
    if (sessionFilter === 'OFFLINE') {
      return !t.isLoggedIn;
    }
    return true;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Not Started';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-layout relative">
      {/* Admin Mission Control Header */}
      <AdminMissionHeader
        eventStatus={stats?.eventStatus || 'STANDBY'}
        totalTeams={stats?.totalTeams || 0}
        completedTeams={stats?.completedTeams || 0}
        activeTeams={(stats?.totalTeams || 0) - (stats?.completedTeams || 0)}
        connectionsCount={`${stats?.bothPlayersOnlineTeams || 0} / ${stats?.totalTeams || 0}`}
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetAllModal(true)}
              className="admin-btn-secondary flex items-center gap-1"
              style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', fontSize: '11px', padding: '6px 12px' }}
              title="Purge all sessions and reset player login credentials across the database"
              id="header-reset-all-credentials-btn"
            >
              <Trash2 size={13} />
              <span>RESET ALL SESSIONS</span>
            </button>

            <button
              onClick={() => setShowEmergencyModal(true)}
              className="admin-btn-danger flex items-center gap-2"
            >
              <AlertOctagon size={14} className="animate-pulse" />
              <span>EMERGENCY STOP</span>
            </button>
            
            <button
              onClick={loadData}
              className="admin-btn-secondary"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <a
              href="/"
              className="admin-btn-secondary flex items-center gap-1"
            >
              <LogOut size={14} />
              <span>Exit Portal</span>
            </a>
          </div>
        }
      />

      {/* Infrastructure System Health Bar */}
      <AdminSystemHealth
        backendOnline={true}
        databaseOnline={true}
        websocketOnline={true}
        eventStatus={stats?.eventStatus || 'STANDBY'}
        activeConnections={stats?.activeWebSocketConnections ?? stats?.totalActiveSessions ?? 0}
      />

      {/* Action Telemetry Alert Banner */}
      {actionMsg && (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className=""></span>
            <span>DIRECTIVE EXECUTED: {actionMsg}</span>
          </span>
          <button onClick={() => setActionMsg(null)} className="text-accent text-primary">✕ DISMISS</button>
        </div>
      )}

      {/* Emergency Stop Modal */}
      {showEmergencyModal && (
        <div className="flex items-center justify-center">
          <div className="admin-panel">
            <div className="text-danger flex items-center">
              <AlertOctagon className="animate-pulse" />
              <h2 className="text-primary">EMERGENCY STOP PROTOCOL</h2>
            </div>
            <p className="">
              CRITICAL: This command will immediately halt all active game operations, freeze submission processing, and lock user terminals across the event.
            </p>
            <div>
              <label className="block">Emergency Justification / Reason:</label>
              <input
                type="text"
                placeholder="e.g. Network infrastructure failure / Manual organizer pause"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="text-primary"
              />
            </div>
            <div className="flex">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="admin-btn-secondary"
              >
                CANCEL
              </button>
              <button
                onClick={handleEmergencyStop}
                className="admin-btn-danger text-primary"
              >
                CONFIRM EMERGENCY STOP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Reset All Sessions & Credentials Modal */}
      {showResetAllModal && (
        <div className="flex items-center justify-center" style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="admin-panel" style={{ maxWidth: '540px', width: '90%', border: '1px solid var(--accent-danger)' }}>
            <div className="text-danger flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <AlertOctagon size={24} className="animate-pulse" />
              <h2 className="text-primary" style={{ margin: 0, fontSize: '16px' }}>PURGE ALL SESSIONS & RESET DATABASE</h2>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              <strong style={{ color: 'var(--accent-danger)' }}>AUTHORITATIVE RESET:</strong> Are you sure you want to completely reset all team sessions and credentials?
            </p>
            <ul style={{ fontSize: '12px', lineHeight: '1.8', color: 'var(--text-primary)', marginBottom: '20px', paddingLeft: '20px' }}>
              <li>Terminates all active player sessions across every team</li>
              <li>Disconnects connected players and redirects them back to login</li>
              <li>Resets all players to <span className="text-accent">INACTIVE</span> &amp; <span className="text-accent">is_ready = false</span></li>
              <li>Resets all team states to <span className="text-accent">NOT_STARTED</span> in the database</li>
              <li>Purges past answer attempts, stage progress, and hint usages</li>
            </ul>
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="admin-btn-secondary"
                disabled={isResetting}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleResetAllCredentialsAction}
                className="admin-btn-danger text-primary"
                disabled={isResetting}
                id="confirm-global-reset-btn"
              >
                {isResetting ? 'PURGING DATABASE...' : 'CONFIRM RESET ALL SESSIONS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Single Team Credentials Modal */}
      {teamToReset && (
        <div className="flex items-center justify-center" style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="admin-panel" style={{ maxWidth: '500px', width: '90%', border: '1px solid var(--accent-danger)' }}>
            <div className="text-danger flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={24} />
              <h2 className="text-primary" style={{ margin: 0, fontSize: '16px' }}>RESET TEAM CREDENTIALS</h2>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Reset login credentials, terminate sessions, and clean state for:
            </p>
            <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-dim)', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{teamToReset.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '4px' }}>CODE: {teamToReset.code}</div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              This will disconnect both operators, terminate active tokens in the database, clear their ready status, and restore the team to the pre-game lobby.
            </p>
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTeamToReset(null)}
                className="admin-btn-secondary"
                disabled={isResetting}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleResetTeamCredentialsAction(teamToReset.id, teamToReset.name, teamToReset.code)}
                className="admin-btn-danger text-primary"
                disabled={isResetting}
                id="confirm-team-reset-btn"
              >
                {isResetting ? 'RESETTING...' : 'RESET CREDENTIALS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Player Preview Modal */}
      {previewPlayerNum && safePreview && (
        <div className="flex items-center justify-center">
          <div className="admin-panel">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2">
                <Eye className="text-accent" />
                SAFE PLAYER {previewPlayerNum} PERSPECTIVE — LEVEL {safePreview.levelNumber}
              </h2>
              <button onClick={() => setPreviewPlayerNum(null)} className="text-secondary text-primary">✕</button>
            </div>
            <div className="">
              <div>
                <p className="text-secondary">Question Display Content (Player {previewPlayerNum}):</p>
                <pre className="bg-gray-800 p-2 rounded text-sm text-gray-300 whitespace-pre-wrap font-mono mb-4">
                  {safePreview.evidence}
                </pre>
                <div className="text-sm text-gray-400 mb-1 font-mono">INSTRUCTIONS:</div>
                <pre className="bg-gray-800 p-2 rounded text-sm text-green-400 whitespace-pre-wrap font-mono mb-4">
                  {safePreview.instructions}
                </pre>
              </div>
              <div>
                <p className="text-secondary">Progressive Clue Shard:</p>
                <div className="">
                  {safePreview.hintContent}
                </div>
              </div>
              <p className="text-success flex items-center">
                <CheckCircle2 className="" />
                <span>Zero Leakage Guarantee: Expected answer, partner question, and secret passkey are isolated.</span>
              </p>
            </div>
            <div className="flex">
              <button
                onClick={() => setPreviewPlayerNum(null)}
                className=""
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <nav className="admin-panel flex gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`admin-dynamic-element ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          TELEMETRY OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`admin-dynamic-element ${activeTab === 'content' ? 'active' : ''}`}
        >
          <BookOpen size={14} />
          <span>CONTENT & READINESS</span>
          {readinessData && (
            <span className={readinessData.overallReady ? 'badge-status-online' : 'badge-status-offline'} style={{ fontSize: '9px', marginLeft: '4px' }}>
              {readinessData.overallReady ? 'READY' : 'INCOMPLETE'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`admin-dynamic-element ${activeTab === 'teams' ? 'active' : ''}`}
        >
          TEAM MONITORING ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`admin-dynamic-element ${activeTab === 'sessions' ? 'active' : ''}`}
          id="admin-active-sessions-tab"
        >
          <Radio size={14} className={stats?.totalActiveSessions && stats.totalActiveSessions > 0 ? 'text-success animate-pulse' : ''} />
          <span>ACTIVE SESSIONS & LOGINS</span>
          {stats?.totalActiveSessions !== undefined && (
            <span
              className={stats.totalActiveSessions > 0 ? 'badge-status-online' : 'badge-status-offline'}
              style={{ fontSize: '10px', marginLeft: '6px', padding: '1px 7px', borderRadius: '10px', fontWeight: 800 }}
            >
              {stats.totalActiveSessions} LIVE
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('anticheat')}
          className={`admin-dynamic-element ${activeTab === 'anticheat' ? 'active' : ''}`}
          id="admin-anticheat-tab"
        >
          <ShieldAlert size={14} className={antiCheatSummaries.some(s => s.totalViolations > 0) ? 'text-danger animate-pulse' : ''} />
          <span>ANTI-CHEAT MONITOR</span>
          {antiCheatSummaries.reduce((sum, s) => sum + s.totalViolations, 0) > 0 && (
            <span
              className="badge-status-offline"
              style={{ fontSize: '10px', marginLeft: '6px', padding: '1px 7px', borderRadius: '10px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }}
            >
              {antiCheatSummaries.reduce((sum, s) => sum + s.totalViolations, 0)} VIOLATIONS
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className={`admin-dynamic-element ${activeTab === 'controls' ? 'active' : ''}`}
        >
          EVENT CONTROLS & PASSKEY
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`admin-dynamic-element ${activeTab === 'results' ? 'active' : ''}`}
        >
          LEADERBOARD & EXPORTS
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`admin-dynamic-element ${activeTab === 'audit' ? 'active' : ''}`}
        >
          SECURITY AUDIT LOGS ({auditLogs.length})
        </button>

        <a
          href="/public-leaderboard"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-secondary"
          style={{ marginLeft: 'auto' }}
        >
          <span>🏆 Public Board</span>
        </a>
      </nav>

      {/* Main Dashboard Area */}
      <main className="flex">
        {activeTab === 'dashboard' && stats && (
          <div className="">
            {/* Event Metrics Overview Bar */}
            <div className="grid gap-4">
              <div className="admin-panel">
                <p className="text-secondary flex items-center gap-2">
                  <Activity className="text-accent" />
                  EVENT STATUS
                </p>
                <p className="admin-dynamic-element">
                  {stats.eventStatus}
                </p>
              </div>

              <div className="admin-panel">
                <p className="text-secondary flex items-center gap-2">
                  <Clock className="text-accent" />
                  EVENT DURATION
                </p>
                <p className="">
                  {formatDuration(stats.eventDurationSeconds)}
                </p>
              </div>

              <div className="admin-panel">
                <p className="text-secondary flex items-center gap-2">
                  <Users className="text-accent" />
                  TOTAL TEAMS
                </p>
                <p className="text-primary">{stats.totalTeams}</p>
              </div>

              <div className="admin-panel">
                <p className="text-secondary flex items-center gap-2">
                  <CheckCircle2 className="text-success" />
                  COMPLETED TEAMS
                </p>
                <p className="text-success">{stats.completedTeams}</p>
              </div>

              <div
                className="admin-panel"
                style={{ cursor: 'pointer', border: '1px solid rgba(14, 165, 233, 0.3)' }}
                onClick={() => setActiveTab('sessions')}
                title="Click to view all logged-in teams and active sessions"
              >
                <p className="text-secondary flex items-center gap-2">
                  <Radio className="text-accent" />
                  LOGGED-IN TEAMS
                </p>
                <p className="text-primary font-bold">
                  {stats.totalLoggedInTeams ?? teams.filter(t => t.isLoggedIn).length} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {stats.totalTeams}</span>
                </p>
                <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>View Session Monitor &rarr;</span>
              </div>

              <div
                className="admin-panel"
                style={{ cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                onClick={() => setActiveTab('sessions')}
                title="Click to view live operator sessions"
              >
                <p className="text-secondary flex items-center gap-2">
                  <Activity className="text-success" />
                  ACTIVE SESSIONS
                </p>
                <p className="text-success font-bold">
                  {stats.totalActiveSessions ?? activeSessions.length} LIVE
                </p>
                <span style={{ fontSize: '10px', color: 'var(--status-success)' }}>Real-time Link Pulse</span>
              </div>

              <div className="admin-panel">
                <p className="text-secondary flex items-center gap-2">
                  <UserX className="text-danger" />
                  DISCONNECTED
                </p>
                <p className="admin-dynamic-element">
                  {stats.disconnectedPlayers}
                </p>
              </div>
            </div>

            {/* Live Connection Matrix Overview */}
            <div className="admin-panel">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2">
                  <Wifi className="text-accent" />
                  TWO-PLAYER NETWORK LINK MATRIX
                </h3>
                <span className="">REAL-TIME AGGREGATE</span>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary">BOTH NODES ONLINE</p>
                    <p className="text-success">{stats.bothPlayersOnlineTeams}</p>
                  </div>
                  <div className="text-success flex items-center justify-center">
                    <Wifi className="" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary">ONE NODE OFFLINE</p>
                    <p className="text-warning">{stats.onePlayerOfflineTeams}</p>
                  </div>
                  <div className="text-warning flex items-center justify-center">
                    <WifiOff className="" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary">BOTH NODES OFFLINE</p>
                    <p className="text-danger">{stats.bothPlayersOfflineTeams}</p>
                  </div>
                  <div className="admin-btn-danger text-danger flex items-center justify-center">
                    <UserX className="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Level Distribution Bar */}
            <div className="admin-panel">
              <h3 className="flex items-center gap-2">
                <Activity className="text-accent" />
                ACTIVE TEAMS LEVEL DISTRIBUTION
              </h3>
              <div className="grid">
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <div key={lvl} className="">
                    <p className="text-secondary">LEVEL 0{lvl}</p>
                    <p className="">
                      {stats.levelDistribution[lvl] || 0}
                    </p>
                    <p className="">TEAMS ACTIVE</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 16: Content Management & Readiness Tab */}
        {activeTab === 'content' && (
          <div className="">
            {/* Pre-Event Readiness Overview Box */}
            {readinessData && (
              <div className="admin-dynamic-element">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-primary flex items-center gap-2">
                      <FileCheck className="text-accent" />
                      PRE-EVENT CONTENT READINESS CHECKLIST
                    </h3>
                    <p className="text-secondary">Automated validation of all 6 levels, 12 questions, answers, hints, and passkey</p>
                  </div>
                  <span className="admin-dynamic-element">
                    {readinessData.overallReady ? 'OVERALL: READY TO LAUNCH' : 'OVERALL: NOT READY'}
                  </span>
                </div>

                <div className="grid">
                  <div className="">
                    <p className="text-secondary">LEVELS (6)</p>
                    <p className={readinessData.levelsReady ? 'text-emerald-400' : 'text-rose-400'}>{readinessData.levelsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="">
                    <p className="text-secondary">QUESTIONS (12)</p>
                    <p className={readinessData.questionsReady ? 'text-emerald-400' : 'text-rose-400'}>{readinessData.questionsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="">
                    <p className="text-secondary">ANSWERS (12)</p>
                    <p className={readinessData.answersReady ? 'text-emerald-400' : 'text-rose-400'}>{readinessData.answersReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="">
                    <p className="text-secondary">HINTS (6)</p>
                    <p className={readinessData.hintsReady ? 'text-emerald-400' : 'text-rose-400'}>{readinessData.hintsReady ? '✓ READY' : '✗ INCOMPLETE'}</p>
                  </div>
                  <div className="">
                    <p className="text-secondary">PASSKEY (6-DIGIT)</p>
                    <p className={readinessData.passkeyReady ? 'text-emerald-400' : 'text-rose-400'}>{readinessData.passkeyReady ? '✓ READY' : '✗ MISSING'}</p>
                  </div>
                </div>

                {!readinessData.overallReady && readinessData.validationErrors.length > 0 && (
                  <div className="">
                    <p className="">Required Actions Before Starting Event:</p>
                    <ul className="">
                      {readinessData.validationErrors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Level Selector Tabs */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                const summary = readinessData?.levelSummaries?.[lvl];
                const isReady = summary?.levelReady;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className="admin-dynamic-element"
                  >
                    <span>LEVEL 0{lvl}</span>
                    <span className="admin-dynamic-element">
                      {isReady ? '✓' : '!'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level Content Editor Form */}
            <div className="admin-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-primary flex items-center gap-2">
                  <Edit3 className="text-accent" />
                  CONFIGURE LEVEL 0{selectedLevel} CHALLENGES & CLUE
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenPlayerPreview(1)}
                    className="admin-panel admin-btn-secondary flex items-center"
                  >
                    <Eye className="" />
                    <span>P1 Safe View</span>
                  </button>
                  <button
                    onClick={() => handleOpenPlayerPreview(2)}
                    className="admin-panel admin-btn-secondary flex items-center"
                  >
                    <Eye className="" />
                    <span>P2 Safe View</span>
                  </button>
                </div>
              </div>

              <div className="grid">
                {/* Player 1 Question Box */}
                <div className="">
                  <h4 className="text-accent">PLAYER 01 QUESTION & SECRET ANSWER</h4>
                  <div>
                    <label className="text-secondary block">Question Statement:</label>
                    <textarea
                      rows={4}
                      value={editingP1Ev}
                      onChange={(e) => setEditingP1Ev(e.target.value)}
                      className="admin-panel text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Player 1 Instructions</label>
                    <textarea 
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 h-16 font-mono text-sm"
                      value={editingP1Inst}
                      onChange={(e) => setEditingP1Inst(e.target.value)}
                      placeholder="Enter Player 1 challenge question..."
                    />
                  </div>
                  <div>
                    <label className="text-secondary block">Expected Answer (Strict Server Secret):</label>
                    <input
                      type="text"
                      value={editingP1A}
                      onChange={(e) => setEditingP1A(e.target.value)}
                      placeholder="Enter expected answer string..."
                      className="admin-panel"
                    />
                  </div>
                </div>

                {/* Player 2 Question Box */}
                <div className="">
                  <h4 className="">PLAYER 02 QUESTION & SECRET ANSWER</h4>
                  <div>
                    <label className="text-secondary block">Question Statement:</label>
                    <textarea
                      rows={4}
                      value={editingP2Ev}
                      onChange={(e) => setEditingP2Ev(e.target.value)}
                      className="admin-panel text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Player 2 Instructions</label>
                    <textarea 
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 h-16 font-mono text-sm"
                      value={editingP2Inst}
                      onChange={(e) => setEditingP2Inst(e.target.value)}
                      placeholder="Enter Player 2 challenge question..."
                    />
                  </div>
                  <div>
                    <label className="text-secondary block">Expected Answer (Strict Server Secret):</label>
                    <input
                      type="text"
                      value={editingP2A}
                      onChange={(e) => setEditingP2A(e.target.value)}
                      placeholder="Enter expected answer string..."
                      className="admin-panel"
                    />
                  </div>
                </div>
              </div>

              {/* Progressive Hint Box */}
              <div className="">
                <h4 className="text-warning">LEVEL 0{selectedLevel} PROGRESSIVE CLUE SHARD</h4>
                <textarea
                  rows={2}
                  value={editingHint}
                  onChange={(e) => setEditingHint(e.target.value)}
                  placeholder="Enter progressive hint unlocked upon level completion..."
                  className="admin-panel"
                />
              </div>

              {/* Answer Simulator & Save Bar */}
              <div className="flex items-center justify-between gap-4">
                {/* Answer Test Preview Simulator */}
                <div className="flex items-center gap-2">
                  <select
                    value={testPlayerRole}
                    onChange={(e) => setTestPlayerRole(e.target.value as any)}
                    className="admin-panel"
                  >
                    <option value="PLAYER_1">P1 Test</option>
                    <option value="PLAYER_2">P2 Test</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Candidate Answer..."
                    value={testCandidateAnswer}
                    onChange={(e) => setTestCandidateAnswer(e.target.value)}
                    className="admin-panel text-primary"
                  />
                  <button
                    onClick={handleTestAnswer}
                    className="admin-btn-secondary"
                  >
                    Simulate
                  </button>
                  {testResult && (
                    <span className="admin-dynamic-element">
                      {testResult}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSaveLevelContent}
                  className=""
                >
                  Save Level 0{selectedLevel} Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="">
            {/* Search and Filters Bar */}
            <div className="admin-panel flex items-center justify-between">
              <div className="relative">
                <Search className="absolute" />
                <input
                  type="text"
                  placeholder="Search team, code, or player..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=""
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-secondary">STATUS:</span>
                {['ALL', 'ONLINE', 'OFFLINE', 'COMPLETED', 'IN_PROGRESS'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className="admin-dynamic-element"
                  >
                    {st}
                  </button>
                ))}

                <span className="text-secondary">LEVEL:</span>
                <button
                  onClick={() => setLevelFilter(undefined)}
                  className="admin-dynamic-element"
                >
                  ALL
                </button>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className="admin-dynamic-element"
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams & Players Control Table */}
            <div className="admin-panel">
              <table className="">
                <thead className="text-secondary">
                  <tr>
                    <th className="">Team</th>
                    <th className="">Level</th>
                    <th className="">Player 1 Node</th>
                    <th className="">Player 2 Node</th>
                    <th className="">Link Status</th>
                    <th className="">Clue Shards</th>
                    <th className="">Organizer Controls</th>
                  </tr>
                </thead>
                <tbody className="">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="">
                        No teams match the search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => {
                      const isOnline = t.connectionStatus === 'BOTH_ONLINE';
                      const isPartial = t.connectionStatus === 'ONE_ONLINE';
                      const isWaiting = t.connectionStatus === 'WAITING';
                      return (
                        <tr key={t.teamId}>
                          <td className="text-primary">
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{t.teamName}</div>
                            <div className="text-accent" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{t.teamCode}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                                border: '1px solid var(--accent-cyan)',
                                color: 'var(--accent-cyan)',
                                fontWeight: 800,
                                fontSize: '11px',
                              }}
                            >
                              TIER 0{t.currentLevel}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className={t.player1Completed ? 'text-success font-bold' : 'text-primary'}>
                                {t.player1Name}
                              </span>
                              {t.player1Completed && <CheckCircle2 size={12} className="text-success" />}
                              {t.player1SessionId && (
                                <button
                                  type="button"
                                  title="Revoke Session"
                                  onClick={() => handleRevokeSessionAction(t.player1SessionId, t.player1Name)}
                                  className="text-danger"
                                  style={{ padding: '2px 6px', fontSize: '10px', marginLeft: 'auto' }}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className={t.player2Completed ? 'text-success font-bold' : 'text-primary'}>
                                {t.player2Name}
                              </span>
                              {t.player2Completed && <CheckCircle2 size={12} className="text-success" />}
                              {t.player2SessionId && (
                                <button
                                  type="button"
                                  title="Revoke Session"
                                  onClick={() => handleRevokeSessionAction(t.player2SessionId, t.player2Name)}
                                  className="text-danger"
                                  style={{ padding: '2px 6px', fontSize: '10px', marginLeft: 'auto' }}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={isOnline ? 'badge-status-online' : isPartial ? 'badge-status-waiting' : isWaiting ? 'badge-status-waiting' : 'badge-status-offline'}>
                              {isOnline ? 'BOTH ONLINE' : isPartial ? '1 NODE ONLINE' : isWaiting ? 'LOBBY WAITING' : 'OFFLINE'}
                            </span>
                          </td>
                          <td className="text-warning font-bold">{t.hintsUnlocked} / 6</td>
                          <td>
                            <div className="flex items-center gap-2">
                              {t.status === 'PAUSED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleResumeTeamAction(t.teamId, t.teamName)}
                                  className="admin-btn-primary"
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  <Play size={12} />
                                  <span>Resume</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePauseTeamAction(t.teamId, t.teamName)}
                                  className="admin-btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  <Pause size={12} />
                                  <span>Pause</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleTeamReset(t.teamId, t.teamName)}
                                className="admin-btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                              >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTeamToReset({ id: t.teamId, name: t.teamName, code: t.teamCode })}
                                className="admin-btn-danger"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                title="Reset credentials and purge all sessions for this team"
                              >
                                <Trash2 size={12} />
                                <span>Credentials</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIVE SESSIONS & LOGINS MONITOR TAB */}
        {activeTab === 'sessions' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
            {/* Top Telemetry & Controls Box */}
            <div className="admin-panel" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
              <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 className="text-primary flex items-center gap-2" style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    <Radio size={18} className="text-accent animate-pulse" />
                    <span>ACTIVE TEAM SESSIONS & LOGIN REGISTRY</span>
                  </h3>
                  <p className="text-secondary" style={{ marginTop: '4px', margin: 0 }}>
                    Real-time console logins, active session tokens, and operator readiness telemetry
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetAllModal(true)}
                    className="admin-btn-danger flex items-center gap-2"
                    id="sessions-tab-reset-all-btn"
                  >
                    <Trash2 size={13} />
                    <span>RESET ALL CREDENTIALS & SESSIONS</span>
                  </button>
                  <button
                    onClick={loadData}
                    className="admin-btn-secondary"
                    title="Refresh session states"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>REFRESH</span>
                  </button>
                </div>
              </div>

              {/* Aggregated Quick Metrics */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '16px', gap: '12px' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  <p className="text-secondary" style={{ fontSize: '10px' }}>LOGGED-IN TEAMS</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)', margin: '4px 0 0 0' }}>
                    {teams.filter(t => t.isLoggedIn).length} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {teams.length}</span>
                  </p>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p className="text-secondary" style={{ fontSize: '10px' }}>ACTIVE PLAYER SESSIONS</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--status-success)', margin: '4px 0 0 0' }}>
                    {activeSessions.length} LIVE
                  </p>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <p className="text-secondary" style={{ fontSize: '10px' }}>BOTH NODES ACTIVE</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--status-warning)', margin: '4px 0 0 0' }}>
                    {teams.filter(t => t.connectionStatus === 'BOTH_ONLINE').length} TEAMS
                  </p>
                </div>
                <div style={{ background: 'rgba(225, 29, 72, 0.08)', padding: '12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <p className="text-secondary" style={{ fontSize: '10px' }}>AWAITING PARTNER / OFFLINE</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--status-error)', margin: '4px 0 0 0' }}>
                    {teams.filter(t => !t.isLoggedIn || t.connectionStatus === 'WAITING' || t.connectionStatus === 'ONE_ONLINE').length} TEAMS
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-panel flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px', padding: '12px 16px' }}>
              <div className="relative flex items-center" style={{ minWidth: '280px', flex: 1 }}>
                <Search size={14} className="absolute" style={{ left: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by team name, security code, or operator..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  style={{ paddingLeft: '32px', width: '100%' }}
                />
              </div>

              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="text-secondary">FILTER:</span>
                {[
                  { key: 'ALL', label: `ALL (${teams.length})` },
                  { key: 'ACTIVE_ONLY', label: `ACTIVE LOGINS (${teams.filter(t => t.isLoggedIn).length})` },
                  { key: 'BOTH_ONLINE', label: 'BOTH LIVE' },
                  { key: 'WAITING', label: 'WAITING / PARTIAL' },
                  { key: 'OFFLINE', label: 'OFFLINE' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSessionFilter(f.key as any)}
                    className={`admin-dynamic-element ${sessionFilter === f.key ? 'active' : ''}`}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Active Session Cards Matrix */}
            <div className="flex" style={{ flexDirection: 'column', gap: '14px' }}>
              {filteredSessionTeams.length === 0 ? (
                <div className="admin-panel flex items-center justify-center" style={{ padding: '48px', flexDirection: 'column', gap: '12px' }}>
                  <Users size={32} className="text-secondary" />
                  <p className="text-primary font-bold">No teams match the current session filter.</p>
                  <p className="text-secondary">Try switching filters or verify team logins.</p>
                </div>
              ) : (
                filteredSessionTeams.map((t) => {
                  const isBothLive = t.connectionStatus === 'BOTH_ONLINE';
                  const isOneLive = t.connectionStatus === 'ONE_ONLINE';
                  const isWaiting = t.connectionStatus === 'WAITING';

                  return (
                    <div
                      key={t.teamId}
                      className="admin-panel"
                      style={{
                        borderLeft: isBothLive
                          ? '4px solid var(--status-success)'
                          : isOneLive || isWaiting
                          ? '4px solid var(--status-warning)'
                          : '4px solid var(--border-dim)',
                        background: t.isLoggedIn ? 'rgba(14, 165, 233, 0.03)' : undefined,
                        marginBottom: '4px',
                      }}
                    >
                      {/* Team Header Row */}
                      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px', marginBottom: '14px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {t.teamName}
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'rgba(14, 165, 233, 0.15)',
                              border: '1px solid var(--accent-cyan)',
                              color: 'var(--accent-cyan)',
                              fontWeight: 700,
                            }}
                          >
                            {t.teamCode}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-dim)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            STATE: {t.gameState}
                          </span>
                        </div>

                        {/* Overall Session Pill & Actions */}
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isBothLive
                                ? 'badge-status-online'
                                : isOneLive || isWaiting
                                ? 'badge-status-waiting'
                                : 'badge-status-offline'
                            }
                            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}
                          >
                            {isBothLive
                              ? '● BOTH PLAYERS LOGGED IN'
                              : isOneLive
                              ? '◐ 1 OPERATOR LOGGED IN'
                              : isWaiting
                              ? '◑ LOGGED IN (WAITING)'
                              : '○ NO ACTIVE SESSIONS'}
                          </span>

                          {t.isLoggedIn && (
                            <button
                              type="button"
                              onClick={() => handleRevokeTeamSessionsAction(t.teamId, t.teamName)}
                              className="admin-btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 10px' }}
                              title="Disconnect both players without clearing credentials"
                            >
                              Revoke Sessions
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setTeamToReset({ id: t.teamId, name: t.teamName, code: t.teamCode })}
                            className="admin-btn-danger"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                            title="Reset team credentials and purge all sessions from database"
                          >
                            <Trash2 size={12} />
                            <span>Reset Credentials</span>
                          </button>
                        </div>
                      </div>

                      {/* Operator 1 & Analyzer 2 Session Nodes */}
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {/* Operator Node 01 */}
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-xs)',
                            background: t.player1LoggedIn ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.25)',
                            border: t.player1LoggedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-dim)',
                          }}
                        >
                          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                            <div className="flex items-center gap-2">
                              <Terminal size={14} className={t.player1LoggedIn ? 'text-success' : 'text-secondary'} />
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {t.player1Name || 'Operator 1'}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>[SLOT 1]</span>
                            </div>
                            <span
                              className={t.player1Connected ? 'badge-status-online' : t.player1LoggedIn ? 'badge-status-waiting' : 'badge-status-offline'}
                              style={{ fontSize: '9px', padding: '2px 6px' }}
                            >
                              {t.player1Connected ? 'ONLINE' : t.player1LoggedIn ? 'CONNECTED' : 'NOT LOGGED IN'}
                            </span>
                          </div>

                          <div className="flex" style={{ flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-secondary">SESSION TOKEN:</span>
                              <span style={{ color: t.player1SessionToken ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                                {t.player1SessionToken || 'None'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-secondary">LOBBY READINESS:</span>
                              <span style={{ color: t.player1Ready ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700 }}>
                                {t.player1Ready ? '✓ READY' : 'WAITING'}
                              </span>
                            </div>
                            {t.player1LoginTime && (
                              <div className="flex items-center justify-between">
                                <span className="text-secondary">LOGGED IN:</span>
                                <span className="text-secondary">{new Date(t.player1LoginTime).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>

                          {t.player1SessionId && (
                            <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleRevokeSessionAction(t.player1SessionId, t.player1Name)}
                                className="text-danger"
                                style={{ fontSize: '10px', padding: '2px 8px', border: '1px solid rgba(225, 29, 72, 0.4)', borderRadius: 'var(--radius-xs)' }}
                              >
                                Revoke Operator Session
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Analyzer Node 02 */}
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-xs)',
                            background: t.player2LoggedIn ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.25)',
                            border: t.player2LoggedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-dim)',
                          }}
                        >
                          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                            <div className="flex items-center gap-2">
                              <Cpu size={14} className={t.player2LoggedIn ? 'text-success' : 'text-secondary'} />
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {t.player2Name || 'Analyzer 2'}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>[SLOT 2]</span>
                            </div>
                            <span
                              className={t.player2Connected ? 'badge-status-online' : t.player2LoggedIn ? 'badge-status-waiting' : 'badge-status-offline'}
                              style={{ fontSize: '9px', padding: '2px 6px' }}
                            >
                              {t.player2Connected ? 'ONLINE' : t.player2LoggedIn ? 'CONNECTED' : 'NOT LOGGED IN'}
                            </span>
                          </div>

                          <div className="flex" style={{ flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-secondary">SESSION TOKEN:</span>
                              <span style={{ color: t.player2SessionToken ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                                {t.player2SessionToken || 'None'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-secondary">LOBBY READINESS:</span>
                              <span style={{ color: t.player2Ready ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700 }}>
                                {t.player2Ready ? '✓ READY' : 'WAITING'}
                              </span>
                            </div>
                            {t.player2LoginTime && (
                              <div className="flex items-center justify-between">
                                <span className="text-secondary">LOGGED IN:</span>
                                <span className="text-secondary">{new Date(t.player2LoginTime).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>

                          {t.player2SessionId && (
                            <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleRevokeSessionAction(t.player2SessionId, t.player2Name)}
                                className="text-danger"
                                style={{ fontSize: '10px', padding: '2px 8px', border: '1px solid rgba(225, 29, 72, 0.4)', borderRadius: 'var(--radius-xs)' }}
                              >
                                Revoke Analyzer Session
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'anticheat' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '20px' }}>
            {/* Top Mission Briefing Banner */}
            <div className="admin-panel flex items-center justify-between" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
              <div>
                <h3 className="text-primary flex items-center gap-2" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  <ShieldAlert className="text-danger" size={22} />
                  <span>ANTI-CHEAT DETECTION MATRIX & TEAM PENALTY AUDIT</span>
                </h3>
                <p className="text-secondary" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Server-authoritative telemetry verification: browser tab visibility, fullscreen escapes, and team score deductions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge-status-online" style={{ fontSize: '10px', padding: '3px 8px' }}>
                  LIVE WEBSOCKET AUDIT ACTIVE
                </span>
                <button
                  type="button"
                  onClick={loadData}
                  className="admin-btn-secondary flex items-center gap-1"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>SYNC DATA</span>
                </button>
              </div>
            </div>

            {/* Anti-Cheat KPI Statistics Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="admin-panel flex items-center gap-3">
                <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {antiCheatSummaries.reduce((sum, s) => sum + s.totalViolations, 0)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Total Violations Recorded
                  </div>
                </div>
              </div>

              <div className="admin-panel flex items-center gap-3">
                <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
                    {antiCheatSummaries.filter(s => s.totalViolations > 0).length} / {teams.length}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Teams with Penalties
                  </div>
                </div>
              </div>

              <div className="admin-panel flex items-center gap-3">
                <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(225, 29, 72, 0.15)', color: 'var(--accent-crimson-bright)' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-crimson-bright)', fontFamily: 'var(--font-mono)' }}>
                    -{antiCheatSummaries.reduce((sum, s) => sum + s.totalPenaltyPoints, 0)} PTS
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Total Points Deducted
                  </div>
                </div>
              </div>

              <div className="admin-panel flex items-center gap-3">
                <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--status-success)' }}>
                    ACTIVE ENFORCEMENT
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Deduplication & Cooldown: Active
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="admin-panel flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAntiCheatFilter('ALL')}
                  className={`admin-dynamic-element ${antiCheatFilter === 'ALL' ? 'active' : ''}`}
                  style={{ fontSize: '11px', padding: '6px 14px' }}
                >
                  ALL TEAMS ({antiCheatSummaries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAntiCheatFilter('PENALIZED_ONLY')}
                  className={`admin-dynamic-element ${antiCheatFilter === 'PENALIZED_ONLY' ? 'active' : ''}`}
                  style={{ fontSize: '11px', padding: '6px 14px' }}
                >
                  PENALIZED ONLY ({antiCheatSummaries.filter(s => s.totalViolations > 0).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Search size={14} className="text-secondary" />
                <input
                  type="text"
                  placeholder="Filter by team name or code..."
                  value={antiCheatSearch}
                  onChange={(e) => setAntiCheatSearch(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    padding: '6px 12px',
                    fontSize: '12px',
                    width: '240px',
                  }}
                />
              </div>
            </div>

            {/* Main Tables Grid: Team Summaries & Live Telemetry Stream */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
              {/* Team Penalty Summaries Table */}
              <div className="admin-panel">
                <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                  <h4 className="text-primary flex items-center gap-2" style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>
                    <Users size={16} className="text-accent" />
                    <span>TEAM PENALTY STANDINGS</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Leaderboard Impact: Ranked Lower
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead className="text-secondary" style={{ borderBottom: '1px solid var(--border-dim)', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '8px 10px' }}>Team</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Penalties</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tab Switches</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Fullscreen Exits</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Prolonged Hidden</th>
                        <th style={{ padding: '8px 10px' }}>Last Violation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {antiCheatSummaries
                        .filter((s) => {
                          if (antiCheatFilter === 'PENALIZED_ONLY' && s.totalViolations === 0) return false;
                          if (antiCheatSearch.trim()) {
                            const q = antiCheatSearch.toLowerCase();
                            const matchesCode = s.teamCode?.toLowerCase().includes(q);
                            const matchesName = s.teamName?.toLowerCase().includes(q);
                            if (!matchesCode && !matchesName) return false;
                          }
                          return true;
                        })
                        .map((summary) => {
                          const hasPenalties = summary.totalViolations > 0;
                          return (
                            <tr
                              key={summary.teamId}
                              style={{
                                borderBottom: '1px solid var(--border-dim)',
                                backgroundColor: hasPenalties ? 'rgba(239, 68, 68, 0.04)' : undefined,
                              }}
                            >
                              <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {summary.teamName || `Team #${summary.teamId}`}
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-cyan)' }}>
                                  {summary.teamCode}
                                </div>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                {hasPenalties ? (
                                  <span style={{ fontWeight: 900, color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.15)', padding: '3px 8px', borderRadius: '3px', border: '1px solid var(--accent-danger)' }}>
                                    -{summary.totalPenaltyPoints} pts
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>0 pts (Clean)</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                {summary.tabSwitchCount > 0 ? (
                                  <span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>{summary.tabSwitchCount}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                {summary.fullscreenExitCount > 0 ? (
                                  <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>{summary.fullscreenExitCount}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                {summary.prolongedHiddenCount > 0 ? (
                                  <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>{summary.prolongedHiddenCount}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {summary.lastViolationAt ? new Date(summary.lastViolationAt).toLocaleTimeString() : 'None'}
                              </td>
                            </tr>
                          );
                        })}
                      {antiCheatSummaries.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No team anti-cheat records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Incident Audit Stream */}
              <div className="admin-panel">
                <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                  <h4 className="text-primary flex items-center gap-2" style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>
                    <Activity size={16} className="text-danger animate-pulse" />
                    <span>LIVE SECURITY INCIDENT STREAM</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Last 100 Recorded Events
                  </span>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '540px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead className="text-secondary" style={{ borderBottom: '1px solid var(--border-dim)', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--bg-panel)' }}>
                      <tr>
                        <th style={{ padding: '8px 10px' }}>Timestamp</th>
                        <th style={{ padding: '8px 10px' }}>Team</th>
                        <th style={{ padding: '8px 10px' }}>Player</th>
                        <th style={{ padding: '8px 10px' }}>Violation</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Penalty</th>
                        <th style={{ padding: '8px 10px' }}>Server Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {antiCheatEvents
                        .filter((ev) => {
                          if (antiCheatSearch.trim()) {
                            const q = antiCheatSearch.toLowerCase();
                            const match =
                              ev.teamCode?.toLowerCase().includes(q) ||
                              ev.teamName?.toLowerCase().includes(q) ||
                              ev.playerName?.toLowerCase().includes(q) ||
                              ev.violationType?.toLowerCase().includes(q);
                            if (!match) return false;
                          }
                          return true;
                        })
                        .map((ev) => {
                          const isFullscreen = ev.violationType === 'FULLSCREEN_EXIT';
                          const isProlonged = ev.violationType === 'PROLONGED_PAGE_HIDDEN';

                          return (
                            <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                                {new Date(ev.detectedAt).toLocaleTimeString()}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev.teamName || ev.teamCode}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{ev.teamCode}</div>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{ev.playerName}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '4px' }}>[P{ev.playerNumber}]</span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '2px',
                                    background: isProlonged ? 'rgba(239, 68, 68, 0.2)' : isFullscreen ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                                    color: isProlonged ? 'var(--accent-danger)' : isFullscreen ? 'var(--status-warning)' : 'var(--accent-cyan)',
                                    border: `1px solid ${isProlonged ? 'var(--accent-danger)' : isFullscreen ? 'var(--status-warning)' : 'var(--accent-cyan)'}`,
                                  }}
                                >
                                  {ev.violationType}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'var(--accent-danger)' }}>
                                  -{ev.penaltyPoints} pts
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '10px' }}>
                                <div style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Server Verified</div>
                                {ev.durationMs ? <div>Duration: {(ev.durationMs / 1000).toFixed(1)}s</div> : null}
                              </td>
                            </tr>
                          );
                        })}
                      {antiCheatEvents.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No security incidents logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="grid">
            {/* Organizer Event Controls */}
            <div className="admin-panel">
              <h3 className="text-primary flex items-center gap-2">
                <Power className="text-accent" />
                EVENT LIFECYCLE DIRECTIVES
              </h3>

              <div className="">
                <button
                  onClick={handleStart}
                  className="flex items-center justify-center gap-2"
                >
                  <Play className="" />
                  <span>START EVENT (AUTHORIZE GAMEPLAY)</span>
                </button>

                <button
                  onClick={handlePause}
                  className="flex items-center justify-center gap-2"
                >
                  <Pause className="" />
                  <span>PAUSE EVENT (FREEZE SUBMISSIONS)</span>
                </button>

                <button
                  onClick={handleResume}
                  className="admin-btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="" />
                  <span>RESUME EVENT</span>
                </button>

                <button
                  onClick={handleEnd}
                  className="text-primary flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="" />
                  <span>END EVENT (PERMANENTLY CLOSE GAMEPLAY)</span>
                </button>
              </div>
            </div>

            {/* Passkey Management */}
            <div className="admin-panel">
              <h3 className="text-primary flex items-center gap-2">
                <KeyRound className="text-accent" />
                FINAL PASSKEY HASH RE-CONFIGURATION
              </h3>

              <form onSubmit={handlePasskeyChange} className="">
                <p className="text-secondary">
                  Update the secret 6-digit numeric passkey used for final terminal authorization. Passkeys are salted and BCrypt-hashed on the server.
                </p>

                <input
                  type="password"
                  maxLength={6}
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit numeric passkey"
                  className=""
                />

                <button
                  type="submit"
                  disabled={newPasskey.length !== 6}
                  className=""
                >
                  Update Passkey Hash
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="">
            {/* CSV Exports */}
            <div className="admin-panel flex items-center justify-between gap-4">
              <div>
                <h3 className="text-primary">EVENT RESULTS & CSV EXPORTS</h3>
                <p className="text-secondary">Download official server-authoritative leaderboard and progress reports</p>
              </div>

              <div className="flex">
                <a
                  href={`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/export/results`}
                  download
                  className="flex items-center gap-2"
                >
                  <span>Export Results CSV</span>
                </a>

                <a
                  href={`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/export/progress`}
                  download
                  className="admin-panel admin-btn-secondary flex items-center gap-2"
                >
                  <span>Export Progress CSV</span>
                </a>
              </div>
            </div>

            {/* Results Table */}
            <div className="admin-panel">
              <table className="">
                <thead className="text-secondary">
                  <tr>
                    <th className="">Rank</th>
                    <th className="">Team</th>
                    <th className="">Player 1</th>
                    <th className="">Player 2</th>
                    <th className="">Status</th>
                    <th className="">Penalties</th>
                    <th className="">Completed At</th>
                  </tr>
                </thead>
                <tbody className="">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="">
                        No team results recorded.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t, idx) => {
                      const summary = antiCheatSummaries.find((s) => s.teamId === t.teamId);
                      return (
                        <tr key={t.teamId} className="admin-btn-secondary">
                          <td className="text-warning">
                            {t.gameState === 'COMPLETED' ? `#${idx + 1}` : '-'}
                          </td>
                          <td className="text-primary">
                            <div>{t.teamName}</div>
                            <div className="text-accent">{t.teamCode}</div>
                          </td>
                          <td className="">{t.player1Name}</td>
                          <td className="">{t.player2Name}</td>
                          <td className="">
                            <span className="admin-dynamic-element">
                              {t.gameState}
                            </span>
                          </td>
                          <td className="">
                            {summary && summary.totalPenaltyPoints > 0 ? (
                              <span style={{ color: 'var(--accent-danger)', fontWeight: 800, fontSize: '11px' }}>
                                -{summary.totalPenaltyPoints} pts ({summary.totalViolations} viol.)
                              </span>
                            ) : (
                              <span style={{ color: 'var(--status-success)', fontSize: '11px' }}>0 pts (Clean)</span>
                            )}
                          </td>
                          <td className="text-secondary">
                            {t.completedAt ? new Date(t.completedAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="admin-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-primary flex items-center gap-2">
                <FileText className="text-accent" />
                ADMINISTRATIVE AUDIT LOG
              </h3>
              <span className="">IMMUTABLE OPERATIONS TRAIL</span>
            </div>

            <table className="">
              <thead className="text-secondary">
                <tr>
                  <th className="">Timestamp</th>
                  <th className="">Admin Identity</th>
                  <th className="">Role</th>
                  <th className="">Action</th>
                  <th className="">Target</th>
                  <th className="">Details</th>
                </tr>
              </thead>
              <tbody className="">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="">
                      No administrative audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isDanger = log.action.includes('STOP') || log.action.includes('REVOKE') || log.action.includes('RESET');
                    const isWarning = log.action.includes('PAUSE') || log.action.includes('PASSKEY');
                    return (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.adminUsername}</td>
                        <td>
                          <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dim)', borderRadius: '2px' }}>
                            {log.role}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: isDanger ? 'var(--status-error)' : isWarning ? 'var(--status-warning)' : 'var(--status-success)' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{log.target || '-'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{log.details || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
