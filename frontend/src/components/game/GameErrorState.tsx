import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const GameErrorState: React.FC<Props> = ({
  message = 'Unable to establish secure telemetry connection with the game server.',
  onRetry,
}) => {
  return (
    <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center', borderColor: 'rgba(244, 63, 94, 0.4)', boxShadow: '0 0 40px rgba(244, 63, 94, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(159, 18, 57, 0.6)', border: '1px solid rgba(244, 63, 94, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', marginBottom: '20px', boxShadow: '0 0 20px rgba(244, 63, 94, 0.3)' }} className="animate-pulse">
          <AlertOctagon size={32} />
        </div>

        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(136, 19, 55, 0.8)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fda4af', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          SECURITY EXCEPTION
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          TELEMETRY DISRUPTION
        </h2>
        <p style={{ fontSize: '12px', color: '#fecdd3', fontFamily: 'var(--font-mono)', lineHeight: 1.6, marginBottom: '24px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(136, 19, 55, 0.4)', width: '100%' }}>
          {message}
        </p>

        {onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            <RefreshCw size={16} color="var(--accent-cyan)" />
            <span>RE-ESTABLISH CONNECTION</span>
          </Button>
        )}
      </Card>
    </div>
  );
};
