import { AnswerType } from '../types/game';

export interface PlayerQuestionResponse {
  levelNumber: number;
  questionId: number;
  puzzleContext?: string;
  evidence: string;
  instructions: string;
  answerType: AnswerType;
  isCompleted: boolean;
  attemptCount: number;
}

export interface AnswerSubmissionResponse {
  correct: boolean;
  isCompleted: boolean;
  message: string;
}

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/player/game/current` : '/api/player/game/current';

export async function fetchCurrentQuestion(): Promise<PlayerQuestionResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/question`, {
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

export async function submitAnswer(answer: string): Promise<AnswerSubmissionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ answer }),
    });
  } catch (err) {
    throw new Error('Unable to connect to the game server. Please try again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit answer');
  }

  return response.json();
}
