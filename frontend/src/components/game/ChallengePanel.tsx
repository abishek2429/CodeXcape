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
  Radio,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { ChallengeData } from '../../types/game';
import { SpotlightCard } from '../cinematic/SpotlightCard';
import { RadarScan } from '../cinematic/RadarScan';

interface ChallengePanelProps {
  challenge: ChallengeData;
  playerNumber: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, playerNumber }) => {
  const isP1 = playerNumber === 1;
  const lvl = challenge.levelNumber;
  const stg = challenge.stageNumber || 1;

  // Determine technical system archetype metadata
  const getSystemArchetype = () => {
    if (lvl === 1 && stg === 1) return { title: 'FORENSIC LOG COLLISION ANALYZER', code: 'LOG-COLLISION-SYS', icon: <FileSearch size={18} color="var(--accent-cyan)" /> };
    if (lvl === 1 && stg === 2) return { title: 'RESTRICTED CIRCUIT ACCESS PANEL', code: 'CIRCUIT-OVERRIDE', icon: <Layers size={18} color="var(--accent-cyan)" /> };
    if (lvl === 2 && stg === 1) return { title: 'BYTE FRAGMENT VAULT', code: 'VAULT-VX17', icon: <Binary size={18} color="var(--accent-cyan)" /> };
    if (lvl === 2 && stg === 2) return { title: 'TRANSFORMATION CHAMBER', code: 'TRANS-CHAMBER', icon: <Cpu size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 1) return { title: 'NETWORK TOPOLOGY ROUTER', code: 'TOPOLOGY-ROUTER', icon: <Network size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 2) return { title: 'TRAFFIC FORENSICS ANALYZER', code: 'TRAFFIC-SNIFFER', icon: <Share2 size={18} color="var(--accent-cyan)" /> };
    if (lvl === 3 && stg === 3) return { title: 'PACKET FRAME RECONSTRUCTOR', code: 'FRAME-RECON', icon: <Binary size={18} color="var(--accent-cyan)" /> };
    if (lvl === 4 && stg === 1) return { title: 'ENCRYPTED ARCHIVE CIPHER', code: 'ARCHIVE-CIPHER', icon: <Lock size={18} color="var(--accent-purple)" /> };
    if (lvl === 4 && stg === 2) return { title: 'SECURE DECRYPTION TERMINAL', code: 'DECRYPT-ENGINE', icon: <Lock size={18} color="var(--accent-purple)" /> };
    if (lvl === 5 && stg === 1) return { title: 'FORENSIC CORRELATION MATRIX', code: 'CORRELATION-WALL', icon: <Share2 size={18} color="var(--status-warning)" /> };
    if (lvl === 5 && stg === 2) return { title: 'EVIDENCE CHAIN TIMELINE', code: 'CHAIN-TIMELINE', icon: <Layers size={18} color="var(--status-warning)" /> };
    if (lvl === 5 && stg === 3) return { title: 'PARITY EXTRACTION ENGINE', code: 'EXTRACTION-ENGINE', icon: <Binary size={18} color="var(--status-warning)" /> };
    if (lvl === 6 && stg === 1) return { title: 'DUAL-OPERATOR KEY SYNCHRONIZER', code: 'DUAL-KEY-AUTH', icon: <KeyRound size={18} color="var(--accent-crimson)" /> };
    if (lvl === 6 && stg === 2) return { title: 'CORE SEQUENCE RECONSTRUCTION', code: 'CORE-MAINFRAME', icon: <ShieldCheck size={18} color="var(--accent-crimson)" /> };
    if (lvl === 6 && stg === 3) return { title: 'EMERGENCY PROTOCOL CONSOLE', code: 'EMERGENCY-CORE', icon: <Terminal size={18} color="var(--accent-crimson)" /> };

    return { title: 'TECHNICAL WORKSPACE', code: 'SYS-WORKSPACE', icon: <Terminal size={18} color="var(--accent-cyan)" /> };
  };

  const archetype = getSystemArchetype();

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '360px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid',
        borderColor: lvl === 6 ? 'var(--accent-crimson)' : 'var(--border-cyan)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: lvl === 6 ? '0 8px 32px rgba(225, 29, 72, 0.2)' : '0 8px 30px rgba(0, 0, 0, 0.8)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: lvl === 6 ? 'var(--accent-crimson)' : 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '0.1em' }}>
                {archetype.title}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>[{archetype.code}]</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              TIER 0{challenge.levelNumber} // STAGE {challenge.stageNumber || 1} OF {challenge.totalStages || 1}
            </div>
          </div>
        </div>

        <span
          className={`badge ${isP1 ? 'badge-cyan' : 'badge-purple'}`}
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--border-dim)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>SYSTEM SPEC:</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {challenge.puzzleContext}
            </span>
          </div>
        )}
      </div>

      {/* STAGE-SPECIFIC FORENSIC WORKSPACE VISUALS */}
      {/* Level 3 Stage 1: Interactive Radar Network Topology */}
      {lvl === 3 && stg === 1 && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(4, 5, 7, 0.8)', border: '1px solid var(--border-cyan)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} />
              RADAR TOPOLOGY SCANNER // SUBNET NODES
            </span>
            <span style={{ color: 'var(--accent-crimson)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} className="animate-pulse" />
              ANOMALY DETECTED IN SECTOR 06
            </span>
          </div>
          <RadarScan />
        </div>
      )}

      {/* Level 3 Stage 3: Damaged Packet Frame Reconstructor Header */}
      {lvl === 3 && stg === 3 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            border: '1px solid rgba(225, 29, 72, 0.35)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-crimson)', fontWeight: 700 }}>
            <ShieldAlert size={14} />
            <span>PACKET // 7A-19 [CORRUPTED HEADER DETECTED]</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>RECOVERY GAUGE:</span>
            <span style={{ color: 'var(--status-warning)', fontWeight: 800 }}>82%</span>
          </div>
        </div>
      )}

      {/* Level 6 Stage 1: Dual Key Synchronization Header */}
      {lvl === 6 && stg === 1 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            border: '1px solid var(--accent-crimson)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-crimson)', fontWeight: 800 }}>
            <KeyRound size={14} />
            <span>TWO-OPERATOR AUTHORIZATION BARRIER ACTIVE</span>
          </div>
          <div style={{ color: 'var(--text-cold-white)', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '2px', border: '1px solid var(--border-dim)' }}>
            CORE ACCESS: <strong style={{ color: 'var(--accent-crimson)' }}>LOCKED</strong>
          </div>
        </div>
      )}

      {/* Forensic Evidence & Instruction Workspaces */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Evidence Block with SpotlightCard */}
        <SpotlightCard
          variant={lvl === 6 ? 'danger' : 'cyan'}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(4, 5, 7, 0.9)',
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
              color: lvl === 6 ? 'var(--accent-crimson)' : 'var(--accent-cyan)',
              fontWeight: 800,
              letterSpacing: '0.1em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>&gt; EVIDENCE / ARTIFACT TELEMETRY STREAM</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>AUTHORIZED CAPTURE</span>
          </div>
          <p style={{ whiteSpace: 'pre-line', margin: 0, color: 'var(--text-cold-white)' }}>
            {challenge.evidence}
          </p>
        </SpotlightCard>

        {/* Cooperative Instructions Directive */}
        {challenge.instructions && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(0, 217, 255, 0.04)',
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
                fontWeight: 800,
                letterSpacing: '0.1em',
                marginBottom: '4px',
                opacity: 0.9,
              }}
            >
              DIRECTIVE // VERBAL SYNCHRONIZATION REQUIRED:
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
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
