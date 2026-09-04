import { GameSessionState } from '../types/game';

export function getMockGameState(playerNumber: number = 1): GameSessionState {
  const isP1 = playerNumber === 1;

  return {
    currentLevel: 1,
    totalLevels: 6,
    levels: [
      { levelNumber: 1, name: 'Level 1: System Breaker', status: 'CURRENT' },
      { levelNumber: 2, name: 'Level 2: Signal Decryption', status: 'LOCKED' },
      { levelNumber: 3, name: 'Level 3: Memory Dump', status: 'LOCKED' },
      { levelNumber: 4, name: 'Level 4: Network Hijack', status: 'LOCKED' },
      { levelNumber: 5, name: 'Level 5: Cryptographic Cipher', status: 'LOCKED' },
      { levelNumber: 6, name: 'Level 6: Core Overdrive', status: 'LOCKED' },
    ],
    challenge: {
      levelNumber: 1,
      title: 'System Breaker - Core Authentication Override',
      evidence: isP1
        ? 'NODE 192.168.1.10 TELEMETRY LOGS\nSSH port integer detected.'
        : 'NODE BUFFER SIGNAL STREAM\n0x4142',
      instructions: isP1
        ? 'Locate the open SSH port integer. Submit the numeric port value.'
        : 'Convert the hexadecimal signal stream into ASCII.',
      answerType: isP1 ? 'NUMERIC' : 'TEXT',
      placeholderText: isP1 ? 'e.g. 22' : 'e.g. AB',
    },
    partner: {
      playerNumber: isP1 ? 2 : 1,
      displayName: isP1 ? 'Player 2 (Analyzer)' : 'Player 1 (Operator)',
      status: 'CONNECTED',
      challengeCompleted: false,
      statusMessage: 'Teammate is active on Level 1',
    },
    connectionStatus: 'CONNECTED',
    gameStatusMessage: 'Level 1 in progress. Solve your challenge to proceed.',
    hints: [
      { levelNumber: 1, hintContent: null, isUnlocked: false },
      { levelNumber: 2, hintContent: null, isUnlocked: false },
      { levelNumber: 3, hintContent: null, isUnlocked: false },
      { levelNumber: 4, hintContent: null, isUnlocked: false },
      { levelNumber: 5, hintContent: null, isUnlocked: false },
      { levelNumber: 6, hintContent: null, isUnlocked: false },
    ],
    isFinalTerminalUnlocked: false,
  };
}
