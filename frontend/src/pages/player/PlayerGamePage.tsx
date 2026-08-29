import React, { useEffect, useState } from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { getMockGameState } from '../../services/mockGameState';
import { fetchPlayerGameState, PlayerGameStateResponse } from '../../services/playerGameStateService';
import { fetchCurrentQuestion, submitAnswer, PlayerQuestionResponse } from '../../services/questionService';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
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
import { Shield, User, Clock, CheckCircle, Radio } from 'lucide-react';
import { GameSessionState, ChallengeData } from '../../types/game';

import { fetchPlayerHints } from '../../services/hintService';
import { HintData } from '../../types/game';

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const [serverState, setServerState] = useState<PlayerGameStateResponse | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<PlayerQuestionResponse | null>(null);
  const [hints, setHints] = useState<HintData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  const loadData = async () => {
    try {
      const [stateData, questionData, hintsData] = await Promise.all([
        fetchPlayerGameState(),
        fetchCurrentQuestion(),
        fetchPlayerHints(),
      ]);
      setServerState(stateData);
      setLiveQuestion(questionData);
      if (hintsData && hintsData.length > 0) {
        setHints(hintsData);
      }
    } catch (err) {
      // Gracefully handle network errors
    } finally {
      setIsLoadingData(false);
    }
  };

  const { partnerStatus, wsConnectionStatus, latestNotification } = useGameWebSocket({
    teamId: player?.teamId,
    playerNumber: player?.playerNumber,
    onRefreshData: loadData,
  });

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED' && player) {
      loadData();
    }
  }, [authStatus, player]);

  if (authStatus === 'INITIALIZING' || !player || isLoadingData) {
    return <GameLoadingState message="Fetching Player Challenge & Game State..." />;
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <GameErrorState message="Player session expired or unauthenticated." />;
  }

  // Base fallback mock state
  const mockBase = getMockGameState(player.playerNumber);

  // Build live challenge data from server question response if available
  const activeChallenge: ChallengeData = liveQuestion
    ? {
        levelNumber: liveQuestion.levelNumber,
        title: liveQuestion.puzzleContext ? liveQuestion.puzzleContext : `Level ${liveQuestion.levelNumber} - Player ${player.playerNumber} Challenge`,
        puzzleContext: liveQuestion.puzzleContext,
        description: liveQuestion.questionContent,
        answerType: liveQuestion.answerType,
        placeholderText: liveQuestion.answerType === 'NUMERIC' ? 'Enter numeric answer...' : 'Enter your solution...',
      }
    : mockBase.challenge;

  const isChallengeCompleted = liveQuestion?.isCompleted ?? false;

  // Merge live server level progress
  const gameState: GameSessionState = {
    ...mockBase,
    currentLevel: serverState ? serverState.currentLevel : mockBase.currentLevel,
    levels: serverState && serverState.levels.length > 0 ? serverState.levels : mockBase.levels,
    challenge: activeChallenge,
    partner: {
      ...mockBase.partner,
      status: partnerStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
    },
    connectionStatus: wsConnectionStatus === 'CONNECTED' ? 'CONNECTED' : wsConnectionStatus === 'RECONNECTING' ? 'RECONNECTING' : 'DISCONNECTED',
    hints: hints.length > 0 ? hints : mockBase.hints,
    isFinalTerminalUnlocked: serverState?.gameStatus === 'FINAL_PASSKEY' || serverState?.gameStatus === 'COMPLETED',
    gameStatusMessage: isChallengeCompleted
      ? 'Correct ✓ Your challenge is complete. Waiting for your teammate...'
      : serverState
      ? serverState.gameStatus === 'NOT_STARTED'
        ? 'Event has not started yet. Waiting for organizer to launch gameplay...'
        : serverState.gameStatus === 'FINAL_PASSKEY'
        ? 'All six levels completed! Final terminal unlocked.'
        : serverState.gameStatus === 'COMPLETED'
        ? 'CodeXcape Completed!'
        : `Level ${serverState.currentLevel} in progress.`
      : mockBase.gameStatusMessage,
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (isSubmitting || isChallengeCompleted) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await submitAnswer(answer);
      if (res.correct) {
        setFeedbackIsError(false);
        setFeedbackMsg(res.message || 'Correct! Your challenge is complete.');
        // Refresh question and game state
        await loadData();
      } else {
        setFeedbackIsError(true);
        setFeedbackMsg(res.message || 'Incorrect answer. Try again.');
      }
    } catch (err: any) {
      setFeedbackIsError(true);
      setFeedbackMsg(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsLoadingData(false);
      setIsSubmitting(false);
    }
  };

  // Screen State 1: Event / Game Not Started
  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
        <GameHeader
          player={player}
          currentLevel={1}
          totalLevels={6}
          connectionStatus={gameState.connectionStatus}
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
          connectionStatus={gameState.connectionStatus}
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

            {/* Real-time WebSocket Notification Alert */}
            {latestNotification && (
              <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 font-mono text-xs flex items-center gap-3 shadow-lg animate-pulse">
                <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{latestNotification}</span>
              </div>
            )}

            {/* Answer Feedback Alert Banner */}
            {feedbackMsg && (
              <div
                className={`p-4 rounded-xl font-mono text-xs flex items-center gap-3 shadow-lg animate-fade-in ${
                  feedbackIsError
                    ? 'bg-red-950/60 border border-red-500/40 text-red-200'
                    : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                }`}
              >
                <CheckCircle className={`w-5 h-5 shrink-0 ${feedbackIsError ? 'text-red-400' : 'text-emerald-400'}`} />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {isChallengeCompleted ? (
              <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-6 shadow-xl font-mono text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase">
                  <CheckCircle className="w-4 h-4" />
                  <span>Your Challenge Completed</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  You have solved your question for Level {gameState.currentLevel}. Waiting for your teammate to complete their challenge.
                </p>
              </div>
            ) : (
              <AnswerInput
                answerType={gameState.challenge.answerType}
                placeholderText={gameState.challenge.placeholderText}
                options={gameState.challenge.options}
                onSubmit={handleAnswerSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            <FinalTerminal
              isUnlocked={gameState.isFinalTerminalUnlocked}
              isCompleted={serverState?.gameStatus === 'COMPLETED'}
              onSuccess={loadData}
            />
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
