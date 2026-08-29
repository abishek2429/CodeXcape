import { useEffect, useState } from 'react';
import { webSocketService, ConnectionStatus, WebSocketEventPayload } from '../services/websocketService';

interface UseGameWebSocketProps {
  teamId?: number;
  playerNumber?: number;
  onRefreshData?: () => void;
}

export function useGameWebSocket({ teamId, playerNumber, onRefreshData }: UseGameWebSocketProps) {
  const [partnerStatus, setPartnerStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [wsConnectionStatus, setWsConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [latestNotification, setLatestNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    webSocketService.connect(teamId);

    const unsubStatus = webSocketService.onStatusChange((status) => {
      setWsConnectionStatus(status);
      if (status === 'CONNECTED' && onRefreshData) {
        // Re-fetch authoritative state after successful reconnection
        onRefreshData();
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
        if (onRefreshData) onRefreshData();
      }
    });

    const unsubLevelComplete = webSocketService.subscribe('LEVEL_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestNotification(`Level ${payload.levelNumber} Completed by both players! ✓`);
      if (onRefreshData) onRefreshData();
    });

    const unsubNextLevel = webSocketService.subscribe('NEXT_LEVEL_UNLOCKED', (payload: WebSocketEventPayload) => {
      setLatestNotification(`Level ${payload.nextLevelNumber} unlocked!`);
      if (onRefreshData) onRefreshData();
    });

    const unsubHintUnlocked = webSocketService.subscribe('HINT_UNLOCKED', (payload: WebSocketEventPayload) => {
      setLatestNotification(payload.message || `Hint ${payload.levelNumber} unlocked!`);
      if (onRefreshData) onRefreshData();
    });

    const unsubGameCompleted = webSocketService.subscribe('GAME_COMPLETED', (payload: WebSocketEventPayload) => {
      setLatestNotification(payload.message || '🎉 CODEXCAPE COMPLETED! Your team escaped!');
      if (onRefreshData) onRefreshData();
    });

    return () => {
      unsubStatus();
      unsubConnected();
      unsubDisconnected();
      unsubPartnerComplete();
      unsubLevelComplete();
      unsubNextLevel();
      unsubHintUnlocked();
      unsubGameCompleted();
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
