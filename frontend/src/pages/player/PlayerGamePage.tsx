import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { fetchPlayerGameState, PlayerGameStateResponse, fetchPlayerScore, PlayerScoreResponse } from '../../services/playerGameStateService';
import { fetchCurrentQuestion, submitAnswer, PlayerQuestionResponse } from '../../services/questionService';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import { GameHeader } from '../../components/game/GameHeader';
import { LevelProgress } from '../../components/game/LevelProgress';
import { ChallengePanel } from '../../components/game/ChallengePanel';
import { AnswerInput } from '../../components/game/AnswerInput';
import { PartnerStatus } from '../../components/game/PartnerStatus';
import { HintPanel } from '../../components/game/HintPanel';
import { FinalDeductionTerminal } from '../../components/game/FinalDeductionTerminal';
import { MysteryBoard } from '../../components/game/MysteryBoard';
import { RiddleRevealModal } from '../../components/game/RiddleRevealModal';
import { GameStatus } from '../../components/game/GameStatus';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { GameErrorState } from '../../components/game/GameErrorState';
import { Shield, ShieldAlert, CheckCircle2, Radio, AlertOctagon, Terminal, Cpu, Trophy } from 'lucide-react';
import { GameSessionState, ChallengeData } from '../../types/game';
import { useAntiCheat } from '../../hooks/useAntiCheat';

import { fetchPlayerHints, usePlayerHint } from '../../services/hintService';
import { HintData } from '../../types/game';
import { fetchStoryline } from '../../services/storyService';
import { StorylineData } from '../../types/story';
import { OpeningBriefingModal } from '../../components/game/OpeningBriefingModal';
import { LevelTransitionModal } from '../../components/game/LevelTransitionModal';
import { CoreEntryModal } from '../../components/game/CoreEntryModal';
import { FinalRestorationModal } from '../../components/game/FinalRestorationModal';
import { CinematicStoryModal } from '../../components/game/CinematicStoryModal';
import { fetchCurrentStory, skipStory, completeStory } from '../../services/storySyncService';
import { STORY_SEQUENCES, StorySequence } from '../../config/storyConfig';
import { CodeXcapeBackground } from '../../components/cinematic/CodeXcapeBackground';
import { SpotlightCard } from '../../components/cinematic/SpotlightCard';
import { SystemInitializationLoader } from '../../components/cinematic/SystemInitializationLoader';
import { soundService } from '../../services/soundService';
import { voiceNarratorService } from '../../services/voiceNarratorService';
import './PlayerGamePage.css';

const FRAGMENT_TITLES: Record<number, string> = {
  1: 'PROGRAMMING CORE RESTORED',
  2: 'DATA STRUCTURES & ALGORITHMS UNLOCKED',
  3: 'SYSTEMS & NETWORKS SECURED',
  4: 'DATABASES & VERSION CONTROL VERIFIED',
  5: 'CRYPTOGRAPHY & SECURITY ACTIVE',
  6: 'FINAL PROTOCOL UNLOCKED',
};

export type LevelTransitionStage =
  | 'IDLE'
  | 'LEVEL_COMPLETED'
  | 'BLACK_TRANSITION_ACTIVE'
  | 'BLACK_TRANSITION_COMPLETE'
  | 'NEXT_LEVEL_STORY'
  | 'NEXT_LEVEL_STORY_COMPLETE'
  | 'MYSTERY_REVEAL'
  | 'NEXT_LEVEL_READY';

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const navigate = useNavigate();
  const [serverState, setServerState] = useState<PlayerGameStateResponse | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<PlayerQuestionResponse | null>(null);
  const [hints, setHints] = useState<HintData[]>([]);
  const [_storyline, setStoryline] = useState<StorylineData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean>(() => {
    return sessionStorage.getItem('codexcape_initialized') === 'true';
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [liveRank, setLiveRank] = useState<number | undefined>(undefined);
  const [teamScore, setTeamScore] = useState<PlayerScoreResponse | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isCoreEntryOpen, setIsCoreEntryOpen] = useState(false);
  const [isRestorationOpen, setIsRestorationOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StorySequence | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [transitionInfo, setTransitionInfo] = useState<{
    completedLevel: number;
    nextLevel: number;
    nextName: string;
    fragmentTitle: string;
  } | null>(null);
  const [transitionStage, setTransitionStage] = useState<LevelTransitionStage>('IDLE');
  const transitionStageRef = useRef<LevelTransitionStage>('IDLE');
  transitionStageRef.current = transitionStage;

  const [revealingRiddleLevel, setRevealingRiddleLevel] = useState<number | null>(null);
  const lastCompletedLevelRef = useRef<number | null>(null);
  const pendingNextLevelStoryRef = useRef<StorySequence | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  // Trigger explicit level completed transition flow
  const triggerLevelCompletedTransition = useCallback((completedLevel: number, nextLevel: number) => {
    // If already in a level transition, ignore re-entrant triggers
    if (transitionStageRef.current === 'BLACK_TRANSITION_ACTIVE' || transitionStageRef.current === 'LEVEL_COMPLETED') {
      return;
    }

    lastCompletedLevelRef.current = completedLevel;

    // 1. Terminate any currently playing speech, sound effects, or previous dialogue
    voiceNarratorService.stop();
    setIsStoryModalOpen(false);
    setActiveStory(null);
    soundService.playLevelUnlock();

    // 2. BLACK SCREEN TRANSITION STARTS
    setTransitionStage('BLACK_TRANSITION_ACTIVE');

    const nextLevelObj = serverState?.levels?.find((l) => l.levelNumber === nextLevel);
    setTransitionInfo({
      completedLevel,
      nextLevel,
      nextName: nextLevelObj?.name || `LEVEL 0${nextLevel}`,
      fragmentTitle: FRAGMENT_TITLES[completedLevel] || `FRAGMENT 0${completedLevel}`,
    });
  }, [serverState?.levels]);

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [stateData, storyData, scoreData, activeStoryData] = await Promise.all([
        fetchPlayerGameState(),
        fetchStoryline(),
        fetchPlayerScore(),
        fetchCurrentStory(),
      ]);

      if (scoreData) {
        setTeamScore(scoreData);
      }

      if (activeStoryData && activeStoryData.isStoryActive && activeStoryData.storyKey) {
        const seq = activeStoryData.sequence || STORY_SEQUENCES[activeStoryData.storyKey];
        if (seq) {
          // If in black screen transition, queue next story so it never starts prematurely
          if (
            transitionStageRef.current === 'BLACK_TRANSITION_ACTIVE' ||
            transitionStageRef.current === 'LEVEL_COMPLETED'
          ) {
            pendingNextLevelStoryRef.current = seq;
          } else {
            setActiveStory(seq);
            if (sessionStorage.getItem('codexcape_briefing_seen')) {
              setIsStoryModalOpen(true);
            }
          }
        }
      }

      if (!stateData) {
        throw new Error('AUTHORITATIVE GAME STATE UNAVAILABLE. RECONNECT AND TRY AGAIN.');
      }

      // If team has not started the event, redirect to Player Profile / Team Lobby
      if (stateData.gameStatus === 'NOT_STARTED') {
        navigate('/player/lobby', { replace: true });
        return;
      }

      // Check if level has transitioned during live play
      if (prevLevelRef.current !== null && stateData.currentLevel > prevLevelRef.current && stateData.currentLevel <= 6) {
        triggerLevelCompletedTransition(prevLevelRef.current, stateData.currentLevel);
      }
      prevLevelRef.current = stateData.currentLevel;

      setServerState(stateData);
      setStoryline(storyData);
      if (stateData.currentRank !== undefined) {
        setLiveRank(stateData.currentRank);
      }

      // Check if player hasn't completed the earphones/briefing calibration yet
      if (!sessionStorage.getItem('codexcape_briefing_seen')) {
        setIsBriefingOpen(true);
      }

      // Trigger Core Entry Modal on Level 6 entry
      if (stateData.currentLevel === 6 && stateData.gameStatus !== 'COMPLETED' && !sessionStorage.getItem('codexcape_core_seen')) {
        setIsCoreEntryOpen(true);
      }

      // Trigger Final Restoration Modal when game is completed
      if (stateData.gameStatus === 'COMPLETED' && !sessionStorage.getItem('codexcape_restoration_seen')) {
        setIsRestorationOpen(true);
      }

      // A finished or passkey team has no current question to load yet.
      if (stateData.gameStatus === 'FINAL_PASSKEY' || stateData.gameStatus === 'COMPLETED') {
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
  }, [navigate, triggerLevelCompletedTransition]);

  const handlePlayStoryByKey = (storyKey: string) => {
    const seq = STORY_SEQUENCES[storyKey];
    if (seq) {
      setActiveStory(seq);
      setIsStoryModalOpen(true);
    }
  };

  // Called when black-screen transition finishes
  const handleTransitionModalComplete = useCallback(() => {
    const currentInfo = transitionInfo;
    setTransitionInfo(null);
    setTransitionStage('BLACK_TRANSITION_COMPLETE');

    const nextLvl = currentInfo?.nextLevel || (serverState?.currentLevel ? serverState.currentLevel + 1 : 2);

    // 3. BLACK SCREEN TRANSITION COMPLETES -> NEXT LEVEL STORY DIALOGUE STARTS
    const queuedStory = pendingNextLevelStoryRef.current;
    pendingNextLevelStoryRef.current = null;

    const nextKey = nextLvl === 6 ? 'STORY_FINAL_PROTOCOL' : `STORY_L${nextLvl}_INTRO`;
    const storyToPlay = queuedStory || STORY_SEQUENCES[nextKey] || (nextLvl === 6 ? STORY_SEQUENCES.STORY_L6_INTRO : null);

    if (storyToPlay) {
      setTransitionStage('NEXT_LEVEL_STORY');
      setActiveStory(storyToPlay);
      setIsStoryModalOpen(true);
    } else {
      setTransitionStage('NEXT_LEVEL_READY');
      loadData();
      setTransitionStage('IDLE');
    }
  }, [transitionInfo, serverState?.currentLevel, loadData]);

  const handleStorySkip = async () => {
    voiceNarratorService.stop();
    setIsStoryModalOpen(false);
    setActiveStory(null);
    soundService.playClick();
    setTransitionStage('NEXT_LEVEL_STORY_COMPLETE');
    try {
      await skipStory();
    } catch {
      // Ignore network errors on story skip
    }

    const completedLvl = lastCompletedLevelRef.current;
    if (completedLvl && completedLvl >= 1 && completedLvl <= 6) {
      setRevealingRiddleLevel(completedLvl);
      setTransitionStage('MYSTERY_REVEAL');
      lastCompletedLevelRef.current = null;
    } else {
      setTransitionStage('NEXT_LEVEL_READY');
      await loadData();
      setTransitionStage('IDLE');
    }
  };

  const handleStoryComplete = async () => {
    voiceNarratorService.stop();
    setIsStoryModalOpen(false);
    setActiveStory(null);
    setTransitionStage('NEXT_LEVEL_STORY_COMPLETE');
    try {
      await completeStory();
    } catch {
      // Ignore network errors on story complete
    }

    const completedLvl = lastCompletedLevelRef.current;
    if (completedLvl && completedLvl >= 1 && completedLvl <= 6) {
      setRevealingRiddleLevel(completedLvl);
      setTransitionStage('MYSTERY_REVEAL');
      lastCompletedLevelRef.current = null;
    } else {
      setTransitionStage('NEXT_LEVEL_READY');
      await loadData();
      setTransitionStage('IDLE');
    }
  };

  const handleRiddleRevealAcknowledge = async () => {
    setRevealingRiddleLevel(null);
    setTransitionStage('NEXT_LEVEL_READY');
    await loadData();
    setTransitionStage('IDLE');
  };

  const { partnerStatus, wsConnectionStatus, latestNotification } = useGameWebSocket({
    teamId: player?.teamId,
    playerNumber: player?.playerNumber,
    onRefreshData: loadData,
    onRankChanged: (newRank) => setLiveRank(newRank),
    onLevelCompleted: (levelNumber) => {
      if (levelNumber <= 6) {
        triggerLevelCompletedTransition(levelNumber, levelNumber + 1);
      }
    },
    onStoryStarted: (payload) => {
      const key = payload.storyKey;
      const seq = payload.storyState?.sequence || (key ? STORY_SEQUENCES[key] : null);
      if (seq) {
        // If in black screen transition, queue next story so it never overlaps or speaks
        if (
          transitionStageRef.current === 'BLACK_TRANSITION_ACTIVE' ||
          transitionStageRef.current === 'LEVEL_COMPLETED' ||
          transitionInfo !== null
        ) {
          pendingNextLevelStoryRef.current = seq;
        } else {
          setActiveStory(seq);
          setIsStoryModalOpen(true);
        }
      }
    },
    onStorySkipped: () => {
      setIsStoryModalOpen(false);
      setActiveStory(null);
    },
    onStoryCompleted: () => {
      setIsStoryModalOpen(false);
      setActiveStory(null);
    },
  });

  const { lastAlert } = useAntiCheat({
    isActive: serverState?.gameStatus === 'IN_PROGRESS',
    onViolationAlert: () => soundService.playError(),
  });

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED' && player) {
      loadData();
    }
  }, [authStatus, player]);

  // Procedural Ambient Hum and Final Protocol Silence
  useEffect(() => {
    const isPlaying = serverState?.gameStatus === 'IN_PROGRESS' || serverState?.gameStatus === 'FINAL_PASSKEY';
    if (isPlaying && serverState) {
      if (serverState.currentLevel === 6 && (serverState.gameStatus === 'FINAL_PASSKEY' || liveQuestion?.stageNumber === 3)) {
        soundService.silenceAmbient();
      } else {
        soundService.startAmbientHum();
      }
    } else {
      soundService.stopAmbientHum();
    }
    return () => {
      soundService.stopAmbientHum();
    };
  }, [serverState?.gameStatus, serverState?.currentLevel, liveQuestion?.stageNumber]);

  // Initial loading experience: Display cinematic CODEXCAPE system initialization screen
  if (!isSystemInitialized) {
    return (
      <SystemInitializationLoader
        onComplete={() => {
          sessionStorage.setItem('codexcape_initialized', 'true');
          setIsSystemInitialized(true);
          if (!sessionStorage.getItem('codexcape_briefing_seen')) {
            setIsBriefingOpen(true);
          }
        }}
      />
    );
  }

  if (authStatus === 'INITIALIZING' || !player || isLoadingData || !serverState) {
    if (authStatus === 'AUTHENTICATED' && loadError && !serverState) {
      return <GameErrorState message={loadError || 'AUTHORITATIVE GAME STATE UNAVAILABLE.'} />;
    }
    return <GameLoadingState message="SYNCHRONIZING SECURE ESCAPE NODES..." />;
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
    currentRank: liveRank !== undefined ? liveRank : serverState?.currentRank,
  };
  const serverOffset = serverState?.serverTime ? new Date(serverState.serverTime).getTime() - Date.now() : 0;
  const remainingSecs = serverState?.deadline
    ? Math.max(0, Math.ceil((new Date(serverState.deadline).getTime() - (Date.now() + serverOffset)) / 1000))
    : null;
  const formattedRemaining = remainingSecs === null
    ? '--:--:--'
    : `${String(Math.floor(remainingSecs / 3600)).padStart(2, '0')}:${String(Math.floor((remainingSecs % 3600) / 60)).padStart(2, '0')}:${String(remainingSecs % 60).padStart(2, '0')}`;

  const handleAnswerSubmit = async (answer: string, interactionPayload?: string) => {
    if (isSubmitting || isChallengeCompleted) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await submitAnswer(answer, interactionPayload);
      if (res.correct) {
        soundService.playCorrectAnswer();
        setFeedbackIsError(false);
        setFeedbackMsg(res.message || 'ACCESS GRANTED: EVIDENCE VERIFIED. PROTOCOL UNLOCKED.');
        if (res.isCompleted && res.stageCompleted) {
          triggerLevelCompletedTransition(gameState.currentLevel, gameState.currentLevel + 1);
        }
        await loadData();
      } else {
        soundService.playWrongAnswer();
        setFeedbackIsError(true);
        setFeedbackMsg(res.message || 'ACCESS DENIED: INVALID SEQUENCE. ATTEMPT RECORDED.');
      }
    } catch (err: any) {
      soundService.playError();
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
      soundService.playClueDiscover();
      await loadData();
    } catch (err: any) {
      soundService.playError();
      setFeedbackIsError(true);
      setFeedbackMsg(err.message || 'HINT REQUEST REJECTED.');
    }
  };

  if (serverState && serverState.gameStatus === 'NOT_STARTED') {
    return <GameLoadingState message="REDIRECTING TO OPERATOR LOBBY..." />;
  }

  if (serverState && serverState.gameStatus === 'COMPLETED') {
    return (
      <div className="game-page">
        <CodeXcapeBackground intensity="minimal" />
        <GameHeader
          player={player}
          currentLevel={6}
          totalLevels={6}
          connectionStatus={gameState.connectionStatus}
          partnerStatus={partnerStatus}
          onLogout={logout}
          onOpenTransmission={() => handlePlayStoryByKey('STORY_COMPLETION')}
          onOpenBriefing={() => setIsBriefingOpen(true)}
        />
        <main className="game-main centered-main" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px' }}>
          <div className="status-panel success-panel animate-slide-up" style={{ textAlign: 'left', padding: '36px' }}>
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
                backgroundColor: 'rgba(4, 5, 7, 0.85)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsRestorationOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '12px' }}
              >
                REPLAY RESTORATION SEQUENCE
              </button>
            </div>
          </div>
        </main>
        <FinalRestorationModal
          isOpen={isRestorationOpen}
          finalRank={gameState.currentRank}
          elapsedTime={formattedRemaining}
          onClose={() => {
            setIsRestorationOpen(false);
            sessionStorage.setItem('codexcape_restoration_seen', 'true');
          }}
        />
      </div>
    );
  }

  return (
    <div className="game-page">
      <CodeXcapeBackground intensity="minimal" />
      <GameHeader
        player={player}
        currentLevel={gameState.currentLevel}
        totalLevels={gameState.totalLevels}
        currentStage={liveQuestion?.stageNumber || 1}
        totalStages={liveQuestion?.totalStages || 1}
        deadline={serverState?.deadline}
        serverTime={serverState?.serverTime}
        formattedRemaining={formattedRemaining}
        currentRank={gameState.currentRank}
        teamScore={teamScore?.finalScore}
        connectionStatus={gameState.connectionStatus}
        partnerStatus={partnerStatus}
        onLogout={logout}
        onOpenTransmission={() => {
          const key = activeStory?.storyKey || (gameState.currentLevel === 6 ? 'STORY_L6_INTRO' : `STORY_L${gameState.currentLevel}_INTRO`);
          handlePlayStoryByKey(key);
        }}
        onOpenBriefing={() => setIsBriefingOpen(true)}
      />

      <main className="game-main">
        <LevelProgress levels={gameState.levels} currentLevel={gameState.currentLevel} />

        <div className="game-grid animate-slide-up">
          {/* Main Investigation Workspace Column */}
          <div className="panel-container">
            <GameStatus message={gameState.gameStatusMessage} />

            {latestNotification && (
              <div className="notification-banner animate-pulse">
                <Radio size={16} />
                <span>{latestNotification}</span>
              </div>
            )}

            {lastAlert && (
              <div className="notification-banner banner-error animate-pulse" style={{ borderColor: 'var(--accent-crimson)', backgroundColor: 'rgba(225, 29, 72, 0.15)' }}>
                <ShieldAlert size={16} color="var(--accent-crimson)" />
                <span className="terminal-text" style={{ color: 'var(--accent-crimson)', fontWeight: 800 }}>{lastAlert}</span>
              </div>
            )}

            {feedbackMsg && (
              <div className={`notification-banner animate-fade-in ${feedbackIsError ? 'banner-error' : 'banner-success'}`}>
                {feedbackIsError ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
                <span className="terminal-text">{feedbackMsg}</span>
              </div>
            )}

            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {isChallengeCompleted ? (
              <div className="verified-panel">
                <div className="badge badge-success mb-m">
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                  NODE VERIFIED
                </div>
                <p className="terminal-text text-muted" style={{ margin: 0 }}>
                  &gt; AWAITING PARTNER NODE SYNCHRONIZATION FOR TIER 0{gameState.currentLevel}_
                </p>
              </div>
            ) : (
              <AnswerInput
                key={`stage-input-${gameState.currentLevel}-${gameState.challenge.stageNumber || 1}`}
                stageKey={`${gameState.currentLevel}-${gameState.challenge.stageNumber || 1}`}
                answerType={gameState.challenge.answerType}
                placeholderText={gameState.challenge.placeholderText}
                puzzleMetadata={gameState.challenge.puzzleMetadata}
                options={gameState.challenge.options}
                onSubmit={handleAnswerSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            <FinalDeductionTerminal
              isUnlocked={gameState.isFinalTerminalUnlocked}
              isCompleted={serverState?.gameStatus === 'COMPLETED'}
              onSuccess={() => {
                setIsRestorationOpen(true);
                loadData();
              }}
            />
          </div>

          {/* Sidebar Telemetry & Dossier Column */}
          <div className="panel-container sidebar-container">
            <PartnerStatus partner={gameState.partner} />

            {/* Team Identity Matrix with SpotlightCard */}
            <SpotlightCard variant="cyan" className="team-matrix-panel">
              <div className="panel-header">
                <Shield size={14} color="var(--accent-cyan)" />
                <span>TEAM IDENTITY MATRIX</span>
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

              {teamScore && (
                <div className="matrix-row">
                  <span className="terminal-text text-muted font-bold">TEAM SCORE:</span>
                  <span className="terminal-text font-bold text-cyan" style={{ fontSize: '14px', letterSpacing: '0.05em' }}>
                    {teamScore.finalScore} PTS
                  </span>
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
            </SpotlightCard>

            <MysteryBoard
              completedLevelsCount={gameState.levels.filter((l) => l.status === 'COMPLETED').length}
            />

            <HintPanel
              hints={gameState.hints}
              currentLevel={gameState.currentLevel}
              currentStage={liveQuestion?.stageNumber}
              onUseHint={handleUseHint}
            />
          </div>
        </div>
      </main>

      <OpeningBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => {
          setIsBriefingOpen(false);
          sessionStorage.setItem('codexcape_briefing_seen', 'true');
          // Launch the opening Artemis holographic transmission
          const storyToPlay = activeStory || STORY_SEQUENCES.STORY_PROLOGUE;
          if (storyToPlay) {
            setActiveStory(storyToPlay);
            setIsStoryModalOpen(true);
          }
        }}
        playerNumber={player.playerNumber}
      />

      <LevelTransitionModal
        isOpen={transitionInfo !== null && transitionStage === 'BLACK_TRANSITION_ACTIVE'}
        completedLevelNumber={transitionInfo?.completedLevel || 1}
        nextLevelNumber={transitionInfo?.nextLevel || 2}
        nextLevelName={transitionInfo?.nextName || ''}
        recoveryFragmentTitle={transitionInfo?.fragmentTitle || ''}
        onClose={handleTransitionModalComplete}
        onTransitionComplete={handleTransitionModalComplete}
      />

      <RiddleRevealModal
        isOpen={transitionStage === 'MYSTERY_REVEAL' && revealingRiddleLevel !== null}
        unlockedLevelNumber={revealingRiddleLevel || 1}
        onAcknowledge={handleRiddleRevealAcknowledge}
      />

      <CoreEntryModal
        isOpen={isCoreEntryOpen}
        onClose={() => {
          setIsCoreEntryOpen(false);
          sessionStorage.setItem('codexcape_core_seen', 'true');
        }}
      />

      <FinalRestorationModal
        isOpen={isRestorationOpen}
        finalRank={gameState.currentRank}
        elapsedTime={formattedRemaining}
        onClose={() => {
          setIsRestorationOpen(false);
          sessionStorage.setItem('codexcape_restoration_seen', 'true');
        }}
      />

      <CinematicStoryModal
        sequence={activeStory}
        isOpen={isStoryModalOpen && transitionStage !== 'BLACK_TRANSITION_ACTIVE'}
        onSkip={handleStorySkip}
        onComplete={handleStoryComplete}
      />
    </div>
  );
};
