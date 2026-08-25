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
}

export type AuthStatus = 'INITIALIZING' | 'NOT_AUTHENTICATED' | 'AUTHENTICATED' | 'SESSION_EXPIRED' | 'LOGGED_OUT';
