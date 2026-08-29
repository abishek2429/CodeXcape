import { Client, IMessage } from '@stomp/stompjs';

export type WebSocketEventType =
  | 'PLAYER_CONNECTED'
  | 'PLAYER_DISCONNECTED'
  | 'PARTNER_CHALLENGE_COMPLETED'
  | 'LEVEL_COMPLETED'
  | 'NEXT_LEVEL_UNLOCKED'
  | 'HINT_UNLOCKED'
  | 'GAME_COMPLETED'
  | 'GAME_STATE_UPDATED';

export interface WebSocketEventPayload {
  type: WebSocketEventType;
  teamId: number;
  playerId?: number;
  playerNumber?: number;
  displayName?: string;
  levelNumber?: number;
  nextLevelNumber?: number;
  message?: string;
  timestamp?: string;
}

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export class GameWebSocketService {
  private client: Client | null = null;
  private teamId: number | null = null;
  private listeners: Map<string, Set<(payload: WebSocketEventPayload) => void>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private currentStatus: ConnectionStatus = 'DISCONNECTED';

  public connect(teamId: number) {
    if (this.client && this.client.active && this.teamId === teamId) {
      return;
    }

    this.disconnect();
    this.teamId = teamId;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.updateStatus('RECONNECTING');

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.updateStatus('CONNECTED');
        this.subscribeToTeam(teamId);
      },
      onDisconnect: () => {
        this.updateStatus('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.warn('STOMP Error:', frame.headers['message']);
        this.updateStatus('DISCONNECTED');
      },
      onWebSocketClose: () => {
        if (this.currentStatus === 'CONNECTED') {
          this.updateStatus('RECONNECTING');
        }
      },
    });

    this.client.activate();
  }

  private subscribeToTeam(teamId: number) {
    if (!this.client || !this.client.connected) return;

    this.client.subscribe(`/topic/team/${teamId}`, (message: IMessage) => {
      try {
        const payload: WebSocketEventPayload = JSON.parse(message.body);
        this.notifyListeners(payload);
      } catch (e) {
        console.error('Failed to parse STOMP message payload', e);
      }
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.teamId = null;
    this.updateStatus('DISCONNECTED');
  }

  public subscribe(eventType: WebSocketEventType, callback: (payload: WebSocketEventPayload) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.currentStatus = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  private notifyListeners(payload: WebSocketEventPayload) {
    const eventSet = this.listeners.get(payload.type);
    if (eventSet) {
      eventSet.forEach((fn) => fn(payload));
    }
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }
}

export const webSocketService = new GameWebSocketService();
