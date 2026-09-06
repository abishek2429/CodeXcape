import { StorylineData } from '../types/story';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/player/game` : '/api/player/game';

export async function fetchStoryline(): Promise<StorylineData | null> {
  try {
    const response = await fetch(`${API_BASE}/story`, {
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
