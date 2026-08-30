import React from 'react';
import { Radio } from 'lucide-react';
import { Card } from '../ui/Card';

interface GameStatusProps {
  message: string | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ message }) => {
  if (!message) return null;

  return (
    <Card style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-mono)' }} className="animate-fade-in">
      <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.4)', color: 'var(--accent-cyan)', flexShrink: 0, boxShadow: '0 0 15px rgba(0, 217, 255, 0.2)' }}>
        <Radio size={16} className="animate-pulse" />
      </div>

      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', display: 'block', marginBottom: '2px' }}>
          GAME TELEMETRY DIRECTIVE
        </span>
        <p style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{message}</p>
      </div>
    </Card>
  );
};
