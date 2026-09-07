import React from 'react';
import { Users, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
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
      variant="cyan"
      style={{
        padding: '18px 20px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
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
          <Users size={15} color="var(--accent-cyan)" />
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
            textTransform: 'uppercase',
            backgroundColor: isConnected
              ? 'rgba(16, 185, 129, 0.08)'
              : isReconnecting
              ? 'rgba(245, 158, 11, 0.08)'
              : 'rgba(225, 29, 72, 0.08)',
            borderColor: isConnected
              ? 'rgba(16, 185, 129, 0.35)'
              : isReconnecting
              ? 'rgba(245, 158, 11, 0.35)'
              : 'rgba(225, 29, 72, 0.35)',
            color: isConnected
              ? 'var(--status-success)'
              : isReconnecting
              ? 'var(--status-warning)'
              : 'var(--status-error)',
            border: '1px solid',
          }}
        >
          {isConnected && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-success)',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--status-success)',
              }}
            />
          )}
          {isReconnecting && <RefreshCw size={11} className="animate-spin" />}
          {!isConnected && !isReconnecting && <WifiOff size={11} />}
          <span>
            {isConnected
              ? `OPERATOR 0${partner.playerNumber} CONNECTED`
              : `OPERATOR 0${partner.playerNumber} WAITING FOR SYNC`}
          </span>
        </div>
      </div>

      {/* Teammate Telemetry Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(4, 5, 7, 0.7)',
          padding: '14px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-cold-white)' }}>
                OPERATOR 0{partner.playerNumber}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: 'var(--accent-cyan)',
                  backgroundColor: 'rgba(0, 217, 255, 0.08)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: '1px solid var(--border-cyan)',
                }}
              >
                REMOTE TERMINAL
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              {partner.displayName || `OPERATOR 0${partner.playerNumber}`}
            </p>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11px',
              fontWeight: 800,
              border: '1px solid',
              backgroundColor: partner.challengeCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.5)',
              borderColor: partner.challengeCompleted ? 'var(--status-success)' : 'var(--border-dim)',
              color: partner.challengeCompleted ? 'var(--status-success)' : 'var(--text-muted)',
            }}
          >
            {partner.challengeCompleted ? (
              <>
                <CheckCircle2 size={13} color="var(--status-success)" />
                <span>SOLVED</span>
              </>
            ) : (
              <>
                <Clock size={13} color="var(--status-warning)" className="animate-pulse" />
                <span>ANALYZING...</span>
              </>
            )}
          </span>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            borderTop: '1px dashed var(--border-dim)',
            paddingTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>STAGE COMPLETION STATUS</span>
          <span style={{ color: partner.challengeCompleted ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700 }}>
            {partner.challengeCompleted ? 'VERIFIED' : 'PENDING'}
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
};
