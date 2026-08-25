export type EventStatus = 'DRAFT' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface Event {
  id: number;
  name: string;
  description?: string;
  status: EventStatus;
  startTime?: string;
  endTime?: string;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  passkey?: string;
}

export interface UpdateEventPayload {
  name: string;
  description?: string;
  status: EventStatus;
  startTime?: string;
  endTime?: string;
}
