import { Client, IMessage } from '@stomp/stompjs';

export type WebSocketEventType =
  | 'PLAYER_CONNECTED'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_READY_CHANGED'
  | 'EVENT_STARTED'
  | 'PARTNER_CHALLENGE_COMPLETED'
  | 'STAGE_COMPLETED'
  | 'LEVEL_COMPLETED'
  | 'NEXT_LEVEL_UNLOCKED'
  | 'HINT_UNLOCKED'
  | 'GAME_COMPLETED'
  | 'GAME_STATE_UPDATED'
  | 'RANK_CHANGED'
  | 'ANTI_CHEAT_ALERT'
  | 'ANTI_CHEAT_EVENT';

export interface WebSocketEventPayload {
  type: WebSocketEventType;
  teamId: number;
  teamCode?: string;
  playerId?: number;
  playerNumber?: number;
  displayName?: string;
  isReady?: boolean;
  gameState?: string;
  levelNumber?: number;
  stageNumber?: number;
  nextStageNumber?: number;
  nextLevelNumber?: number;
  discoveryKey?: string;
  serverTime?: string;
  newRank?: number;
  message?: string;
  timestamp?: string;
  violationType?: string;
  penaltyPoints?: number;
  teamTotalPenalties?: number;
  totalViolations?: number;
}

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export class GameWebSocketService {
  private client: Client | null = null;
  private teamId: number | null = null;
  private isAdmin: boolean = false;
  private teamSubscription: any = null;
  private adminSubscription: any = null;
  private listeners: Map<string, Set<(payload: WebSocketEventPayload) => void>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private currentStatus: ConnectionStatus = 'DISCONNECTED';
  private reconnectAttempt = 0;
  private readonly minDelay = 1000;
  private readonly maxDelay = 10000;

  public connect(teamId: number) {
    if (this.client && this.client.active && this.teamId === teamId && !this.isAdmin) {
      return;
    }

    this.disconnect();
    this.teamId = teamId;
    this.isAdmin = false;
    this.reconnectAttempt = 0;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;

    this.updateStatus('RECONNECTING');

    const token = sessionStorage.getItem('codexcape_session');

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: token ? { 'sessionToken': token } : {},
      reconnectDelay: this.minDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.reconnectAttempt = 0;
        if (this.client) this.client.reconnectDelay = this.minDelay;
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
        this.reconnectAttempt++;
        const nextDelay = Math.min(this.maxDelay, Math.round(this.minDelay * Math.pow(1.5, Math.min(this.reconnectAttempt, 6))));
        if (this.client) {
          this.client.reconnectDelay = nextDelay;
        }
      },
    });

    this.client.activate();
  }

  public connectAdmin() {
    if (this.client && this.client.active && this.isAdmin) {
      return;
    }

    this.disconnect();
    this.isAdmin = true;
    this.teamId = null;
    this.reconnectAttempt = 0;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;

    this.updateStatus('RECONNECTING');

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: this.minDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.reconnectAttempt = 0;
        if (this.client) this.client.reconnectDelay = this.minDelay;
        this.updateStatus('CONNECTED');
        this.subscribeToAdmin();
      },
      onDisconnect: () => {
        this.updateStatus('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.warn('Admin STOMP Error:', frame.headers['message']);
        this.updateStatus('DISCONNECTED');
      },
      onWebSocketClose: () => {
        if (this.currentStatus === 'CONNECTED') {
          this.updateStatus('RECONNECTING');
        }
        this.reconnectAttempt++;
        const nextDelay = Math.min(this.maxDelay, Math.round(this.minDelay * Math.pow(1.5, Math.min(this.reconnectAttempt, 6))));
        if (this.client) {
          this.client.reconnectDelay = nextDelay;
        }
      },
    });

    this.client.activate();
  }

  private subscribeToTeam(teamId: number) {
    if (!this.client || !this.client.connected) return;

    if (this.teamSubscription) {
      try { this.teamSubscription.unsubscribe(); } catch (_) {}
      this.teamSubscription = null;
    }

    this.teamSubscription = this.client.subscribe(`/topic/team/${teamId}`, (message: IMessage) => {
      try {
        const payload: WebSocketEventPayload = JSON.parse(message.body);
        this.notifyListeners(payload);
      } catch (e) {
        console.error('Failed to parse STOMP message payload', e);
      }
    });
  }

  private subscribeToAdmin() {
    if (!this.client || !this.client.connected) return;

    if (this.adminSubscription) {
      try { this.adminSubscription.unsubscribe(); } catch (_) {}
      this.adminSubscription = null;
    }

    this.adminSubscription = this.client.subscribe('/topic/admin', (message: IMessage) => {
      try {
        const payload: WebSocketEventPayload = JSON.parse(message.body);
        this.notifyListeners(payload);
      } catch (e) {
        console.error('Failed to parse admin STOMP message payload', e);
      }
    });
  }

  public disconnect() {
    if (this.teamSubscription) {
      try { this.teamSubscription.unsubscribe(); } catch (_) {}
      this.teamSubscription = null;
    }
    if (this.adminSubscription) {
      try { this.adminSubscription.unsubscribe(); } catch (_) {}
      this.adminSubscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.teamId = null;
    this.isAdmin = false;
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
