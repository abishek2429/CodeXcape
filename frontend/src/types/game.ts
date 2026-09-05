export type LevelStatus = 'COMPLETED' | 'CURRENT' | 'LOCKED';

export type AnswerType = 'TEXT' | 'NUMERIC' | 'MULTIPLE_CHOICE' | 'CODE';

export type PartnerConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'WAITING';

export type SystemConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING';

export interface LevelProgressItem {
  levelNumber: number;
  name: string;
  status: LevelStatus;
}

export interface ChallengeData {
  levelNumber: number;
  stageNumber?: number;
  totalStages?: number;
  title: string;
  puzzleContext?: string;
  evidence: string;
  instructions: string;
  puzzleMetadata?: string;
  answerType: AnswerType;
  options?: string[];
  placeholderText?: string;
}

export interface PartnerStatusData {
  playerNumber: number;
  displayName: string;
  status: PartnerConnectionStatus;
  challengeCompleted: boolean;
  statusMessage?: string;
}

export interface HintData {
  levelNumber: number;
  hintNumber?: number;
  hintContent: string | null;
  isUnlocked: boolean;
}

export interface GameSessionState {
  currentLevel: number;
  totalLevels: number;
  levels: LevelProgressItem[];
  challenge: ChallengeData;
  partner: PartnerStatusData;
  connectionStatus: SystemConnectionStatus;
  gameStatusMessage: string | null;
  hints: HintData[];
  isFinalTerminalUnlocked: boolean;
  currentRank?: number;
}
