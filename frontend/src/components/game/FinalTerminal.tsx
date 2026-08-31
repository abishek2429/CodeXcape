import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, AlertOctagon, Loader2, Zap } from 'lucide-react';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';

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
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res: FinalPasskeyResponse = await submitFinalPasskey(trimmed);
      if (res.status === 'COMPLETED' || res.status === 'ALREADY_COMPLETED') {
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        setErrorMsg('ACCESS DENIED: INVALID OVERRIDE SEQUENCE. RE-VERIFY 6 CLUES.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        setErrorMsg('TERMINAL UNAVAILABLE. COMPLETE ALL 6 TIERS FIRST.');
      } else {
        setErrorMsg(res.message || 'PASSKEY SUBMISSION REJECTED.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'SYSTEM ERROR VALIDATING PASSKEY.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return null; // The completion state is now handled at the page level in PlayerGamePage
  }

  return (
    <div className={`cyber-panel ${isUnlocked ? '' : 'locked'}`} style={{ padding: '24px', transition: 'all 0.3s', borderColor: isUnlocked ? 'var(--accent-cyan)' : 'var(--border-dim)', boxShadow: isUnlocked ? '0 0 35px var(--accent-cyan-faded)' : 'none' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-dim)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid', backgroundColor: isUnlocked ? 'var(--accent-cyan-faded)' : 'rgba(0,0,0,0.4)', borderColor: isUnlocked ? 'var(--accent-cyan)' : 'var(--border-dim)', color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            <Terminal size={18} />
          </div>
          <h2 className="terminal-text" style={{ fontSize: '13px', letterSpacing: '0.1em', fontWeight: 600, color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            FINAL OVERRIDE TERMINAL
          </h2>
        </div>

        <span className={`badge ${isUnlocked ? 'badge-cyan animate-pulse' : ''}`} style={{ border: isUnlocked ? '' : '1px solid var(--border-dim)', color: isUnlocked ? '' : 'var(--text-muted)' }}>
          {isUnlocked ? 'OVERRIDE READY // ENTER PASSKEY' : 'CONTAINMENT LOCK ACTIVE'}
        </span>
      </div>

      {!isUnlocked ? (
        <div style={{ padding: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-dim)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Lock size={32} />
          </div>
          <div>
            <p className="terminal-text text-muted font-bold" style={{ fontSize: '16px', letterSpacing: '0.05em' }}>
              FINAL SECURITY LOCK ENGAGED
            </p>
            <p className="terminal-text text-muted" style={{ fontSize: '12px', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0 auto', lineHeight: 1.6 }}>
              &gt; COMPLETE ALL 6 TIERS TO DECRYPT ALL CLUE SHARDS AND ACTIVATE THE MASTER EMERGENCY OVERRIDE CONSOLE_
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ padding: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid var(--accent-cyan-dim)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-cyan-faded)', border: '1px solid var(--accent-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', boxShadow: 'var(--glow-cyan-text)' }}>
            <KeyRound size={40} className="animate-pulse" />
          </div>

          <div>
            <h3 className="terminal-text font-bold" style={{ fontSize: '20px', letterSpacing: '0.05em' }}>
              ENTER 6-DIGIT MASTER OVERRIDE PASSKEY
            </h3>
            <p className="terminal-text text-cyan" style={{ fontSize: '12px', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0 auto', opacity: 0.8 }}>
              &gt; SYNTHESIZE 6 UNLOCKED CLUE SHARDS TO CALCULATE THE FINAL NUMERIC SEQUENCE_
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                maxLength={6}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                disabled={isSubmitting}
                style={{ width: '100%', textAlign: 'center', fontSize: '36px', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '0.5em', padding: '20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-void)', border: '2px solid var(--accent-cyan-dim)', color: 'var(--accent-cyan)', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 0 20px rgba(0,217,255,0.1)' }}
              />
            </div>

            {errorMsg && (
              <div className="animate-glitch" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--status-error)', backgroundColor: 'var(--status-error-dim)', border: '1px solid var(--status-error)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                <AlertOctagon size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || passkey.length !== 6}
              style={{ width: '100%', padding: '20px', fontSize: '16px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>TRANSMITTING OVERRIDE...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>AUTHORIZE FINAL ESCAPE</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
