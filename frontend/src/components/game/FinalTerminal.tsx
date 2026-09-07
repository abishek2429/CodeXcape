import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, AlertOctagon, Loader2, Zap, ShieldAlert } from 'lucide-react';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';
import { soundService } from '../../services/soundService';
import { CinematicButton } from '../cinematic/CinematicButton';

interface FinalTerminalProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  onSuccess?: () => void;
}

export const FinalTerminal: React.FC<FinalTerminalProps> = ({ isUnlocked, isCompleted, onSuccess }) => {
  const [passkey, setPasskey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || isCompleted || isSubmitting) return;

    const trimmed = passkey.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setErrorMsg('PASSKEY MUST BE EXACTLY 6 NUMERIC DIGITS.');
      soundService.playAccessDenied();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res: FinalPasskeyResponse = await submitFinalPasskey(trimmed);
      if (res.status === 'COMPLETED' || res.status === 'ALREADY_COMPLETED') {
        soundService.playLevelUnlock();
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        soundService.playAccessDenied();
        setErrorMsg(res.message || 'ACCESS DENIED: INVALID SEQUENCE. ATTEMPT RECORDED.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        soundService.playAccessDenied();
        setErrorMsg('TERMINAL UNAVAILABLE. COMPLETE ALL 6 TIERS FIRST.');
      } else {
        soundService.playAccessDenied();
        setErrorMsg(res.message || 'PASSKEY SUBMISSION REJECTED.');
      }
    } catch (err: any) {
      soundService.playAccessDenied();
      setErrorMsg(err.message || 'SYSTEM ERROR VALIDATING PASSKEY.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return null;
  }

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid',
        borderColor: isUnlocked ? 'var(--accent-crimson)' : 'var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: isUnlocked ? '0 0 40px rgba(225, 29, 72, 0.25)' : 'none',
        transition: 'all 0.3s ease',
        fontFamily: 'var(--font-mono)',
        marginTop: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed var(--border-dim)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              backgroundColor: isUnlocked ? 'rgba(225, 29, 72, 0.15)' : 'rgba(0,0,0,0.5)',
              borderColor: isUnlocked ? 'var(--accent-crimson)' : 'var(--border-dim)',
              color: isUnlocked ? 'var(--accent-crimson)' : 'var(--text-muted)',
            }}
          >
            <Terminal size={18} />
          </div>
          <h2
            style={{
              fontSize: '13px',
              letterSpacing: '0.12em',
              fontWeight: 800,
              color: isUnlocked ? 'var(--accent-crimson)' : 'var(--text-muted)',
              margin: 0,
            }}
          >
            FINAL MASTER OVERRIDE TERMINAL
          </h2>
        </div>

        <span
          className={`badge ${isUnlocked ? 'badge-danger animate-pulse' : ''}`}
          style={{
            border: isUnlocked ? '1px solid var(--accent-crimson)' : '1px solid var(--border-dim)',
            color: isUnlocked ? 'var(--accent-crimson)' : 'var(--text-muted)',
            fontSize: '10px',
          }}
        >
          {isUnlocked ? 'OVERRIDE READY // ENTER PASSKEY' : 'CONTAINMENT LOCK ACTIVE'}
        </span>
      </div>

      {!isUnlocked ? (
        <div
          style={{
            padding: '40px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(4, 5, 7, 0.6)',
            border: '1px solid var(--border-dim)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Lock size={28} />
          </div>
          <div>
            <p style={{ fontSize: '15px', letterSpacing: '0.08em', fontWeight: 800, color: 'var(--text-secondary)', margin: 0 }}>
              FINAL SECURITY LOCK ENGAGED
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', maxWidth: '440px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              &gt; COMPLETE ALL 6 TIERS TO DECRYPT ALL CLUE SHARDS AND ACTIVATE THE MASTER EMERGENCY OVERRIDE CONSOLE_
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(4, 5, 7, 0.8)',
            border: '1px solid rgba(225, 29, 72, 0.4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid var(--accent-crimson)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-crimson)',
              boxShadow: '0 0 20px rgba(225, 29, 72, 0.4)',
            }}
          >
            <KeyRound size={36} className="animate-pulse" />
          </div>

          {/* Core Status Emergency Telemetry Block */}
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'rgba(4, 5, 7, 0.95)',
              border: '1px solid var(--accent-crimson)',
              borderRadius: 'var(--radius-xs)',
              padding: '18px 24px',
              textAlign: 'left',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.8,
              boxShadow: 'inset 0 0 25px rgba(225, 29, 72, 0.15)',
            }}
          >
            <div style={{ color: 'var(--accent-crimson)', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={14} />
              CORE STATUS // EMERGENCY OVERRIDE DETECTED
            </div>
            <div style={{ color: 'var(--status-warning)' }}>
              NODE 01 ... <span style={{ color: 'var(--status-warning)' }}>DEGRADED</span><br />
              NODE 02 ... <span style={{ color: 'var(--status-warning)' }}>DEGRADED</span><br />
              NODE 03 ... <span style={{ color: 'var(--status-warning)' }}>DEGRADED</span><br />
              NODE 04 ... <span style={{ color: 'var(--status-warning)' }}>DEGRADED</span><br />
              NODE 05 ... <span style={{ color: 'var(--accent-crimson)', fontWeight: 800 }}>CRITICAL</span><br />
              NODE 06 ... <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>ACTIVE</span>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-dim)', color: 'var(--text-muted)' }}>
              RECOVERY PROTOCOL: <strong style={{ color: 'var(--status-success)' }}>READY</strong><br />
              PERSONNEL: <strong style={{ color: 'var(--accent-cyan)' }}>TWO OPERATORS REQUIRED</strong><br />
              FINAL PROTOCOL: <strong style={{ color: 'var(--status-success)' }}>ALL RECOVERY FRAGMENTS VERIFIED</strong><br />
              SYSTEM LOCKED: <strong style={{ color: 'var(--accent-crimson)' }}>ENTER SIX-DIGIT ACCESS CODE</strong>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-cold-white)', margin: '0 0 6px 0' }}>
              ENTER SIX-DIGIT MASTER OVERRIDE PASSKEY
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--accent-cyan)', margin: 0, opacity: 0.9 }}>
              &gt; SYNTHESIZE ALL 6 RECOVERED FRAGMENTS TO CALCULATE THE FINAL CODE_
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', width: '100%', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                maxLength={6}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '34px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  letterSpacing: '0.45em',
                  padding: '16px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-void)',
                  border: '2px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  outline: 'none',
                  boxShadow: 'inset 0 0 20px rgba(0, 217, 255, 0.15)',
                }}
              />
            </div>

            {errorMsg && (
              <div
                className="animate-glitch"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: 'var(--accent-crimson)',
                  backgroundColor: 'rgba(225, 29, 72, 0.12)',
                  border: '1px solid var(--accent-crimson)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-xs)',
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: 800,
                }}
              >
                <AlertOctagon size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <CinematicButton
              variant="danger"
              type="submit"
              disabled={isSubmitting || passkey.length !== 6}
              style={{ width: '100%', padding: '16px', fontSize: '14px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>TRANSMITTING OVERRIDE...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>AUTHORIZE FINAL ESCAPE</span>
                </>
              )}
            </CinematicButton>
          </div>
        </form>
      )}
    </div>
  );
};
