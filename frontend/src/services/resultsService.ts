export interface LeaderboardEntry {
  rank?: number;
  teamId: number;
  teamCode: string;
  teamName: string;
  status: string;
  gameState: string;
  currentLevel: number;
  player1Name: string;
  player2Name: string;
  completedAt?: string;
  durationSeconds?: number;
  formattedDuration: string;
}

export interface LevelStatistics {
  levelNumber: number;
  levelName: string;
  teamsReached: number;
  teamsCompleted: number;
  currentlyHere: number;
}

export interface EventStatistics {
  eventId: number;
  eventName: string;
  eventStatus: string;
  totalRegisteredTeams: number;
  startedTeams: number;
  activeTeams: number;
  completedTeams: number;
  notStartedTeams: number;
  disconnectedTeams: number;
  fastestCompletionSeconds?: number;
  formattedFastestCompletion?: string;
  averageCompletionSeconds?: number;
  formattedAverageCompletion?: string;
  latestCompletionTime?: string;
  levelBreakdown: LevelStatistics[];
}

export interface PublicLeaderboardEntry {
  rank?: number;
  teamName: string;
  status: string;
  currentLevel: number;
  formattedDuration: string;
}

export interface PublicLeaderboard {
  eventId: number;
  eventName: string;
  eventStatus: string;
  completedEntries: PublicLeaderboardEntry[];
  activeEntries: PublicLeaderboardEntry[];
}

const ADMIN_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Admin-Role': 'ORGANIZER',
  'X-Admin-Username': 'organizer',
};

export async function fetchLeaderboard(eventId: number): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/leaderboard`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard.');
  return res.json();
}

export async function fetchEventStatistics(eventId: number): Promise<EventStatistics> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/statistics`, {
    headers: ADMIN_HEADERS,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch event statistics.');
  return res.json();
}

export async function fetchPublicLeaderboard(eventId: number): Promise<PublicLeaderboard> {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/events/${eventId}/leaderboard`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch public leaderboard.');
  return res.json();
}

export function getExportResultsUrl(eventId: number): string {
  return `${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/export/results`;
}

export function getExportProgressUrl(eventId: number): string {
  return `${import.meta.env.VITE_API_URL || ''}/api/admin/events/${eventId}/export/progress`;
}
