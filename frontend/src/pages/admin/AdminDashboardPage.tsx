import React, { useState, useEffect } from 'react';
import './AdminDashboardPage.css';
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
  const [, setLoading] = useState(true);
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
    <div className="admin-layout relative">
      {/* Admin Command Center Header */}
      <header className="admin-panel flex items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="text-accent flex items-center justify-center">
            <Shield className="" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-primary">
                CODEXCAPE
              </h1>
              <span className="">
                COMMAND CENTER // ADMIN
              </span>
            </div>
            <p className="text-secondary">Authoritative Live Event Operations & Mission Orchestration</p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="admin-btn-danger text-primary flex items-center gap-2"
          >
            <AlertOctagon className="animate-pulse" />
            <span>EMERGENCY STOP</span>
          </button>
          
          <button
            onClick={loadData}
            className="admin-panel admin-btn-secondary"
            title="Refresh telemetry"
          >
            <RefreshCw className="admin-dynamic-element" />
          </button>
          
          <a
            href="/"
            className="admin-panel admin-btn-secondary flex items-center"
          >
            <LogOut className="" />
            <span>Exit Portal</span>
          </a>
        </div>
      </header>

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
                <div className="">
                  {safePreview.questionContent}
                </div>
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
          className="admin-dynamic-element"
        >
          TELEMETRY OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className="admin-dynamic-element"
        >
          <BookOpen className="" />
          <span>CONTENT & READINESS</span>
          {readinessData && (
            <span className="admin-dynamic-element">
              {readinessData.overallReady ? 'READY' : 'INCOMPLETE'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className="admin-dynamic-element"
        >
          TEAM MONITORING ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className="admin-dynamic-element"
        >
          EVENT CONTROLS & PASSKEY
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className="admin-dynamic-element"
        >
          LEADERBOARD & EXPORTS
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className="admin-dynamic-element"
        >
          SECURITY AUDIT LOGS ({auditLogs.length})
        </button>

        <a
          href="/public-leaderboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
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
                      value={editingP1Q}
                      onChange={(e) => setEditingP1Q(e.target.value)}
                      placeholder="Enter Player 1 challenge question..."
                      className="admin-panel text-primary"
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
                      value={editingP2Q}
                      onChange={(e) => setEditingP2Q(e.target.value)}
                      placeholder="Enter Player 2 challenge question..."
                      className="admin-panel text-primary"
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
                    teams.map((t) => (
                      <tr key={t.teamId} className="admin-btn-secondary">
                        <td className="text-primary">
                          <div className="">{t.teamName}</div>
                          <div className="text-accent">{t.teamCode}</div>
                        </td>
                        <td className="">
                          <span className="">
                            Tier 0{t.currentLevel}
                          </span>
                        </td>
                        <td className="">
                          <div className="flex items-center">
                            <span className="admin-dynamic-element" />
                            <span className={t.player1Completed ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{t.player1Name}</span>
                            {t.player1SessionId && (
                              <button
                                title="Revoke Session"
                                onClick={() => handleRevokeSessionAction(t.player1SessionId, t.player1Name)}
                                className="text-danger"
                              >
                                [Revoke]
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="">
                          <div className="flex items-center">
                            <span className="admin-dynamic-element" />
                            <span className={t.player2Completed ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{t.player2Name}</span>
                            {t.player2SessionId && (
                              <button
                                title="Revoke Session"
                                onClick={() => handleRevokeSessionAction(t.player2SessionId, t.player2Name)}
                                className="text-danger"
                              >
                                [Revoke]
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="">
                          <span className="admin-dynamic-element">
                            {t.connectionStatus || 'OFFLINE'}
                          </span>
                        </td>
                        <td className="text-warning">{t.hintsUnlocked} / 6</td>
                        <td className="">
                          {t.status === 'PAUSED' ? (
                            <button
                              onClick={() => handleResumeTeamAction(t.teamId, t.teamName)}
                              className=""
                            >
                              Resume Team
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePauseTeamAction(t.teamId, t.teamName)}
                              className=""
                            >
                              Pause Team
                            </button>
                          )}
                          <button
                            onClick={() => handleTeamReset(t.teamId, t.teamName)}
                            className="flex items-center"
                          >
                            <RotateCcw className="" />
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
                  href={`/api/admin/events/${eventId}/export/results`}
                  download
                  className="flex items-center gap-2"
                >
                  <span>Export Results CSV</span>
                </a>

                <a
                  href={`/api/admin/events/${eventId}/export/progress`}
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
                    <th className="">Completed At</th>
                  </tr>
                </thead>
                <tbody className="">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="">
                        No team results recorded.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t, idx) => (
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
                        <td className="text-secondary">
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
                  auditLogs.map((log) => (
                    <tr key={log.id} className="admin-btn-secondary">
                      <td className="text-secondary">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="">{log.adminUsername}</td>
                      <td className=""><span className="">{log.role}</span></td>
                      <td className="text-success">{log.action}</td>
                      <td className="">{log.target || '-'}</td>
                      <td className="text-secondary">{log.details || '-'}</td>
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
