import React from 'react';
import {
  Terminal,
  Code2,
  FileSearch,
  Network,
  Lock,
  Binary,
  Share2,
  KeyRound,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { ChallengeData } from '../../types/game';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;

  // Determine technical system archetype based on level and stage
  const getSystemArchetype = () => {
    const lvl = challenge.levelNumber;
    const stg = challenge.stageNumber || 1;

    if (lvl === 1 && stg === 1) return { title: 'FORENSIC LOG ANALYZER', icon: <FileSearch size={18} color="var(--accent-cyan)" /> };
    if (lvl === 1 && stg === 2) return { title: 'CIRCUIT ACCESS PANEL', icon: <Layers size={18} color="var(--accent-cyan)" /> };
    if (lvl === 2 && stg === 1) return { title: 'BYTE FRAGMENT VAULT', icon: <Binary size={18} color="var(--accent-cyan)" /> };
    if (lvl === 2 && stg === 2) return { title: 'TRANSFORMATION CHAMBER', icon: <Cpu size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 1) return { title: 'NETWORK TOPOLOGY ROUTER', icon: <Network size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 2) return { title: 'TRAFFIC FORENSICS ANALYZER', icon: <Share2 size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 3) return { title: 'PACKET FRAME RECONSTRUCTOR', icon: <Binary size={18} color="var(--accent-cyan)" /> };
    if (lvl === 4 && stg === 1) return { title: 'ENCRYPTED ARCHIVE CIPHER', icon: <Lock size={18} color="var(--accent-purple)" /> };
    if (lvl === 4 && stg === 2) return { title: 'DECRYPTION CONSOLE', icon: <Lock size={18} color="var(--accent-purple)" /> };
    if (lvl === 5 && stg === 1) return { title: 'FORENSIC CORRELATION MATRIX', icon: <Share2 size={18} color="var(--status-warning)" /> };
    if (lvl === 5 && stg === 2) return { title: 'EVIDENCE CHAIN TIMELINE', icon: <Layers size={18} color="var(--status-warning)" /> };
    if (lvl === 5 && stg === 3) return { title: 'PARITY EXTRACTION ENGINE', icon: <Binary size={18} color="var(--status-warning)" /> };
    if (lvl === 6 && stg === 1) return { title: 'DUAL-OPERATOR KEY SYNCHRONIZER', icon: <KeyRound size={18} color="var(--accent-crimson)" /> };
    if (lvl === 6 && stg === 2) return { title: 'CORE SEQUENCE RECONSTRUCTION', icon: <ShieldCheck size={18} color="var(--accent-crimson)" /> };
    if (lvl === 6 && stg === 3) return { title: 'EMERGENCY PROTOCOL CONSOLE', icon: <Terminal size={18} color="var(--accent-crimson)" /> };

    return { title: 'TECHNICAL WORKSPACE', icon: <Terminal size={18} color="var(--accent-cyan)" /> };
  };

  const archetype = getSystemArchetype();

  return (
    <div
      className="cyber-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '340px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-cyan)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Panel Top Bar */}
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
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 217, 255, 0.08)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {archetype.icon}
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 'bold', letterSpacing: '0.12em' }}>
              {archetype.title}
            </span>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              TIER 0{challenge.levelNumber} // STAGE {challenge.stageNumber || 1} OF {challenge.totalStages || 1}
            </div>
          </div>
        </div>

        <span
          className={`badge ${isP1 ? 'badge-cyan' : 'badge-purple'}`}
          style={{ fontSize: '10px', letterSpacing: '0.05em' }}
        >
          NODE 0{playerNumber} TELEMETRY PERSPECTIVE
        </span>
      </div>

      {/* Stage Context & Title */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
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
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-dim)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>SYSTEM SPEC:</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              {challenge.puzzleContext}
            </span>
          </div>
        )}
      </div>

      {/* Forensic Evidence & Instruction Workspaces */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Evidence Block */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(5, 6, 8, 0.85)',
            border: '1px solid var(--border-dim)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.8,
            boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.9)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>&gt; EVIDENCE / ARTIFACT STREAM</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>SECURE CAPTURE</span>
          </div>
          <p style={{ whiteSpace: 'pre-line', margin: 0, color: 'var(--text-primary)' }}>
            {challenge.evidence}
          </p>
        </div>

        {/* Instructions Block */}
        {challenge.instructions && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 217, 255, 0.03)',
              border: '1px solid var(--border-cyan)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                marginBottom: '4px',
                opacity: 0.85,
              }}
            >
              DIRECTIVE // COOPERATIVE INSTRUCTIONS:
            </div>
            <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
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
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={13} color="var(--accent-cyan)" />
          <span>
            INPUT FORMAT:{' '}
            <strong
              style={{
                color: 'var(--accent-cyan)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
