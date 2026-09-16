import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { fetchPlayerGameState, PlayerGameStateResponse, fetchPlayerScore, PlayerScoreResponse } from '../../services/playerGameStateService';
import { fetchCurrentQuestion, submitAnswer, PlayerQuestionResponse } from '../../services/questionService';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import { GameHeader } from '../../components/game/GameHeader';
import { ChallengePanel } from '../../components/game/ChallengePanel';
import { AnswerInput } from '../../components/game/AnswerInput';
import { HintPanel } from '../../components/game/HintPanel';
import { FinalDeductionTerminal } from '../../components/game/FinalDeductionTerminal';
import { MysteryBoard } from '../../components/game/MysteryBoard';
import { RiddleRevealModal } from '../../components/game/RiddleRevealModal';
import { fetchRiddleBoardState, RiddleBoardState } from '../../services/riddleService';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { GameErrorState } from '../../components/game/GameErrorState';
import { ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
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
  const [isMysteryBoardOpen, setIsMysteryBoardOpen] = useState(false);
  const [riddleBoardState, setRiddleBoardState] = useState<RiddleBoardState | null>(null);
  const [isHintPanelOpen, setIsHintPanelOpen] = useState(false);
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
    transitionStageRef.current = 'BLACK_TRANSITION_ACTIVE';
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

      // Fetch persistent riddle board state for team
      try {
        const riddlesData = await fetchRiddleBoardState();
        setRiddleBoardState(riddlesData);
      } catch {
        // Ignore riddle fetch network error
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
      const res = await submitAnswer(answer, interactionPayload, gameState.currentLevel, liveQuestion?.stageNumber);
      if (res.correct) {
        soundService.playCorrectAnswer();
        setFeedbackIsError(false);
        setFeedbackMsg(res.message || 'ACCESS GRANTED: EVIDENCE VERIFIED. PROTOCOL UNLOCKED.');
        if (res.levelCompleted || (res.stageCompleted && res.nextStageNumber === null && gameState.currentLevel < 6)) {
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

  const handleUseHint = async (hintNumber: number = 1) => {
    try {
      const currentStageNum = liveQuestion?.stageNumber || 1;
      const res = await usePlayerHint(gameState.currentLevel, currentStageNum, hintNumber);
      soundService.playClueDiscover();

      if (res && res.hintContent) {
        setHints((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex(
            (h) => h.levelNumber === gameState.currentLevel && (h.stageNumber === currentStageNum || (!h.stageNumber && currentStageNum === 1))
          );
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              stageNumber: currentStageNum,
              isUnlocked: true,
              hintContent: res.hintContent,
            };
          } else {
            updated.push({
              levelNumber: gameState.currentLevel,
              stageNumber: currentStageNum,
              hintNumber: 1,
              isUnlocked: true,
              hintContent: res.hintContent,
            });
          }
          return updated;
        });
        setFeedbackIsError(false);
        setFeedbackMsg('Hint revealed — 5 points deducted.');
      }
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
        <div className="game-workspace animate-fade-in">
          {/* System Notifications & Alerts */}
          {latestNotification && (
            <div className="notification-banner animate-fade-in">
              <span className="terminal-text">{latestNotification}</span>
            </div>
          )}

          {lastAlert && (
            <div className="notification-banner banner-error animate-pulse">
              <ShieldAlert size={16} />
              <span className="terminal-text font-bold">{lastAlert}</span>
            </div>
          )}

          {feedbackMsg && (
            <div className={`notification-banner animate-fade-in ${feedbackIsError ? 'banner-error' : 'banner-success'}`}>
              {feedbackIsError ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
              <span className="terminal-text font-bold">{feedbackMsg}</span>
            </div>
          )}

          {/* Central Puzzle Space or Final Deduction Console */}
          {gameState.isFinalTerminalUnlocked ? (
            <FinalDeductionTerminal
              isUnlocked={gameState.isFinalTerminalUnlocked}
              isCompleted={serverState?.gameStatus === 'COMPLETED'}
              allRiddlesSolved={riddleBoardState?.allRiddlesSolved ?? false}
              solvedRiddlesCount={riddleBoardState?.solvedCount ?? 0}
              onOpenRiddleBoard={() => setIsMysteryBoardOpen(true)}
              onSuccess={() => {
                setIsRestorationOpen(true);
                loadData();
              }}
            />
          ) : (
            <div className="puzzle-container">
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
                  key={`stage-input-${gameState.currentLevel}-${liveQuestion?.stageNumber || 1}-${liveQuestion?.questionId || 0}`}
                  stageId={`${gameState.currentLevel}-${liveQuestion?.stageNumber || 1}-${liveQuestion?.questionId || 0}`}
                  answerType={gameState.challenge.answerType}
                  placeholderText={gameState.challenge.placeholderText}
                  puzzleMetadata={gameState.challenge.puzzleMetadata}
                  options={gameState.challenge.options}
                  onSubmit={handleAnswerSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}

          {/* Secondary Action Bar: Riddle Board & Hints */}
          <div className="game-secondary-dock">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setIsMysteryBoardOpen(true);
              }}
              className="secondary-action-btn"
              title="Open Riddle Board (General Logic Riddles)"
            >
              <span className="dock-icon">◆</span>
              <span className="dock-label">RIDDLE BOARD</span>
              <span className="dock-badge">
                {riddleBoardState ? `${riddleBoardState.solvedCount}/6` : `${Math.min(gameState.levels.filter((l) => l.status === 'COMPLETED').length, 6)}/6`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setIsHintPanelOpen(true);
              }}
              className="secondary-action-btn"
              title="Open Stage Hints"
            >
              <span className="dock-icon">💡</span>
              <span className="dock-label">HINTS</span>
              {hints.filter((h) => h.isUnlocked).length > 0 && (
                <span className="dock-badge active">
                  {hints.filter((h) => h.isUnlocked).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </main>

      <MysteryBoard
        completedLevelsCount={gameState.levels.filter((l) => l.status === 'COMPLETED').length}
        isOpen={isMysteryBoardOpen}
        onClose={() => setIsMysteryBoardOpen(false)}
        onRiddleSolved={() => {
          fetchRiddleBoardState().then(setRiddleBoardState).catch(() => {});
          loadData();
        }}
      />

      <HintPanel
        hints={gameState.hints}
        currentLevel={gameState.currentLevel}
        currentStage={liveQuestion?.stageNumber}
        isOpen={isHintPanelOpen}
        onClose={() => setIsHintPanelOpen(false)}
        onUseHint={handleUseHint}
      />

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
        isOpen={isStoryModalOpen && transitionStage !== 'BLACK_TRANSITION_ACTIVE' && transitionInfo === null}
        onSkip={handleStorySkip}
        onComplete={handleStoryComplete}
      />
    </div>
  );
};
