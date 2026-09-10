import { PlayerInfo, PlayerLoginRequest } from '../types/player';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/player` : '/api/player';

export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = sessionStorage.getItem('codexcape_session');
  return {
    'Accept': 'application/json',
    ...(token ? { 
      'X-Player-Session': token,
      'Authorization': `Bearer ${token}`
    } : {}),
    ...additionalHeaders,
  };
}

export async function loginPlayer(payload: PlayerLoginRequest): Promise<PlayerInfo> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error('Unable to connect to the game server. Please try again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();
  if (data.sessionToken) {
    sessionStorage.setItem('codexcape_session', data.sessionToken);
  }
  return data;
}

export async function getCurrentPlayer(): Promise<PlayerInfo | null> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.sessionToken) {
      sessionStorage.setItem('codexcape_session', data.sessionToken);
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function fetchLobbyState(): Promise<PlayerInfo> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lobby`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (err: any) {
    throw new Error('Unable to communicate with the game server. Please check your connection or retry.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch team lobby state.');
  }

  const data = await response.json();
  if (data.sessionToken) {
    sessionStorage.setItem('codexcape_session', data.sessionToken);
  }
  return data;
}

export async function setPlayerReady(ready: boolean): Promise<PlayerInfo> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/ready`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ ready }),
    });
  } catch (err: any) {
    throw new Error('Unable to communicate with the game server. Please check your connection or retry.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update readiness.');
  }

  const data = await response.json();
  if (data.sessionToken) {
    sessionStorage.setItem('codexcape_session', data.sessionToken);
  }
  return data;
}

export async function startTeamEvent(): Promise<PlayerInfo> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/event/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (err: any) {
    throw new Error('Unable to communicate with the game server. Please check your connection or retry.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to start event.');
  }

  const data = await response.json();
  if (data.sessionToken) {
    sessionStorage.setItem('codexcape_session', data.sessionToken);
  }
  return data;
}

export async function logoutPlayer(): Promise<void> {
  sessionStorage.removeItem('codexcape_session');
  sessionStorage.removeItem('codexcape_briefing_seen');
  sessionStorage.removeItem('codexcape_core_seen');
  sessionStorage.removeItem('codexcape_restoration_seen');
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (err) {
    // Ignore logout network errors
  }
}
