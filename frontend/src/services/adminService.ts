export interface AdminDashboardStats {
  eventId: number;
  eventName: string;
  eventStatus: string;
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  disconnectedPlayers: number;
  bothPlayersOnlineTeams: number;
  onePlayerOfflineTeams: number;
  bothPlayersOfflineTeams: number;
  totalLoggedInTeams?: number;
  totalActiveSessions?: number;
  activeWebSocketConnections?: number;
  serverStatus: string;
  eventDurationSeconds?: number;
  startTime?: string;
  endTime?: string;
  levelDistribution: Record<number, number>;
}

export interface AdminActiveSession {
  sessionId: number;
  teamId: number;
  teamCode: string;
  teamName: string;
  playerId: number;
  playerNumber: number;
  playerName: string;
  playerRole: string; // 'OPERATOR' | 'ANALYZER'
  playerStatus: string;
  isReady: boolean;
  sessionToken?: string;
  sessionTokenPreview: string;
  sessionStatus: string;
  isConnected: boolean;
  createdAt: string;
  lastActivityAt: string;
  teamGameState: string;
}

export interface AdminTeamProgress {
  teamId: number;
  teamCode: string;
  teamName: string;
  status: string;
  gameState: string;
  currentLevel: number;
  player1Completed: boolean;
  player2Completed: boolean;
  player1Name: string;
  player2Name: string;
  player1Connected?: boolean;
  player2Connected?: boolean;
  connectionStatus?: string;
  player1SessionId?: number;
  player2SessionId?: number;
  hintsUnlocked: number;
  completedAt?: string;

  // Active session and login monitoring metadata
  isLoggedIn?: boolean;
  activeSessionsCount?: number;
  teamSessionActive?: boolean;

  player1Status?: string;
  player1LoggedIn?: boolean;
  player1Ready?: boolean;
  player1SessionToken?: string;
  player1LoginTime?: string;
  player1LastActivity?: string;

  player2Status?: string;
  player2LoggedIn?: boolean;
  player2Ready?: boolean;
  player2SessionToken?: string;
  player2LoginTime?: string;
  player2LastActivity?: string;
}

export interface AdminAuditLog {
  id: number;
  adminUsername: string;
  role: string;
  action: string;
  target?: string;
  details?: string;
  createdAt: string;
}

export function getAdminHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  let token: string | null = null;
  try {
    token = localStorage.getItem('codexcape_admin_session') || sessionStorage.getItem('codexcape_admin_session');
  } catch (e) {
    // storage not accessible
  }
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? {
      'X-Admin-Session': token,
      'Authorization': `Bearer ${token}`
    } : {}),
    ...additionalHeaders,
  };
}

export function getAdminAuthOnlyHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  let token: string | null = null;
  try {
    token = localStorage.getItem('codexcape_admin_session') || sessionStorage.getItem('codexcape_admin_session');
  } catch (e) {
    // storage not accessible
  }
  return {
    'Accept': 'application/json',
    ...(token ? {
      'X-Admin-Session': token,
      'Authorization': `Bearer ${token}`
    } : {}),
    ...additionalHeaders,
  };
}

export const ADMIN_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export async function fetchDashboardStats(eventId: number): Promise<AdminDashboardStats> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/dashboard`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats.');
  return res.json();
}

export async function fetchTeamsProgress(eventId: number, search?: string, level?: number, status?: string): Promise<AdminTeamProgress[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (level) params.append('level', level.toString());
  if (status) params.append('status', status);

  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/teams/progress?${params.toString()}`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch team progress.');
  return res.json();
}

export async function startEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/start`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to start event.');
}

export async function pauseEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/pause`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to pause event.');
}

export async function resumeEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/resume`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to resume event.');
}

export async function endEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/end`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to end event.');
}

export async function emergencyStopEvent(eventId: number, reason?: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/emergency-stop`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason: reason || 'Organizer Emergency Stop Triggered' }),
  });
  if (!res.ok) throw new Error('Failed to trigger emergency stop.');
}

export async function pauseTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/pause`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to pause team.');
}

export async function resumeTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/resume`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to resume team.');
}

export async function revokeSession(sessionId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to revoke session.');
}

export async function updateEventPasskey(eventId: number, passkey: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/passkey`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ passkey }),
  });
  if (!res.ok) throw new Error('Failed to update event passkey.');
}

export async function resetTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/reset`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to reset team.');
}

export async function fetchActiveSessions(eventId: number): Promise<AdminActiveSession[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/active-sessions`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch active sessions.');
  return res.json();
}

export async function resetTeamCredentials(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/reset-credentials`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to reset team credentials.');
}

export async function revokeTeamSessions(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/revoke-sessions`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to revoke team sessions.');
}

export async function resetAllSessionsAndCredentials(): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/sessions/reset-all`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to reset all sessions and credentials.');
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/audit-logs`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEventContent(eventId: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/content`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch event content.');
  return res.json();
}

export async function fetchEventValidation(eventId: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/validation`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch event validation.');
  return res.json();
}

export async function saveQuestion(eventId: number, levelNumber: number, data: {
  stageNumber?: number;
  playerNumber: 'PLAYER_1' | 'PLAYER_2';
  evidence: string;
  instructions?: string;
  puzzleContext?: string;
  technicalCategory?: string;
  difficulty?: string;
  validationRules?: string;
  puzzleMetadata?: string;
  expectedAnswer: string;
  answerType?: string;
}): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/levels/${levelNumber}/questions`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save question.');
  }
  return res.json();
}

export async function saveHint(eventId: number, levelNumber: number, hintContent: string): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/levels/${levelNumber}/hint`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ levelNumber, hintContent, displayOrder: 1, isActive: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save hint.');
  }
  return res.json();
}

export async function testAnswer(eventId: number, levelNumber: number, playerNumber: 'PLAYER_1' | 'PLAYER_2', candidateAnswer: string): Promise<{ result: string }> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/test-answer`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ levelNumber, playerNumber, candidateAnswer }),
  });
  if (!res.ok) throw new Error('Failed to test answer.');
  return res.json();
}

export async function fetchPlayerSafePreview(eventId: number, levelNumber: number, playerNumber: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/preview/player?levelNumber=${levelNumber}&playerNumber=${playerNumber}`, {
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch player safe preview.');
  return res.json();
}
