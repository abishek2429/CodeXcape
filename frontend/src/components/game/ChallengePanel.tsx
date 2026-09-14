import React from 'react';
import {
  Terminal,
  Code2,
  Network,
  Lock,
  Binary,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { ChallengeData } from '../../types/game';
import { SpotlightCard } from '../cinematic/SpotlightCard';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;
  const lvl = challenge.levelNumber;
  const stg = challenge.stageNumber || 1;

  // Determine technical system archetype metadata based on the level curriculum
  const getSystemArchetype = () => {
    switch (lvl) {
      case 1:
        return { title: 'PROGRAMMING CORE // CODE WORKSPACE', code: `PRG-L1-S${stg}`, icon: <Code2 size={18} color="var(--accent-crimson-bright)" /> };
      case 2:
        return { title: 'DATA STRUCTURES & ALGORITHMS // LOGIC TERMINAL', code: `DSA-L2-S${stg}`, icon: <Binary size={18} color="var(--accent-crimson-bright)" /> };
      case 3:
        return { title: 'SYSTEMS & NETWORKS // PROTOCOL SUITE', code: `NET-L3-S${stg}`, icon: <Network size={18} color="var(--accent-crimson-bright)" /> };
      case 4:
        return { title: 'DATABASES, WEB & VERSION CONTROL // DEV DIAGNOSTICS', code: `DEV-L4-S${stg}`, icon: <Layers size={18} color="var(--accent-crimson)" /> };
      case 5:
        return { title: 'SECURITY, CRYPTOGRAPHY & COMPUTING // CIPHER STATION', code: `SEC-L5-S${stg}`, icon: <Lock size={18} color="var(--status-warning)" /> };
      case 6:
        return { title: 'ADVANCED TECHNICAL CHALLENGES // SYSTEM CORE', code: `ADV-L6-S${stg}`, icon: <ShieldCheck size={18} color="var(--accent-crimson-bright)" /> };
      default:
        return { title: 'TECHNICAL WORKSPACE // DIAGNOSTIC TERMINAL', code: `SYS-L${lvl}-S${stg}`, icon: <Terminal size={18} color="var(--accent-crimson-bright)" /> };
    }
  };

  const archetype = getSystemArchetype();

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '360px',
        backgroundColor: 'var(--bg-panel-elevated)',
        border: '1px solid var(--border-crimson)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(225, 6, 19, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Panel Top Hardware Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '14px',
          marginBottom: '20px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(225, 6, 19, 0.12)',
              border: '1px solid var(--border-crimson)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {archetype.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-crimson-bright)', fontWeight: 800, letterSpacing: '0.1em' }}>
                {archetype.title}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>[{archetype.code}]</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              TIER 0{challenge.levelNumber} // STAGE {challenge.stageNumber || 1} OF {challenge.totalStages || 1}
            </div>
          </div>
        </div>

        <span
          className={`badge ${isP1 ? 'badge-crimson' : 'badge-purple'}`}
          style={{ fontSize: '10px', letterSpacing: '0.05em' }}
        >
          NODE 0{playerNumber} OPERATOR PERSPECTIVE
        </span>
      </div>

      {/* Stage Title & System Spec */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 900,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-cold-white)',
            letterSpacing: '0.04em',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          {challenge.title}
        </h3>

        {challenge.puzzleContext && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(8, 8, 10, 0.8)',
              border: '1px solid var(--border-dim)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>SUBSYSTEM SPEC:</span>
            <span style={{ color: 'var(--accent-crimson-bright)', fontWeight: 700 }}>
              {challenge.puzzleContext}
            </span>
          </div>
        )}
      </div>

      {/* Asymmetric Intelligence Cooperative Notice */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: isP1 ? 'rgba(225, 6, 19, 0.08)' : 'rgba(157, 78, 221, 0.08)',
          border: `1px solid ${isP1 ? 'rgba(225, 6, 19, 0.35)' : 'rgba(157, 78, 221, 0.35)'}`,
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 800,
              color: isP1 ? 'var(--accent-crimson-bright)' : '#d0aaff',
              letterSpacing: '0.08em',
            }}
          >
            [YOUR INTELLIGENCE // FRAGMENT {isP1 ? 'A' : 'B'}]
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            You recovered Fragment {isP1 ? 'A' : 'B'}. Your teammate holds Fragment {isP1 ? 'B' : 'A'}.
          </span>
        </div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'var(--text-cold-white)',
            letterSpacing: '0.12em',
            opacity: 0.9,
          }}
        >
          COMMUNICATE &bull; COMBINE &bull; ESCAPE
        </div>
      </div>

      {/* Technical Evidence & Directive Workspaces */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Evidence Block with SpotlightCard */}
        <SpotlightCard
          variant={lvl === 6 ? 'danger' : 'obsidian'}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(8, 8, 10, 0.95)',
            border: '1px solid var(--border-dim)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.8,
            boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.95)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent-crimson-bright)',
              fontWeight: 800,
              letterSpacing: '0.1em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>&gt; SYSTEM TELEMETRY / PROBLEM STATEMENT</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>ACTIVE CHALLENGE</span>
          </div>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              color: 'var(--text-cold-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: 1.7,
            }}
          >
            {challenge.evidence}
          </pre>
        </SpotlightCard>

        {/* Instructions Directive */}
        {challenge.instructions && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(225, 6, 19, 0.05)',
              border: '1px solid var(--border-crimson)',
              color: 'var(--accent-crimson-bright)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                marginBottom: '4px',
                opacity: 0.9,
              }}
            >
              DIRECTIVE // TASK REQUIREMENTS:
            </div>
            <p style={{ whiteSpace: 'pre-line', margin: 0, color: 'var(--text-primary)' }}>
              {challenge.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Footer Specification Tag */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '14px',
          borderTop: '1px dashed var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={13} color="var(--accent-crimson-bright)" />
          <span>
            ANSWER TYPE:{' '}
            <strong
              style={{
                color: 'var(--accent-crimson-bright)',
                backgroundColor: 'rgba(8, 8, 10, 0.8)',
                padding: '2px 8px',
                borderRadius: '2px',
                border: '1px solid var(--border-dim)',
              }}
            >
              {challenge.answerType}
            </strong>
          </span>
        </div>
        <span>RESTRICTED INVESTIGATION CONSOLE</span>
      </div>
    </div>
  );
};
