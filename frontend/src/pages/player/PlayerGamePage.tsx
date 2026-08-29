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
import { Shield, Clock, CheckCircle2, Radio, AlertOctagon, Terminal, Cpu, Trophy } from 'lucide-react';
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
    return <GameLoadingState message="INITIALIZING CONSOLE TELEMETRY & CHALLENGE..." />;
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <GameErrorState message="Player session expired or unauthenticated. Please re-enter credentials." />;
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
        placeholderText: liveQuestion.answerType === 'NUMERIC' ? 'Enter numeric solution...' : 'ENTER SOLUTION_',
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
      ? '✓ NODE VERIFIED: Challenge completed. Synchronizing with partner node...'
      : serverState
      ? serverState.gameStatus === 'NOT_STARTED'
        ? 'Event has not started yet. Waiting for organizer to launch gameplay...'
        : serverState.gameStatus === 'FINAL_PASSKEY'
        ? 'All six levels completed! Master emergency terminal override is now active.'
        : serverState.gameStatus === 'COMPLETED'
        ? 'CodeXcape Protocol neutralised! Escape successful.'
        : `Tier 0${serverState.currentLevel} challenge in progress.`
      : mockBase.gameStatusMessage,
    currentRank: serverState?.currentRank,
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (isSubmitting || isChallengeCompleted) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await submitAnswer(answer);
      if (res.correct) {
        setFeedbackIsError(false);
        setFeedbackMsg(res.message || '✓ SOLUTION ACCEPTED: Node verified successfully.');
        // Refresh question and game state
        await loadData();
      } else {
        setFeedbackIsError(true);
        setFeedbackMsg(res.message || '× ACCESS DENIED: Incorrect solution. Try again.');
      }
    } catch (err: any) {
      setFeedbackIsError(true);
      setFeedbackMsg(err.message || 'Transmission error. Please re-submit.');
    } finally {
      setIsLoadingData(false);
      setIsSubmitting(false);
    }
  };

  // Screen State 1: Event / Game Not Started
  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return (
      <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans">
        <GameHeader
          player={player}
          currentLevel={1}
          totalLevels={6}
          connectionStatus={gameState.connectionStatus}
          onLogout={logout}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="w-full cyber-panel hud-corner p-10 rounded-3xl text-center font-mono border border-cyan-500/30 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-pulse-glow">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-white uppercase mb-2">WAITING FOR EVENT INITIALIZATION</h1>
            <p className="text-xs text-slate-400 font-mono mb-6 max-w-md mx-auto">
              Your team identity is verified. The console will automatically activate when the organizer releases the level locks.
            </p>
            <div className="inline-block bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs text-cyan-300">
              TEAM: <strong>{player.teamCode}</strong> | PLAYER 0{player.playerNumber}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Screen State 2: Game Completed
  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans">
        <GameHeader
          player={player}
          currentLevel={6}
          totalLevels={6}
          connectionStatus={gameState.connectionStatus}
          onLogout={logout}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="w-full cyber-panel hud-corner p-10 rounded-3xl border-2 border-emerald-500/40 text-center font-mono shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-black font-heading text-white uppercase mb-2">CODEXCAPE COMPLETED</h1>
            <p className="text-xs text-emerald-300 font-mono mb-6 max-w-md mx-auto">
              Congratulations! Your team successfully completed all six technical challenges and cracked the final override terminal.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans">
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
              <div className="p-4 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 font-mono text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-pulse">
                <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{latestNotification}</span>
              </div>
            )}

            {/* Answer Feedback Alert Banner */}
            {feedbackMsg && (
              <div
                className={`p-4 rounded-2xl font-mono text-xs flex items-center gap-3 shadow-xl animate-fade-in ${
                  feedbackIsError
                    ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200 shadow-rose-950/30'
                    : 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 shadow-emerald-950/30'
                }`}
              >
                {feedbackIsError ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <span className="font-semibold">{feedbackMsg}</span>
              </div>
            )}

            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {isChallengeCompleted ? (
              <div className="cyber-panel border border-emerald-500/40 rounded-2xl p-6 shadow-xl font-mono text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>YOUR NODE VERIFIED</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  You have solved your question for Tier 0{gameState.currentLevel}. Waiting for your partner node to complete their challenge.
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

            {/* Team Identity Card */}
            <div className="cyber-panel p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl font-mono">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 text-slate-300">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300">TEAM MATRIX IDENTITY</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">TEAM CODE:</span>
                  <span className="text-cyan-400 font-bold tracking-widest text-sm">{player.teamCode}</span>
                </div>

                {gameState.currentRank !== undefined && (
                  <div className="flex justify-between items-center bg-purple-950/30 p-3 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <span className="text-purple-300 font-bold text-xs tracking-widest flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" /> CURRENT RANK
                    </span>
                    <span className="text-amber-400 font-black tracking-widest text-lg">#{gameState.currentRank}</span>
                  </div>
                )}

                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  player.playerNumber === 1 ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200' : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold">PLAYER 01 {player.playerNumber === 1 ? '(YOU)' : ''}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{player.playerNumber === 1 ? player.playerName : 'PARTNER'}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  player.playerNumber === 2 ? 'bg-purple-950/40 border-purple-500/50 text-purple-200' : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold">PLAYER 02 {player.playerNumber === 2 ? '(YOU)' : ''}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{player.playerNumber === 2 ? player.playerName : 'PARTNER'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

