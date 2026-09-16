import { AnswerType } from '../types/game';
import { getAuthHeaders } from './playerAuthService';

export interface PlayerQuestionResponse {
  levelNumber: number;
  stageNumber: number;
  totalStages: number;
  questionId: number;
  puzzleContext?: string;
  evidence: string;
  instructions: string;
  puzzleMetadata?: string;
  answerType: AnswerType;
  isCompleted: boolean;
  partnerCompleted?: boolean;
  attemptCount: number;
}

export interface AnswerSubmissionResponse {
  correct: boolean;
  isCompleted: boolean;
  stageCompleted?: boolean;
  levelCompleted?: boolean;
  stageNumber?: number;
  nextStageNumber?: number;
  currentLevel?: number;
  finalScore?: number;
  baseScore?: number;
  stateVersion?: number;
  message: string;
}

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/player/game/current` : '/api/player/game/current';

export async function fetchCurrentQuestion(retryCount: number = 2): Promise<PlayerQuestionResponse | null> {
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/question`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        return await response.json();
      }

      // If transitioning (400 or 503) and retries remain, wait briefly and retry
      if ((response.status === 400 || response.status === 503) && attempt < retryCount) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }

      return null;
    } catch (err) {
      if (attempt < retryCount) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function submitAnswer(
  answer: string,
  interactionPayload?: string,
  levelNumber?: number,
  stageNumber?: number
): Promise<AnswerSubmissionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/answer`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ answer, interactionPayload, levelNumber, stageNumber }),
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
