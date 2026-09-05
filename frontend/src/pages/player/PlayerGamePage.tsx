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

import { fetchPlayerHints, usePlayerHint } from '../../services/hintService';
import { HintData } from '../../types/game';
import './PlayerGamePage.css';

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const [serverState, setServerState] = useState<PlayerGameStateResponse | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<PlayerQuestionResponse | null>(null);
  const [hints, setHints] = useState<HintData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  const loadData = async () => {
    try {
      setLoadError(null);
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
      setLoadError('AUTHORITATIVE GAME STATE UNAVAILABLE. RECONNECT AND TRY AGAIN.');
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
    return <GameLoadingState message="INITIALIZING CONSOLE TELEMETRY..." />;
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <GameErrorState message="SESSION EXPIRED OR UNAUTHENTICATED. PLEASE RE-ENTER CREDENTIALS." />;
  }

  if (loadError || !serverState) {
    return <GameErrorState message={loadError || 'AUTHORITATIVE GAME STATE UNAVAILABLE.'} />;
  }

  const mockBase = getMockGameState(player.playerNumber);

  const activeChallenge: ChallengeData = liveQuestion
    ? {
        levelNumber: liveQuestion.levelNumber,
        stageNumber: liveQuestion.stageNumber,
        totalStages: liveQuestion.totalStages,
        title: liveQuestion.puzzleContext ? liveQuestion.puzzleContext : `TIER 0${liveQuestion.levelNumber} CHALLENGE`,
        puzzleContext: liveQuestion.puzzleContext,
        evidence: liveQuestion.evidence,
        instructions: liveQuestion.instructions,
        puzzleMetadata: liveQuestion.puzzleMetadata,
        answerType: liveQuestion.answerType,
        placeholderText: liveQuestion.answerType === 'NUMERIC' ? '> INPUT NUMERIC SOLUTION_' : '> ENTER SOLUTION_',
      }
    : mockBase.challenge;

  const isChallengeCompleted = liveQuestion?.isCompleted ?? false;

  if (!liveQuestion && serverState.gameStatus !== 'NOT_STARTED' && serverState.gameStatus !== 'FINAL_PASSKEY' && serverState.gameStatus !== 'COMPLETED') {
    return <GameErrorState message="CURRENT COOPERATIVE STAGE DATA IS UNAVAILABLE. RECONNECT AND TRY AGAIN." />;
  }

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
      ? `STAGE ${liveQuestion?.stageNumber || 1} VERIFIED: WAITING FOR PARTNER NODE SYNCHRONIZATION...`
      : serverState
      ? serverState.gameStatus === 'NOT_STARTED'
        ? 'EVENT NOT STARTED. STANDBY.'
        : serverState.gameStatus === 'FINAL_PASSKEY'
        ? 'ALL TIERS COMPLETED. MASTER TERMINAL OVERRIDE ACTIVE.'
        : serverState.gameStatus === 'COMPLETED'
        ? 'SYSTEM BREACHED. CODEXCAPE PROTOCOL SUCCESSFUL.'
        : `TIER 0${serverState.currentLevel} ACTIVE.`
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
        setFeedbackMsg(res.message || 'SOLUTION ACCEPTED: NODE VERIFIED.');
        await loadData();
      } else {
        setFeedbackIsError(true);
        setFeedbackMsg(res.message || 'ACCESS DENIED: INCORRECT SOLUTION.');
      }
    } catch (err: any) {
      setFeedbackIsError(true);
      setFeedbackMsg(err.message || 'TRANSMISSION ERROR. RE-SUBMIT REQUIRED.');
    } finally {
      setIsLoadingData(false);
      setIsSubmitting(false);
    }
  };

  const handleUseHint = async (hintNumber: number) => {
    try {
      await usePlayerHint(gameState.currentLevel, liveQuestion?.stageNumber || 1, hintNumber);
      await loadData();
    } catch (err: any) {
      setFeedbackIsError(true);
      setFeedbackMsg(err.message || 'HINT REQUEST REJECTED.');
    }
  };

  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return (
      <div className="game-page">
        <GameHeader player={player} currentLevel={1} totalLevels={6} connectionStatus={gameState.connectionStatus} onLogout={logout} />
        <main className="game-main centered-main">
          <div className="cyber-panel status-panel">
            <Clock size={48} className="status-icon animate-pulse text-cyan" />
            <h1 className="status-title">WAITING FOR LAUNCH</h1>
            <p className="terminal-text text-muted">
              &gt; IDENTITY VERIFIED. WAITING FOR ORGANIZER TO RELEASE LOCKS_
            </p>
            <div className="badge badge-cyan mt-l">
              TEAM: {player.teamCode} | NODE 0{player.playerNumber}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="game-page">
        <GameHeader player={player} currentLevel={6} totalLevels={6} connectionStatus={gameState.connectionStatus} onLogout={logout} />
        <main className="game-main centered-main">
          <div className="cyber-panel status-panel success-panel animate-slide-up">
            <CheckCircle2 size={64} className="status-icon text-success animate-pulse-glow" />
            <h1 className="status-title text-success">CODEXCAPE COMPLETED</h1>
            <p className="terminal-text text-success" style={{ opacity: 0.8 }}>
              &gt; PROTOCOL SUCCESSFUL. SYSTEM BREACHED.<br/>
              &gt; FINAL RANK: #{gameState.currentRank || '??'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="digital-noise-overlay"></div>
      <GameHeader player={player} currentLevel={gameState.currentLevel} totalLevels={gameState.totalLevels} connectionStatus={gameState.connectionStatus} onLogout={logout} />

      <main className="game-main">
        <LevelProgress levels={gameState.levels} currentLevel={gameState.currentLevel} />

        <div className="game-grid animate-slide-up">
          {/* Main Content Column */}
          <div className="panel-container">
            <GameStatus message={gameState.gameStatusMessage} />

            {latestNotification && (
              <div className="cyber-panel notification-banner animate-pulse">
                <Radio size={16} />
                <span>{latestNotification}</span>
              </div>
            )}

            {feedbackMsg && (
              <div className={`cyber-panel notification-banner animate-fade-in ${feedbackIsError ? 'banner-error' : 'banner-success'}`}>
                {feedbackIsError ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
                <span className="terminal-text">{feedbackMsg}</span>
              </div>
            )}

            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {isChallengeCompleted ? (
              <div className="cyber-panel verified-panel">
                <div className="badge badge-success mb-m">
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                  NODE VERIFIED
                </div>
                <p className="terminal-text text-muted">
                  &gt; AWAITING PARTNER NODE SYNCHRONIZATION FOR TIER 0{gameState.currentLevel}_
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

          {/* Sidebar Column */}
          <div className="panel-container sidebar-container">
            <PartnerStatus partner={gameState.partner} />
            
            <div className="cyber-panel team-matrix-panel">
              <div className="panel-header terminal-text">
                <Shield size={14} />
                TEAM IDENTITY MATRIX
              </div>

              <div className="matrix-row">
                <span className="terminal-text text-muted">TEAM CODE:</span>
                <span className="terminal-text font-bold text-cyan">{player.teamCode}</span>
              </div>

              {gameState.currentRank !== undefined && (
                <div className="matrix-row row-warning">
                  <span className="terminal-text text-warning flex items-center gap-2 font-bold">
                    <Trophy size={14} /> CURRENT RANK
                  </span>
                  <span className="terminal-text text-warning text-lg font-bold">#{gameState.currentRank}</span>
                </div>
              )}

              <div className={`matrix-row ${player.playerNumber === 1 ? 'row-cyan' : ''}`}>
                <div className="flex items-center gap-2 terminal-text">
                  <Terminal size={14} />
                  <span>NODE 01 {player.playerNumber === 1 ? '(YOU)' : ''}</span>
                </div>
                <span className="text-muted" style={{ fontSize: '11px' }}>{player.playerNumber === 1 ? player.playerName : 'PARTNER'}</span>
              </div>

              <div className={`matrix-row ${player.playerNumber === 2 ? 'row-purple' : ''}`}>
                <div className="flex items-center gap-2 terminal-text">
                  <Cpu size={14} />
                  <span>NODE 02 {player.playerNumber === 2 ? '(YOU)' : ''}</span>
                </div>
                <span className="text-muted" style={{ fontSize: '11px' }}>{player.playerNumber === 2 ? player.playerName : 'PARTNER'}</span>
              </div>
            </div>

            <HintPanel hints={gameState.hints} currentLevel={gameState.currentLevel} currentStage={liveQuestion?.stageNumber} onUseHint={handleUseHint} />
          </div>
        </div>
      </main>
    </div>
  );
};
