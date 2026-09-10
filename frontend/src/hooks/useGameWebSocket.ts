import { useEffect, useState, useRef } from 'react';
import { webSocketService, ConnectionStatus, WebSocketEventPayload } from '../services/websocketService';

interface UseGameWebSocketProps {
  teamId?: number;
  playerNumber?: number;
  onRefreshData?: () => void;
  onRankChanged?: (newRank: number) => void;
}

export function useGameWebSocket({ teamId, playerNumber, onRefreshData, onRankChanged }: UseGameWebSocketProps) {
  const [partnerStatus, setPartnerStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [wsConnectionStatus, setWsConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [latestNotification, setLatestNotification] = useState<string | null>(null);

  const onRefreshRef = useRef(onRefreshData);
  onRefreshRef.current = onRefreshData;

  const onRankRef = useRef(onRankChanged);
  onRankRef.current = onRankChanged;

  const refreshTimerRef = useRef<any>(null);

  const triggerCoalescedRefresh = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      if (onRefreshRef.current) {
        onRefreshRef.current();
      }
    }, 100);
  };

  useEffect(() => {
    if (!teamId) return;

    webSocketService.connect(teamId);

    const unsubStatus = webSocketService.onStatusChange((status) => {
      setWsConnectionStatus(status);
      if (status === 'CONNECTED') {
        // Re-fetch authoritative state after successful reconnection
        triggerCoalescedRefresh();
      }
    });

    const unsubConnected = webSocketService.subscribe('PLAYER_CONNECTED', (payload: WebSocketEventPayload) => {
      if (payload.playerNumber && payload.playerNumber !== playerNumber) {
        setPartnerStatus('CONNECTED');
        setLatestNotification(`Teammate (Player ${payload.playerNumber}) connected.`);
      }
    });

    const unsubDisconnected = webSocketService.subscribe('PLAYER_DISCONNECTED', (payload: WebSocketEventPayload) => {
      if (payload.playerNumber && payload.playerNumber !== playerNumber) {
        setPartnerStatus('DISCONNECTED');
        setLatestNotification(`Teammate (Player ${payload.playerNumber}) disconnected.`);
      }
    });

    const unsubPartnerComplete = webSocketService.subscribe('PARTNER_CHALLENGE_COMPLETED', (payload: WebSocketEventPayload) => {
      if (payload.playerNumber && payload.playerNumber !== playerNumber) {
        setLatestNotification(payload.message || 'Your teammate has completed their challenge ✓');
        triggerCoalescedRefresh();
      }
    });

    const unsubStageComplete = webSocketService.subscribe('STAGE_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestNotification(payload.message || `Stage ${payload.stageNumber} completed by both players! ✓`);
      triggerCoalescedRefresh();
    });

    const unsubLevelComplete = webSocketService.subscribe('LEVEL_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestNotification(`Level ${payload.levelNumber} Completed by both players! ✓`);
      triggerCoalescedRefresh();
    });

    const unsubNextLevel = webSocketService.subscribe('NEXT_LEVEL_UNLOCKED', (payload: WebSocketEventPayload) => {
      setLatestNotification(`Level ${payload.nextLevelNumber} unlocked!`);
      triggerCoalescedRefresh();
    });

    const unsubHintUnlocked = webSocketService.subscribe('HINT_UNLOCKED', (payload: WebSocketEventPayload) => {
      setLatestNotification(payload.message || `Hint ${payload.levelNumber} unlocked!`);
      triggerCoalescedRefresh();
    });

    const unsubGameCompleted = webSocketService.subscribe('GAME_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestNotification(payload.message || '🎉 CODEXCAPE COMPLETED! Your team escaped!');
      triggerCoalescedRefresh();
    });

    const unsubRankChanged = webSocketService.subscribe('RANK_CHANGED', (payload: WebSocketEventPayload) => {
      if (payload.newRank) {
        setLatestNotification(`Leaderboard updated! Your team is now rank #${payload.newRank}`);
        if (onRankRef.current) {
          onRankRef.current(payload.newRank);
        }
      }
    });

    const unsubReadyChanged = webSocketService.subscribe('PLAYER_READY_CHANGED', () => {
      triggerCoalescedRefresh();
    });

    const unsubEventStarted = webSocketService.subscribe('EVENT_STARTED', () => {
      triggerCoalescedRefresh();
    });

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      unsubStatus();
      unsubConnected();
      unsubDisconnected();
      unsubPartnerComplete();
      unsubStageComplete();
      unsubLevelComplete();
      unsubNextLevel();
      unsubHintUnlocked();
      unsubGameCompleted();
      unsubRankChanged();
      unsubReadyChanged();
      unsubEventStarted();
      webSocketService.disconnect();
    };
  }, [teamId, playerNumber]);

  return {
    partnerStatus,
    wsConnectionStatus,
    latestNotification,
    clearNotification: () => setLatestNotification(null),
  };
}
