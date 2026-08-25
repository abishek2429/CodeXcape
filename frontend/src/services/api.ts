import { HealthResponse } from '../types/health';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
  const startTime = performance.now();
  
  const response = await fetch(`${API_BASE}/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data: HealthResponse = await response.json();
  return { data, latencyMs };
}
