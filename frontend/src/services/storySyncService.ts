import { getAuthHeaders } from './playerAuthService';
import { StorySequence } from '../config/storyConfig';

export interface ActiveStoryStateResponse {
  isStoryActive: boolean;
  storyKey: string | null;
  storyPausedAt: string | null;
  currentPauseSeconds: number | null;
  totalStoryPauseSeconds: number;
  effectiveActiveDurationSeconds: number;
  sequence: StorySequence | null;
  completedStoryKeys: string[];
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/player/game/story`
  : '/api/player/game/story';

export async function fetchCurrentStory(): Promise<ActiveStoryStateResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/current`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function skipStory(): Promise<ActiveStoryStateResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/skip`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function completeStory(): Promise<ActiveStoryStateResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchStoryHistory(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}
