import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Unlock, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { StorylineData, RecoveryFragment } from '../../types/story';
import { soundService } from '../../services/soundService';

interface InvestigationDossierProps {
  storyline: StorylineData | null;
  onOpenBriefing?: () => void;
}

export const InvestigationDossier: React.FC<InvestigationDossierProps> = ({
  storyline,
  onOpenBriefing,
}) => {
  const [selectedFragment, setSelectedFragment] = useState<RecoveryFragment | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!storyline?.fragments) return;
    const currentUnlocked = storyline.fragments.filter(f => f.status === 'UNLOCKED').length;
    if (prevCountRef.current !== null && currentUnlocked > prevCountRef.current) {
      soundService.playClueDiscover();
    }
    prevCountRef.current = currentUnlocked;
  }, [storyline?.fragments]);

  if (!storyline) return null;

  const integrity = storyline.networkIntegrityPercent;
  const integrityColor =
    integrity === 100
      ? 'var(--status-success)'
      : integrity >= 60
      ? 'var(--accent-cyan)'
      : integrity >= 30
      ? 'var(--status-warning)'
      : 'var(--status-error)';

  return (
    <div className="cyber-panel" style={{ padding: '20px', fontFamily: 'var(--font-mono)' }}>
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color={integrityColor} />
          <div>
            <h2
              className="terminal-text"
              style={{
                fontSize: '12px',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              INVESTIGATION DOSSIER
            </h2>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              NODE 06 // {storyline.themeTitle}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenBriefing && (
            <button
              type="button"
              onClick={onOpenBriefing}
              title="Review Network Briefing"
              className="btn btn-secondary"
              style={{ fontSize: '9px', padding: '4px 8px' }}
            >
              BRIEFING
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Network Integrity Gauge */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            marginBottom: '6px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>NETWORK INTEGRITY</span>
          <span style={{ color: integrityColor, fontWeight: 'bold' }}>{integrity}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid var(--border-dim)',
          }}
        >
          <div
            style={{
              width: `${integrity}%`,
              height: '100%',
              backgroundColor: integrityColor,
              boxShadow: `0 0 8px ${integrityColor}`,
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Active Objective */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-dim)',
              marginBottom: '14px',
              fontSize: '11px',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginBottom: '2px' }}>
              CURRENT MISSION OBJECTIVE:
            </div>
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              {storyline.activeObjective}
            </div>
          </div>

          {/* Player Perspective Telemetry */}
          {storyline.playerPerspectiveLog && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0, 217, 255, 0.04)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cyan)',
                marginBottom: '16px',
                fontSize: '11px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
                <Radio size={12} />
                <span>OPERATOR TELEMETRY PERSPECTIVE:</span>
              </div>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                {storyline.playerPerspectiveLog}
              </p>
            </div>
          )}

          {/* 6 Recovery Fragments Tracker */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>RECOVERY FRAGMENTS:</span>
              <span>{storyline.fragments.filter(f => f.status === 'UNLOCKED').length} OF 6 RECOVERED</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storyline.fragments.map((frag) => {
                const isUnlocked = frag.status === 'UNLOCKED';
                const isSelected = selectedFragment?.fragmentNumber === frag.fragmentNumber;

                return (
                  <div
                    key={frag.fragmentNumber}
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isSelected
                        ? 'var(--accent-cyan)'
                        : isUnlocked
                        ? 'rgba(0, 217, 255, 0.3)'
                        : 'var(--border-dim)',
                      backgroundColor: isUnlocked ? 'rgba(0, 217, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnlocked) {
                          soundService.playSelect();
                          setSelectedFragment(isSelected ? null : frag);
                        } else {
                          soundService.playError();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'none',
                        border: 'none',
                        color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: isUnlocked ? 'pointer' : 'default',
                        fontSize: '11px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUnlocked ? (
                          <Unlock size={12} color="var(--status-success)" />
                        ) : (
                          <Lock size={12} color="var(--text-muted)" />
                        )}
                        <span style={{ fontWeight: isUnlocked ? 'bold' : 'normal' }}>
                          0{frag.fragmentNumber} — {frag.title}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '9px',
                          color: isUnlocked ? 'var(--status-success)' : 'var(--text-muted)',
                          fontWeight: 'bold',
                        }}
                      >
                        {isUnlocked ? 'RECOVERED' : 'LOCKED'}
                      </span>
                    </button>

                    {/* Expanded Fragment Details */}
                    {isSelected && (
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderTop: '1px dashed var(--border-dim)',
                          fontSize: '11px',
                          lineHeight: 1.6,
                        }}
                      >
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}>
                          ARTIFACT: {frag.technicalArtifact}
                        </div>
                        <div
                          style={{
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-line',
                            backgroundColor: 'var(--bg-void)',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-dim)',
                          }}
                        >
                          {frag.narrativeContent}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
