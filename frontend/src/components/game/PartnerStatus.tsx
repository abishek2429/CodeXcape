import React from 'react';
import { Users, WifiOff, RefreshCw, CheckCircle2, Clock, Radio } from 'lucide-react';
import { PartnerStatusData } from '../../types/game';

interface PartnerStatusProps {
  partner: PartnerStatusData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  const isConnected = partner.status === 'CONNECTED';
  const isReconnecting = partner.status === 'RECONNECTING';

  return (
    <div
      className="cyber-panel"
      style={{
        padding: '18px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
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
          <Users size={15} color="var(--accent-purple)" />
          <h2
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
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
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor: isConnected
              ? 'rgba(16, 185, 129, 0.1)'
              : isReconnecting
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            borderColor: isConnected
              ? 'var(--status-success)'
              : isReconnecting
              ? 'var(--status-warning)'
              : 'var(--status-error)',
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
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-success)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--status-success)',
              }}
            />
          )}
          {isReconnecting && <RefreshCw size={11} className="animate-spin" />}
          {!isConnected && !isReconnecting && <WifiOff size={11} />}
          <span>
            {isConnected
              ? `PLAYER 0${partner.playerNumber} CONNECTED`
              : `PLAYER 0${partner.playerNumber} WAITING FOR CONNECTION`}
          </span>
        </div>
      </div>

      {/* Teammate Telemetry Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(5, 6, 8, 0.6)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                OPERATOR 0{partner.playerNumber}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: 'var(--accent-purple)',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
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
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 'bold',
              border: '1px solid',
              backgroundColor: partner.challengeCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.4)',
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

        {/* Synchronized Action Alert */}
        {partner.challengeCompleted ? (
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '10px',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Radio size={12} className="animate-pulse" />
            <span>REMOTE OPERATOR ACTION DETECTED // EVIDENCE STATE UPDATED</span>
          </div>
        ) : (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            &gt; Verbal coordination required. Do not share terminal screens directly.
          </div>
        )}
      </div>
    </div>
  );
};
