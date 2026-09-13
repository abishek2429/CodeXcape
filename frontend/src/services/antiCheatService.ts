import { getAuthHeaders } from './playerAuthService';
import { getAdminHeaders } from './adminService';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AntiCheatEventResponse {
  accepted: boolean;
  deduplicated: boolean;
  incidentId?: number;
  violationType?: string;
  penaltyPoints?: number;
  teamTotalPenalties?: number;
  message?: string;
}

export interface AntiCheatSummary {
  teamId: number;
  teamCode: string;
  teamName?: string;
  totalPenaltyPoints: number;
  totalViolations: number;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  prolongedHiddenCount: number;
  lastViolationAt?: string;
}

export interface AntiCheatAuditItem {
  id: number;
  teamId: number;
  teamCode: string;
  teamName?: string;
  playerId: number;
  playerName: string;
  playerNumber: number;
  violationType: string;
  penaltyPoints: number;
  durationMs?: number;
  detectedAt: string;
  metadata?: string;
}

export async function reportAntiCheatEvent(
  eventType: string,
  metadata?: string
): Promise<AntiCheatEventResponse> {
  const res = await fetch(`${API_BASE}/api/player/anti-cheat/event`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({
      eventType,
      clientTimestamp: Date.now(),
      metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'FAILED TO TRANSMIT ANTI-CHEAT TELEMETRY');
  }

  return res.json();
}

export async function fetchTeamAntiCheatSummary(): Promise<AntiCheatSummary> {
  const res = await fetch(`${API_BASE}/api/player/anti-cheat/summary`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('FAILED TO FETCH TEAM ANTI-CHEAT STATUS');
  }
  return res.json();
}

export async function fetchAdminAntiCheatEvents(eventId: number): Promise<AntiCheatAuditItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/anti-cheat/events?eventId=${eventId}`, {
    method: 'GET',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('FAILED TO FETCH ANTI-CHEAT EVENTS');
  }
  return res.json();
}

export async function fetchAdminAntiCheatSummaries(eventId: number): Promise<AntiCheatSummary[]> {
  const res = await fetch(`${API_BASE}/api/admin/anti-cheat/summary?eventId=${eventId}`, {
    method: 'GET',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('FAILED TO FETCH ANTI-CHEAT SUMMARIES');
  }
  return res.json();
}
