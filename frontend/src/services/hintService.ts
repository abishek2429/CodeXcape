import { HintData } from '../types/game';

export interface PlayerHintResponse {
  levelNumber: number;
  hintNumber: number;
  hintContent: string | null;
  isUnlocked: boolean;
}

export interface PlayerHintsResponse {
  hints: PlayerHintResponse[];
  unlockedCount: number;
  totalCount: number;
}

export async function fetchPlayerHints(): Promise<HintData[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/player/game/hints`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data: PlayerHintsResponse = await response.json();
    return data.hints.map((h) => ({
      levelNumber: h.levelNumber,
      hintContent: h.hintContent,
      isUnlocked: h.isUnlocked,
    }));
  } catch (err) {
    return [];
  }
}
