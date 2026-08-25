export interface HealthResponse {
  status: 'UP' | 'DOWN' | string;
  timestamp: string;
  service: string;
  database: string;
  version: string;
}

export interface SystemStatus {
  frontend: 'ONLINE' | 'OFFLINE';
  backend: 'ONLINE' | 'OFFLINE' | 'CHECKING';
  database: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  details?: HealthResponse | null;
  lastChecked?: string;
  latencyMs?: number;
  error?: string | null;
}
