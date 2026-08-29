import { LevelProgressItem } from '../types/game';

export interface PlayerGameStateResponse {
  teamCode: string;
  teamName: string;
  gameStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINAL_PASSKEY' | 'COMPLETED' | 'DISQUALIFIED';
  currentLevel: number;
  eventStatus: string;
  levels: LevelProgressItem[];
}

export interface CurrentLevelResponse {
  levelNumber: number;
  name: string;
  description: string;
  difficulty: string;
}

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/player/game` : '/api/player/game';

export async function fetchPlayerGameState(): Promise<PlayerGameStateResponse | null> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}

export async function fetchCurrentLevel(): Promise<CurrentLevelResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/current`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}
