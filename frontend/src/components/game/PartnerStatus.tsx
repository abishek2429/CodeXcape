import React from 'react';
import { Users, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PartnerStatusData } from '../../types/game';
import { SpotlightCard } from '../cinematic/SpotlightCard';

interface PartnerStatusProps {
  partner: PartnerStatusData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  const isConnected = partner.status === 'CONNECTED';
  const isReconnecting = partner.status === 'RECONNECTING';

  return (
    <SpotlightCard
      variant="danger"
      style={{
        padding: '18px 20px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-panel-elevated)',
        border: '1px solid var(--border-crimson)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={15} color="var(--accent-crimson)" />
          <h2
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            REMOTE OPERATOR TELEMETRY
          </h2>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '10px',
            fontWeight: 800,
            backgroundColor: isConnected
              ? 'rgba(16, 185, 129, 0.1)'
              : isReconnecting
              ? 'rgba(214, 168, 75, 0.1)'
              : 'rgba(225, 6, 19, 0.1)',
            color: isConnected
              ? 'var(--status-success)'
              : isReconnecting
              ? 'var(--status-warning)'
              : 'var(--accent-crimson)',
            border: '1px solid',
            borderColor: isConnected
              ? 'rgba(16, 185, 129, 0.3)'
              : isReconnecting
              ? 'rgba(214, 168, 75, 0.3)'
              : 'rgba(225, 6, 19, 0.3)',
          }}
        >
          {isConnected ? (
            <>
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-success)',
                  boxShadow: '0 0 5px var(--status-success)',
                }}
              />
              <span>SYNCED</span>
            </>
          ) : isReconnecting ? (
            <>
              <RefreshCw size={10} className="animate-spin" />
              <span>RECONNECTING</span>
            </>
          ) : (
            <>
              <WifiOff size={10} />
              <span>OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Operator Metadata Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', backgroundColor: 'rgba(8, 8, 10, 0.7)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-dim)' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>NODE IDENTIFIER:</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-crimson-bright)' }}>
            OPERATOR 0{partner.playerNumber}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', backgroundColor: 'rgba(8, 8, 10, 0.7)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-dim)' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>OPERATOR NAME:</span>
          <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700 }}>
            {partner.displayName || `OPERATOR 0${partner.playerNumber}`}
          </span>
        </div>
      </div>

      {/* Challenge Parity Verification */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: partner.challengeCompleted
            ? 'rgba(16, 185, 129, 0.08)'
            : 'rgba(225, 6, 19, 0.05)',
          border: '1px solid',
          borderColor: partner.challengeCompleted
            ? 'rgba(16, 185, 129, 0.3)'
            : 'var(--border-crimson)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>STAGE PARITY:</span>
        <span
          style={{
            fontWeight: 800,
            color: partner.challengeCompleted ? 'var(--status-success)' : 'var(--accent-crimson-bright)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {partner.challengeCompleted ? (
            <>
              <CheckCircle2 size={12} />
              <span>STAGE SOLVED</span>
            </>
          ) : (
            <span>SOLVING PUZZLE MATRIX</span>
          )}
        </span>
      </div>
    </SpotlightCard>
  );
};
