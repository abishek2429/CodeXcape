import { getAuthHeaders } from './playerAuthService';

export interface RiddleItemState {
  riddleIndex: number;
  levelNumber: number;
  status: 'LOCKED' | 'UNLOCKED' | 'SOLVED';
  solvedDigit?: string | null;
}

export interface RiddleBoardState {
  totalRiddles: number;
  unlockedCount: number;
  solvedCount: number;
  allRiddlesSolved: boolean;
  riddles: RiddleItemState[];
}

export interface RiddleSubmissionResponse {
  riddleIndex: number;
  status: 'SOLVED' | 'INCORRECT' | 'RATE_LIMITED' | 'LOCKED';
  message: string;
  solvedDigit?: string;
  allRiddlesSolved?: boolean;
}

export async function fetchRiddleBoardState(): Promise<RiddleBoardState> {
  const url = `${import.meta.env.VITE_API_URL || ''}/api/player/riddles`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch riddle board state.');
  }

  return response.json();
}

export async function submitRiddleDigit(
  riddleIndex: number,
  digit: string
): Promise<RiddleSubmissionResponse> {
  const url = `${import.meta.env.VITE_API_URL || ''}/api/player/riddles/submit`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({
      riddleIndex,
      digit: digit.trim(),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit riddle answer.');
  }

  return response.json();
}
