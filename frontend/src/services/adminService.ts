export interface AdminDashboardStats {
  eventId: number;
  eventName: string;
  eventStatus: string;
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
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
  const res = await fetch(`/api/admin/events/${eventId}/dashboard`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats.');
  return res.json();
}

export async function fetchTeamsProgress(eventId: number, search?: string, level?: number): Promise<AdminTeamProgress[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (level) params.append('level', level.toString());

  const res = await fetch(`/api/admin/events/${eventId}/teams/progress?${params.toString()}`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch team progress.');
  return res.json();
}

export async function startEvent(eventId: number): Promise<void> {
  const res = await fetch(`/api/admin/events/${eventId}/start`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to start event.');
}

export async function pauseEvent(eventId: number): Promise<void> {
  const res = await fetch(`/api/admin/events/${eventId}/pause`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to pause event.');
}

export async function resumeEvent(eventId: number): Promise<void> {
  const res = await fetch(`/api/admin/events/${eventId}/resume`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to resume event.');
}

export async function endEvent(eventId: number): Promise<void> {
  const res = await fetch(`/api/admin/events/${eventId}/end`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to end event.');
}

export async function updateEventPasskey(eventId: number, passkey: string): Promise<void> {
  const res = await fetch(`/api/admin/events/${eventId}/passkey`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ passkey }),
  });
  if (!res.ok) throw new Error('Failed to update event passkey.');
}

export async function resetTeam(teamId: number): Promise<void> {
  const res = await fetch(`/api/admin/teams/${teamId}/reset`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to reset team.');
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const res = await fetch(`/api/admin/events/audit-logs`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) return [];
  return res.json();
}
