import React, { useEffect, useState } from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { getMockGameState } from '../../services/mockGameState';
import { fetchPlayerGameState, PlayerGameStateResponse } from '../../services/playerGameStateService';
import { GameHeader } from '../../components/game/GameHeader';
import { LevelProgress } from '../../components/game/LevelProgress';
import { ChallengePanel } from '../../components/game/ChallengePanel';
import { AnswerInput } from '../../components/game/AnswerInput';
import { PartnerStatus } from '../../components/game/PartnerStatus';
import { HintPanel } from '../../components/game/HintPanel';
import { FinalTerminal } from '../../components/game/FinalTerminal';
import { GameStatus } from '../../components/game/GameStatus';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { GameErrorState } from '../../components/game/GameErrorState';
import { Shield, User, Clock, CheckCircle } from 'lucide-react';
import { GameSessionState } from '../../types/game';

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const [serverState, setServerState] = useState<PlayerGameStateResponse | null>(null);
  const [isLoadingServerState, setIsLoadingServerState] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (authStatus === 'AUTHENTICATED' && player) {
      fetchPlayerGameState().then((data) => {
        if (isMounted) {
          setServerState(data);
          setIsLoadingServerState(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [authStatus, player]);

  if (authStatus === 'INITIALIZING' || !player || isLoadingServerState) {
    return <GameLoadingState message="Fetching Live Game State from Server..." />;
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <GameErrorState message="Player session expired or unauthenticated." />;
  }

  // Base mock state for Level 1 demo content
  const mockBase = getMockGameState(player.playerNumber);

  // Merge server-authoritative level progress if available
  const gameState: GameSessionState = {
    ...mockBase,
    currentLevel: serverState ? serverState.currentLevel : mockBase.currentLevel,
    levels: serverState && serverState.levels.length > 0 ? serverState.levels : mockBase.levels,
    isFinalTerminalUnlocked: serverState?.gameStatus === 'FINAL_PASSKEY' || serverState?.gameStatus === 'COMPLETED',
    gameStatusMessage: serverState
      ? serverState.gameStatus === 'NOT_STARTED'
        ? 'Event has not started yet. Waiting for organizer to launch gameplay...'
        : serverState.gameStatus === 'FINAL_PASSKEY'
        ? 'All six levels completed! Final terminal unlocked.'
        : serverState.gameStatus === 'COMPLETED'
        ? 'CodeXcape Completed!'
        : `Level ${serverState.currentLevel} in progress.`
      : mockBase.gameStatusMessage,
  };

  const handleAnswerSubmit = (_answer: string) => {
    setIsSubmitting(true);
    // Placeholder action for Phase 6 (Question/Answer engine in Phase 7)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  // Screen State 1: Event / Game Not Started
  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
        <GameHeader
          player={player}
          currentLevel={1}
          totalLevels={6}
          connectionStatus="CONNECTED"
          onLogout={logout}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-2xl text-center font-mono">
            <Clock className="w-12 h-12 text-cyan-400 animate-pulse mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">Waiting for the event to begin</h1>
            <p className="text-sm text-slate-400 font-sans mb-6">
              Your team identity is verified. The game will automatically unlock when the organizer starts the event.
            </p>
            <div className="inline-block bg-slate-950 px-4 py-2 rounded border border-slate-800 text-xs text-cyan-300">
              Team: <strong>{player.teamCode}</strong> | Player {player.playerNumber}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Screen State 2: Game Completed
  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
        <GameHeader
          player={player}
          currentLevel={6}
          totalLevels={6}
          connectionStatus="CONNECTED"
          onLogout={logout}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="w-full bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-8 shadow-2xl text-center font-mono">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl font-extrabold text-white uppercase mb-2">CodeXcape Completed</h1>
            <p className="text-sm text-emerald-200 font-sans mb-6">
              Congratulations! Your team successfully completed all six challenges and cracked the final terminal.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      <GameHeader
        player={player}
        currentLevel={gameState.currentLevel}
        totalLevels={gameState.totalLevels}
        connectionStatus={gameState.connectionStatus}
        onLogout={logout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <LevelProgress levels={gameState.levels} currentLevel={gameState.currentLevel} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GameStatus message={gameState.gameStatusMessage} />
            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />
            <AnswerInput
              answerType={gameState.challenge.answerType}
              placeholderText={gameState.challenge.placeholderText}
              options={gameState.challenge.options}
              onSubmit={handleAnswerSubmit}
              isSubmitting={isSubmitting}
            />
            <FinalTerminal isUnlocked={gameState.isFinalTerminalUnlocked} />
          </div>

          <div className="space-y-6">
            <PartnerStatus partner={gameState.partner} />
            <HintPanel hints={gameState.hints} />

            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl font-mono">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 text-slate-300">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300">TEAM IDENTITY</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400">Team Code:</span>
                  <span className="text-cyan-400 font-bold tracking-widest text-sm">{player.teamCode}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  player.playerNumber === 1 ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Player 1 {player.playerNumber === 1 ? '(You)' : ''}</span>
                  </div>
                  <span className="text-slate-400">{player.playerNumber === 1 ? player.playerName : 'Teammate'}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  player.playerNumber === 2 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Player 2 {player.playerNumber === 2 ? '(You)' : ''}</span>
                  </div>
                  <span className="text-slate-400">{player.playerNumber === 2 ? player.playerName : 'Teammate'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
