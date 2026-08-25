import { Event, CreateEventPayload, UpdateEventPayload, EventStatus } from '../types/event';

const API_BASE = '/api/admin/events';

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch events (Status ${response.status})`);
  }

  return response.json();
}

export async function fetchEventById(eventId: number): Promise<Event> {
  const response = await fetch(`${API_BASE}/${eventId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch event #${eventId}`);
  }

  return response.json();
}

export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.errors) {
      const fieldErrors = Object.values(errorData.errors).join(', ');
      throw new Error(fieldErrors || errorData.message || 'Event creation failed');
    }
    throw new Error(errorData.message || `Failed to create event (Status ${response.status})`);
  }

  return response.json();
}

export async function updateEvent(eventId: number, payload: UpdateEventPayload): Promise<Event> {
  const response = await fetch(`${API_BASE}/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update event');
  }

  return response.json();
}

export async function updateEventStatus(eventId: number, status: EventStatus): Promise<Event> {
  const response = await fetch(`${API_BASE}/${eventId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update event status');
  }

  return response.json();
}
