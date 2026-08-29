export interface FinalPasskeyResponse {
  status: 'COMPLETED' | 'INCORRECT' | 'FINAL_NOT_AVAILABLE' | 'ALREADY_COMPLETED';
  message: string;
  completedAt?: string;
}

export async function submitFinalPasskey(passkey: string): Promise<FinalPasskeyResponse> {
  let response: Response;
  try {
    response = await fetch('/api/player/game/final-passkey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ passkey }),
    });
  } catch (err) {
    throw new Error('Unable to connect to the game server. Please try again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit final passkey.');
  }

  return response.json();
}
