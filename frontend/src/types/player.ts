export interface PlayerLoginRequest {
  teamCode: string;
  playerNumber: number;
}

export interface PlayerInfo {
  teamCode: string;
  teamName: string;
  playerNumber: number;
  playerName: string;
  status: string;
  eventId: number;
  teamId: number;
  playerId: number;
  isReady?: boolean;
  gameState?: string;
  eventStatus?: string;
  eventStartedAt?: string | null;
  teammateName?: string | null;
  teammateNumber?: number | null;
  teammateLoggedIn?: boolean;
  teammateReady?: boolean;

  // Authentication token fallback
  sessionToken?: string;
}

export type AuthStatus = 'INITIALIZING' | 'NOT_AUTHENTICATED' | 'AUTHENTICATED' | 'SESSION_EXPIRED' | 'LOGGED_OUT';
