export type TeamStatus = 'REGISTERED' | 'ACTIVE' | 'COMPLETED' | 'DISQUALIFIED';
export type PlayerStatus = 'INACTIVE' | 'CONNECTED' | 'DISCONNECTED';

export interface Player {
  id: number;
  playerNumber: number;
  displayName: string;
  status: PlayerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  eventId: number;
  teamCode: string;
  teamName: string;
  status: TeamStatus;
  player1DisplayName: string;
  player2DisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetail {
  id: number;
  eventId: number;
  eventName: string;
  teamCode: string;
  teamName: string;
  status: TeamStatus;
  completedAt?: string;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  teamName: string;
  player1DisplayName: string;
  player2DisplayName: string;
  customTeamCode?: string;
}

export interface UpdateTeamPayload {
  teamName: string;
  status: TeamStatus;
  player1DisplayName: string;
  player2DisplayName: string;
}
