import { Team, TeamDetail, CreateTeamPayload, UpdateTeamPayload, TeamStatus } from '../types/team';
import { getAdminHeaders, getAdminAuthOnlyHeaders } from './adminService';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin` : '/api/admin';

export async function fetchTeamsForEvent(eventId: number): Promise<Team[]> {
  const response = await fetch(`${API_BASE}/events/${eventId}/teams`, {
    method: 'GET',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch teams for event #${eventId}`);
  }

  return response.json();
}

export async function fetchTeamById(teamId: number): Promise<TeamDetail> {
  const response = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: 'GET',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch team #${teamId}`);
  }

  return response.json();
}

export async function createTeam(eventId: number, payload: CreateTeamPayload): Promise<TeamDetail> {
  const response = await fetch(`${API_BASE}/events/${eventId}/teams`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.errors) {
      const fieldErrors = Object.values(errorData.errors).join(', ');
      throw new Error(fieldErrors || errorData.message || 'Team creation failed');
    }
    throw new Error(errorData.message || `Failed to create team (Status ${response.status})`);
  }

  return response.json();
}

export async function updateTeam(teamId: number, payload: UpdateTeamPayload): Promise<TeamDetail> {
  const response = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update team');
  }

  return response.json();
}

export async function updateTeamStatus(teamId: number, status: TeamStatus): Promise<TeamDetail> {
  const response = await fetch(`${API_BASE}/teams/${teamId}/status`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update team status');
  }

  return response.json();
}

export async function deleteTeam(teamId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: 'DELETE',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete team');
  }
}

// ---- Excel Team Import ----

export interface TeamImportRow {
  rowNumber: number;
  teamName: string;
  player1Name: string;
  player2Name: string;
  valid: boolean;
  validationErrors: string[];
}

export interface TeamImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: TeamImportRow[];
  errors: string[];
  warnings: string[];
  importReady: boolean;
}

export interface TeamImportResult {
  teamsCreated: number;
  playersCreated: number;
  duplicatesSkipped: number;
  errorsEncountered: number;
  createdTeamCodes: string[];
  errors: string[];
  importTimestamp: string;
  summary: string;
}

export async function uploadTeamExcelPreview(eventId: number, file: File): Promise<TeamImportPreview> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/events/${eventId}/teams/import/preview`, {
    method: 'POST',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to preview Excel import');
  }

  return response.json();
}

export async function confirmTeamImport(eventId: number, file: File): Promise<TeamImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/events/${eventId}/teams/import/confirm`, {
    method: 'POST',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to confirm team import');
  }

  return response.json();
}

