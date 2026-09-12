import { Event, CreateEventPayload, UpdateEventPayload, EventStatus } from '../types/event';
import { getAdminHeaders, getAdminAuthOnlyHeaders } from './adminService';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/events` : '/api/admin/events';

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
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
    headers: getAdminAuthOnlyHeaders(),
    credentials: 'include',
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
    headers: getAdminHeaders(),
    credentials: 'include',
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
    headers: getAdminHeaders(),
    credentials: 'include',
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
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update event status');
  }

  return response.json();
}
