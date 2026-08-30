import React from 'react';
import { Users, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { PartnerStatusData } from '../../types/game';
import { Card } from '../ui/Card';

interface PartnerStatusProps {
  partner: PartnerStatusData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  const isConnected = partner.status === 'CONNECTED';
  const isReconnecting = partner.status === 'RECONNECTING';

  return (
    <Card style={{ padding: '20px', fontFamily: 'var(--font-mono)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)' }}>
            PARTNER NODE TELEMETRY
          </h2>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px',
            fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : isReconnecting ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: isConnected ? 'rgba(16, 185, 129, 0.3)' : isReconnecting ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: isConnected ? 'var(--status-success)' : isReconnecting ? 'var(--status-warning)' : 'var(--status-error)',
            border: '1px solid'
          }}
        >
          {isConnected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)', display: 'inline-block', boxShadow: '0 0 8px var(--status-success)' }}></span>}
          {isReconnecting && <RefreshCw size={12} className="animate-spin" />}
          {!isConnected && !isReconnecting && <WifiOff size={12} />}
          <span>{partner.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>PLAYER 0{partner.playerNumber}</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-purple)', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              REMOTE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{partner.displayName}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid',
              backgroundColor: partner.challengeCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-dark)',
              borderColor: partner.challengeCompleted ? 'var(--status-success)' : 'var(--border-color)',
              color: partner.challengeCompleted ? 'var(--status-success)' : 'var(--text-secondary)',
              boxShadow: partner.challengeCompleted ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            {partner.challengeCompleted ? (
              <>
                <CheckCircle2 size={14} color="var(--status-success)" />
                <span>SOLVED</span>
              </>
            ) : (
              <>
                <Clock size={14} color="var(--status-warning)" className="animate-pulse" />
                <span>ANALYZING...</span>
              </>
            )}
          </span>
          {partner.statusMessage && (
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{partner.statusMessage}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
