import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, AlertCircle, Loader2, Trophy, Zap } from 'lucide-react';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

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
      setErrorMsg('Passkey must be exactly 6 numeric digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res: FinalPasskeyResponse = await submitFinalPasskey(trimmed);
      if (res.status === 'COMPLETED' || res.status === 'ALREADY_COMPLETED') {
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        setErrorMsg('ACCESS DENIED: Invalid override sequence. Re-verify your 6 clues.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        setErrorMsg('Final terminal is not available yet. Complete all 6 levels first.');
      } else {
        setErrorMsg(res.message || 'Passkey submission rejected.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'System error validating passkey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Card style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--status-success)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.25)', background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.1), var(--bg-panel))', marginBottom: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }} className="animate-pulse-glow">
          <Trophy size={40} color="#6ee7b7" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 16px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#6ee7b7', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }}></span>
          SECURITY SYSTEM BREACHED // MISSION ACCOMPLISHED
        </div>

        <h2 style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '12px' }}>
          CODEXCAPE COMPLETED
        </h2>

        <p style={{ color: '#6ee7b7', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '16px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
          ALL SIX FIREWALLS NEUTRALIZED. MASTER OVERRIDE GRANTED.
        </p>

        <div style={{ maxWidth: '450px', margin: '0 auto', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span>MISSION STATUS:</span>
            <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>100% ESCAPED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span>TELEMETRY:</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>ALL 6 NODES VERIFIED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>LEADERBOARD:</span>
            <span style={{ color: 'var(--status-warning)', fontWeight: 'bold' }}>TIME AUTHORIZED ON SERVER</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: '24px', transition: 'all 0.3s', marginBottom: '24px', borderColor: isUnlocked ? 'rgba(0, 217, 255, 0.6)' : 'var(--border-color)', boxShadow: isUnlocked ? '0 0 35px rgba(0, 217, 255, 0.2)' : 'none', background: isUnlocked ? 'linear-gradient(to bottom, rgba(0, 217, 255, 0.05), var(--bg-panel))' : 'var(--bg-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', border: '1px solid', backgroundColor: isUnlocked ? 'rgba(0, 217, 255, 0.15)' : 'var(--bg-dark)', borderColor: isUnlocked ? 'rgba(0, 217, 255, 0.4)' : 'var(--border-color)', color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-tertiary)' }}>
            <Terminal size={16} />
          </div>
          <h2 style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            FINAL OVERRIDE TERMINAL
          </h2>
        </div>

        <span style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '9999px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid', backgroundColor: isUnlocked ? 'rgba(0, 217, 255, 0.1)' : 'var(--bg-dark)', borderColor: isUnlocked ? 'var(--accent-cyan)' : 'var(--border-color)', color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-tertiary)' }} className={isUnlocked ? 'animate-pulse' : ''}>
          {isUnlocked ? 'OVERRIDE READY // ENTER PASSKEY' : 'CONTAINMENT LOCK ACTIVE'}
        </span>
      </div>

      {!isUnlocked ? (
        <div style={{ padding: '32px', borderRadius: '16px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            <Lock size={28} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FINAL SECURITY LOCK ENGAGED
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 0 auto', lineHeight: 1.6 }}>
              Complete all six levels to decrypt all clue shards and activate the master emergency override console.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(0, 217, 255, 0.4)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', boxShadow: '0 0 25px rgba(0, 217, 255, 0.3)' }}>
            <KeyRound size={32} className="animate-pulse" />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ENTER 6-DIGIT MASTER OVERRIDE PASSKEY
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 0 auto', fontFamily: 'var(--font-mono)' }}>
              Synthesize your 6 unlocked clue shards to calculate the final numeric sequence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                maxLength={6}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                disabled={isSubmitting}
                style={{ width: '100%', textAlign: 'center', fontSize: '30px', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '0.5em', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-dark)', border: '2px solid rgba(0, 217, 255, 0.5)', color: '#a5f3fc', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
              />
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fda4af', backgroundColor: 'rgba(136, 19, 55, 0.6)', border: '1px solid rgba(159, 18, 57, 1)', padding: '10px 16px', borderRadius: '12px', width: '100%', textAlign: 'left' }} className="animate-fade-in">
                <AlertCircle size={16} color="#fb7185" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || passkey.length !== 6}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
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
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
