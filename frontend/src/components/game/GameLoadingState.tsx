import React from 'react';
import { Cpu } from 'lucide-react';
import { Card } from '../ui/Card';

interface Props {
  message?: string;
}

export const GameLoadingState: React.FC<Props> = ({ message = 'INITIALIZING CODEXCAPE ENVIRONMENT...' }) => {
  return (
    <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px', maxWidth: '350px', textAlign: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 217, 255, 0.2)' }}>
            <Cpu size={32} color="var(--accent-cyan)" className="animate-pulse" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{message}</p>
          <div style={{ width: '128px', backgroundColor: 'var(--bg-dark)', height: '6px', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--accent-cyan)', width: '50%' }} className="animate-pulse"></div>
          </div>
        </div>
      </Card>
    </div>
  );
};
