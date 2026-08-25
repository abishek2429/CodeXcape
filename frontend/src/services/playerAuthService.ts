import { PlayerInfo, PlayerLoginRequest } from '../types/player';

const API_BASE = '/api/player';

export async function loginPlayer(payload: PlayerLoginRequest): Promise<PlayerInfo> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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

  return response.json();
}

export async function getCurrentPlayer(): Promise<PlayerInfo | null> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}

export async function logoutPlayer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
  } catch (err) {
    // Ignore logout network errors
  }
}
