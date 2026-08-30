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
import './PlayerGamePage.css';
import { Card } from '../../components/ui/Card';

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

  const mockBase = getMockGameState(player.playerNumber);

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

  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return (
      <div className="game-page">
        <GameHeader player={player} currentLevel={1} totalLevels={6} connectionStatus={gameState.connectionStatus} onLogout={logout} />
        <main className="game-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Clock size={48} color="var(--accent-cyan)" style={{ margin: '0 auto 20px auto' }} className="animate-pulse" />
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>WAITING FOR EVENT INITIALIZATION</h1>
            <p className="text-secondary font-mono" style={{ marginBottom: '24px' }}>
              Your team identity is verified. The console will automatically activate when the organizer releases the level locks.
            </p>
            <div className="team-pill-code" style={{ display: 'inline-block' }}>
              TEAM: {player.teamCode} | PLAYER 0{player.playerNumber}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="game-page">
        <GameHeader player={player} currentLevel={6} totalLevels={6} connectionStatus={gameState.connectionStatus} onLogout={logout} />
        <main className="game-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ textAlign: 'center', padding: '40px', borderColor: 'var(--status-success)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle2 size={64} color="var(--status-success)" style={{ margin: '0 auto 24px auto' }} />
            <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>CODEXCAPE COMPLETED</h1>
            <p className="font-mono text-success" style={{ marginBottom: '24px' }}>
              Congratulations! Your team successfully completed all six technical challenges and cracked the final override terminal.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="game-page">
      <GameHeader player={player} currentLevel={gameState.currentLevel} totalLevels={gameState.totalLevels} connectionStatus={gameState.connectionStatus} onLogout={logout} />

      <main className="game-main">
        <LevelProgress levels={gameState.levels} currentLevel={gameState.currentLevel} />

        <div className="game-grid">
          <div className="panel-container">
            <GameStatus message={gameState.gameStatusMessage} />

            {latestNotification && (
              <div className="notification-banner animate-pulse">
                <Radio size={16} />
                <span>{latestNotification}</span>
              </div>
            )}

            {feedbackMsg && (
              <div className="notification-banner animate-fade-in" style={{ 
                backgroundColor: feedbackIsError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                borderColor: feedbackIsError ? 'var(--status-error)' : 'var(--status-success)',
                color: feedbackIsError ? '#fecdd3' : '#a7f3d0'
              }}>
                {feedbackIsError ? <AlertOctagon size={20} /> : <CheckCircle2 size={20} />}
                <span style={{ fontWeight: 'bold' }}>{feedbackMsg}</span>
              </div>
            )}

            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {isChallengeCompleted ? (
              <Card className="verified-panel">
                <div className="verified-badge">
                  <CheckCircle2 size={16} />
                  YOUR NODE VERIFIED
                </div>
                <p className="font-mono text-secondary">
                  You have solved your question for Tier 0{gameState.currentLevel}. Waiting for your partner node to complete their challenge.
                </p>
              </Card>
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

          <div className="panel-container">
            <PartnerStatus partner={gameState.partner} />
            <HintPanel hints={gameState.hints} />

            <Card className="team-matrix-panel">
              <div className="team-matrix-header">
                <Shield size={14} color="var(--accent-cyan)" />
                TEAM MATRIX IDENTITY
              </div>

              <div className="matrix-row">
                <span className="text-secondary">TEAM CODE:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{player.teamCode}</span>
              </div>

              {gameState.currentRank !== undefined && (
                <div className="matrix-row" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--status-warning)' }}>
                  <span style={{ color: 'var(--status-warning)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={14} /> CURRENT RANK
                  </span>
                  <span style={{ color: 'var(--status-warning)', fontWeight: '900', fontSize: '16px' }}>#{gameState.currentRank}</span>
                </div>
              )}

              <div className={`matrix-row ${player.playerNumber === 1 ? 'matrix-row-p1' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={14} />
                  <strong>PLAYER 01 {player.playerNumber === 1 ? '(YOU)' : ''}</strong>
                </div>
                <span className="text-secondary">{player.playerNumber === 1 ? player.playerName : 'PARTNER'}</span>
              </div>

              <div className={`matrix-row ${player.playerNumber === 2 ? 'matrix-row-p2' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={14} />
                  <strong>PLAYER 02 {player.playerNumber === 2 ? '(YOU)' : ''}</strong>
                </div>
                <span className="text-secondary">{player.playerNumber === 2 ? player.playerName : 'PARTNER'}</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
