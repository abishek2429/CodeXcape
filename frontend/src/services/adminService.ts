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
  serverStatus: string;
  eventDurationSeconds?: number;
  startTime?: string;
  endTime?: string;
  levelDistribution: Record<number, number>;
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

const ADMIN_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Admin-Role': 'ORGANIZER',
  'X-Admin-Username': 'organizer',
};

export async function fetchDashboardStats(eventId: number): Promise<AdminDashboardStats> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/dashboard`, {
    headers: ADMIN_HEADERS,
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
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch team progress.');
  return res.json();
}

export async function startEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/start`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to start event.');
}

export async function pauseEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/pause`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to pause event.');
}

export async function resumeEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/resume`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to resume event.');
}

export async function endEvent(eventId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/end`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to end event.');
}

export async function emergencyStopEvent(eventId: number, reason?: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/emergency-stop`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ reason: reason || 'Organizer Emergency Stop Triggered' }),
  });
  if (!res.ok) throw new Error('Failed to trigger emergency stop.');
}

export async function pauseTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/pause`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to pause team.');
}

export async function resumeTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/resume`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to resume team.');
}

export async function revokeSession(sessionId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to revoke session.');
}

export async function updateEventPasskey(eventId: number, passkey: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/passkey`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ passkey }),
  });
  if (!res.ok) throw new Error('Failed to update event passkey.');
}

export async function resetTeam(teamId: number): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/teams/${teamId}/reset`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to reset team.');
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/audit-logs`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEventContent(eventId: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/content`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch event content.');
  return res.json();
}

export async function fetchEventValidation(eventId: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/validation`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch event validation.');
  return res.json();
}

export async function saveQuestion(eventId: number, levelNumber: number, data: {
  playerNumber: 'PLAYER_1' | 'PLAYER_2';
  questionContent: string;
  puzzleContext?: string;
  expectedAnswer: string;
  answerType?: string;
}): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/levels/${levelNumber}/questions`, {
    method: 'PUT',
    headers: ADMIN_HEADERS,
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
    headers: ADMIN_HEADERS,
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
    headers: ADMIN_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ levelNumber, playerNumber, candidateAnswer }),
  });
  if (!res.ok) throw new Error('Failed to test answer.');
  return res.json();
}

export async function fetchPlayerSafePreview(eventId: number, levelNumber: number, playerNumber: number): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/preview/player?levelNumber=${levelNumber}&playerNumber=${playerNumber}`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch player safe preview.');
  return res.json();
}
