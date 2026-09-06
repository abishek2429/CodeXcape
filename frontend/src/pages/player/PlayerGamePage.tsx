import React, { useEffect, useState } from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
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
import { Shield, Clock, CheckCircle2, Radio, AlertOctagon, Terminal, Cpu, Trophy, RotateCcw } from 'lucide-react';
import { GameSessionState, ChallengeData } from '../../types/game';

import { fetchPlayerHints, usePlayerHint } from '../../services/hintService';
import { HintData } from '../../types/game';
import { fetchStoryline } from '../../services/storyService';
import { StorylineData } from '../../types/story';
import { OpeningBriefingModal } from '../../components/game/OpeningBriefingModal';
import { LevelTransitionModal } from '../../components/game/LevelTransitionModal';
import { InvestigationDossier } from '../../components/game/InvestigationDossier';
import { soundService } from '../../services/soundService';
import './PlayerGamePage.css';

const FRAGMENT_TITLES: Record<number, string> = {
  1: 'SYSTEM TRACE: K-17',
  2: 'HIDDEN ROUTE',
  3: 'GHOST SIGNAL',
  4: 'PROJECT SIX',
  5: 'FAILSAFE PURPOSE',
  6: 'FINAL ACCESS SEQUENCE',
};

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const [serverState, setServerState] = useState<PlayerGameStateResponse | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<PlayerQuestionResponse | null>(null);
  const [hints, setHints] = useState<HintData[]>([]);
  const [storyline, setStoryline] = useState<StorylineData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [transitionInfo, setTransitionInfo] = useState<{
    completedLevel: number;
    nextLevel: number;
    nextName: string;
    fragmentTitle: string;
  } | null>(null);
  const prevLevelRef = React.useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoadError(null);
      const [stateData, storyData] = await Promise.all([
        fetchPlayerGameState(),
        fetchStoryline(),
      ]);

      if (!stateData) {
        throw new Error('AUTHORITATIVE GAME STATE UNAVAILABLE. RECONNECT AND TRY AGAIN.');
      }

      // Check if level has transitioned
      if (prevLevelRef.current !== null && stateData.currentLevel > prevLevelRef.current && stateData.currentLevel <= 6) {
        soundService.playLevelUnlock();
        const completed = prevLevelRef.current;
        const nextLevelObj = stateData.levels?.find(l => l.levelNumber === stateData.currentLevel);
        setTransitionInfo({
          completedLevel: completed,
          nextLevel: stateData.currentLevel,
          nextName: nextLevelObj?.name || `LEVEL 0${stateData.currentLevel}`,
          fragmentTitle: FRAGMENT_TITLES[completed] || `FRAGMENT 0${completed}`,
        });
      }
      prevLevelRef.current = stateData.currentLevel;

      setServerState(stateData);
      setStoryline(storyData);

      // Trigger briefing modal on first session load if not seen
      if (stateData.gameStatus !== 'NOT_STARTED' && !sessionStorage.getItem('codexcape_briefing_seen')) {
        setIsBriefingOpen(true);
      }

      // A waiting or finished team has no current question to load yet.
      if (stateData.gameStatus === 'NOT_STARTED' || stateData.gameStatus === 'FINAL_PASSKEY' || stateData.gameStatus === 'COMPLETED') {
        setLiveQuestion(null);
        setHints([]);
        return;
      }

      const [questionData, hintsData] = await Promise.all([
        fetchCurrentQuestion(),
        fetchPlayerHints(),
      ]);
      setLiveQuestion(questionData);
      setHints(hintsData || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'AUTHORITATIVE GAME STATE UNAVAILABLE. RECONNECT AND TRY AGAIN.');
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

  if (!liveQuestion && serverState.gameStatus !== 'NOT_STARTED' && serverState.gameStatus !== 'FINAL_PASSKEY' && serverState.gameStatus !== 'COMPLETED') {
    return <GameErrorState message="CURRENT COOPERATIVE STAGE DATA IS UNAVAILABLE. RECONNECT AND TRY AGAIN." />;
  }

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
    : {
        levelNumber: serverState.currentLevel,
        title: 'CURRENT STAGE UNAVAILABLE',
        evidence: '',
        instructions: '',
        answerType: 'TEXT',
      };

  const isChallengeCompleted = liveQuestion?.isCompleted ?? false;

  const gameState: GameSessionState = {
    currentLevel: serverState.currentLevel,
    totalLevels: 6,
    levels: serverState.levels,
    challenge: activeChallenge,
    partner: {
      playerNumber: player.playerNumber === 1 ? 2 : 1,
      displayName: 'PARTNER',
      challengeCompleted: false,
      statusMessage: 'Teammate status is synchronized by the server.',
      status: partnerStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
    },
    connectionStatus: wsConnectionStatus === 'CONNECTED' ? 'CONNECTED' : wsConnectionStatus === 'RECONNECTING' ? 'RECONNECTING' : 'DISCONNECTED',
    hints,
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
      : null,
    currentRank: serverState?.currentRank,
  };
  const serverOffset = serverState.serverTime ? new Date(serverState.serverTime).getTime() - clockNow : 0;
  const remainingSeconds = serverState.deadline
    ? Math.max(0, Math.ceil((new Date(serverState.deadline).getTime() - (clockNow + serverOffset)) / 1000))
    : null;
  const formattedRemaining = remainingSeconds === null
    ? '--:--:--'
    : `${String(Math.floor(remainingSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  const handleAnswerSubmit = async (answer: string, interactionPayload?: string) => {
    if (isSubmitting || isChallengeCompleted) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await submitAnswer(answer, interactionPayload);
      if (res.correct) {
        soundService.playAccessGranted();
        setFeedbackIsError(false);
        setFeedbackMsg(res.message || 'ACCESS GRANTED: EVIDENCE VERIFIED. PROTOCOL UNLOCKED.');
        await loadData();
      } else {
        soundService.playAccessDenied();
        setFeedbackIsError(true);
        setFeedbackMsg(res.message || 'ACCESS DENIED: INVALID SEQUENCE. ATTEMPT RECORDED.');
      }
    } catch (err: any) {
      soundService.playAccessDenied();
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

  const handleResetTestTeam = async () => {
    if (!window.confirm('RESET CODEXCAPE-TEST PROGRESS BACK TO LEVEL 1?')) return;
    try {
      setIsLoadingData(true);
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/player/reset-test-team`, {
        method: 'POST',
        credentials: 'include',
      });
      await loadData();
    } catch (err: any) {
      setFeedbackIsError(true);
      setFeedbackMsg('FAILED TO RESET TEST SESSION.');
    } finally {
      setIsLoadingData(false);
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
            {player.teamCode === 'CODEXCAPE-TEST' && (
              <button
                type="button"
                onClick={handleResetTestTeam}
                className="btn btn-secondary mt-m"
                style={{ borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)', fontSize: '11px' }}
              >
                <RotateCcw size={12} style={{ marginRight: '6px' }} />
                RE-INITIALIZE TEST TEAM
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="game-page">
        <GameHeader player={player} currentLevel={6} totalLevels={6} connectionStatus={gameState.connectionStatus} onLogout={logout} onOpenBriefing={() => setIsBriefingOpen(true)} />
        <main className="game-main centered-main" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
          <div className="cyber-panel status-panel success-panel animate-slide-up" style={{ textAlign: 'left', padding: '36px', borderColor: 'var(--status-success)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--status-success)', paddingBottom: '20px', marginBottom: '24px' }}>
              <CheckCircle2 size={48} className="text-success animate-pulse-glow" />
              <div>
                <h1 className="status-title text-success" style={{ fontSize: '24px', margin: 0, fontWeight: 900, letterSpacing: '0.1em' }}>
                  ACCESS GRANTED // CODEXCAPE COMPLETE
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  FINAL OFFICIAL RANK: #{gameState.currentRank !== undefined ? gameState.currentRank : '??'} | TEAM: {player.teamCode}
                </div>
              </div>
            </div>

            {/* System Recovery Diagnostics */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.9,
                color: 'var(--text-primary)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
                marginBottom: '24px',
              }}
            >
              <div style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>
                ACCESS GRANTED<br />
                SYSTEM RECOVERY INITIATED
              </div>
              <div style={{ margin: '12px 0' }}>
                NODE 01 ... <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>RESTORED</span><br />
                NODE 02 ... <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>RESTORED</span><br />
                NODE 03 ... <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>RESTORED</span><br />
                NODE 04 ... <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>RESTORED</span><br />
                NODE 05 ... <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>RESTORED</span><br />
                NODE 06 ... <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>VERIFIED // FAILSAFE DISENGAGED</span>
              </div>
              <div style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>
                NETWORK INTEGRITY: 100%<br />
                CODEXCAPE COMPLETE
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px dashed var(--border-dim)',
                  color: 'var(--accent-cyan)',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  fontWeight: 'bold',
                }}
              >
                YOU FOUND ME.<br /><br />
                BUT THAT WAS NEVER THE REAL TEST.<br /><br />
                THE REAL TEST WAS WHETHER YOU COULD FIND WHAT WAS HIDDEN IN PLAIN SIGHT.
              </div>
            </div>

            {player.teamCode === 'CODEXCAPE-TEST' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleResetTestTeam}
                  className="btn btn-secondary"
                  style={{ borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)', fontSize: '12px' }}
                >
                  <RotateCcw size={14} style={{ marginRight: '6px' }} />
                  RESTART TEST ESCAPE ROOM (LEVEL 1)
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="digital-noise-overlay"></div>
      <GameHeader
        player={player}
        currentLevel={gameState.currentLevel}
        totalLevels={gameState.totalLevels}
        currentStage={liveQuestion?.stageNumber || 1}
        totalStages={liveQuestion?.totalStages || 1}
        formattedRemaining={formattedRemaining}
        remainingSeconds={remainingSeconds}
        currentRank={gameState.currentRank}
        connectionStatus={gameState.connectionStatus}
        onLogout={logout}
        onOpenBriefing={() => setIsBriefingOpen(true)}
      />

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
                puzzleMetadata={gameState.challenge.puzzleMetadata}
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
                <Clock size={14} />
                OFFICIAL TIME REMAINING
              </div>
              <div className="terminal-text text-warning text-lg font-bold">{formattedRemaining}</div>
            </div>
            
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

              {player.teamCode === 'CODEXCAPE-TEST' && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-dim)' }}>
                  <button
                    type="button"
                    onClick={handleResetTestTeam}
                    className="btn btn-secondary"
                    style={{ width: '100%', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <RotateCcw size={12} style={{ marginRight: '6px' }} />
                    <span>RESET TEST STATE (L1 S1)</span>
                  </button>
                </div>
              )}
            </div>

            <InvestigationDossier
              storyline={storyline}
              onOpenBriefing={() => setIsBriefingOpen(true)}
            />

            <HintPanel hints={gameState.hints} currentLevel={gameState.currentLevel} currentStage={liveQuestion?.stageNumber} onUseHint={handleUseHint} />
          </div>
        </div>
      </main>

      <OpeningBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => {
          setIsBriefingOpen(false);
          sessionStorage.setItem('codexcape_briefing_seen', 'true');
        }}
        playerNumber={player.playerNumber}
      />

      <LevelTransitionModal
        isOpen={transitionInfo !== null}
        completedLevelNumber={transitionInfo?.completedLevel || 1}
        nextLevelNumber={transitionInfo?.nextLevel || 2}
        nextLevelName={transitionInfo?.nextName || ''}
        recoveryFragmentTitle={transitionInfo?.fragmentTitle || ''}
        onClose={() => setTransitionInfo(null)}
      />
    </div>
  );
};
