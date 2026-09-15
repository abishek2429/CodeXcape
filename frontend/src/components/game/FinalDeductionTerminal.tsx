import React, { useState } from 'react';
import { Terminal, Lock, HelpCircle, Send, CheckCircle2, AlertOctagon } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES } from '../../config/riddleConfig';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';
import { soundService } from '../../services/soundService';
import { CinematicButton } from '../cinematic/CinematicButton';

interface FinalDeductionTerminalProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  onSuccess?: () => void;
}

export const FinalDeductionTerminal: React.FC<FinalDeductionTerminalProps> = ({
  isUnlocked,
  isCompleted,
  onSuccess,
}) => {
  const [deductionInput, setDeductionInput] = useState('');
  const [selectedRiddleIndex, setSelectedRiddleIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (isCompleted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || isCompleted || isSubmitting) return;

    const trimmed = deductionInput.trim();
    if (!trimmed) {
      setFeedbackMsg('PLEASE ENTER YOUR FINAL SYNTHESIS DEDUCTION.');
      setIsError(true);
      soundService.playError();
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res: FinalPasskeyResponse = await submitFinalPasskey(trimmed);
      if (res.status === 'COMPLETED' || res.status === 'ALREADY_COMPLETED') {
        soundService.playFinalEscape();
        setIsError(false);
        setFeedbackMsg('DEDUCTION VERIFIED. CORE PROTOCOL DECRYPTED. ESCAPE GRANTED.');
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        soundService.playWrongAnswer();
        setIsError(true);
        setFeedbackMsg(res.message || 'SYNTHESIS REJECTED: INVALID LOGICAL CONCLUSION. REVIEW RIDDLES I–V.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        soundService.playError();
        setIsError(true);
        setFeedbackMsg('TERMINAL UNAVAILABLE. COMPLETE ALL 6 TIERS FIRST.');
      } else {
        soundService.playError();
        setIsError(true);
        setFeedbackMsg(res.message || 'SUBMISSION REJECTED.');
      }
    } catch (err: any) {
      soundService.playError();
      setIsError(true);
      setFeedbackMsg(err.message || 'TRANSMISSION ERROR. VERIFY TELESYNC CONNECTION.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid',
        borderColor: isUnlocked ? 'var(--accent-cyan)' : 'var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: isUnlocked ? '0 0 45px rgba(0, 217, 255, 0.2)' : 'none',
        transition: 'all 0.3s ease',
        fontFamily: 'var(--font-mono)',
        marginTop: '20px',
      }}
    >
      {/* Terminal Title Bar */}
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
              backgroundColor: isUnlocked ? 'rgba(0, 217, 255, 0.15)' : 'rgba(0, 0, 0, 0.5)',
              border: '1px solid',
              borderColor: isUnlocked ? 'var(--accent-cyan)' : 'var(--border-dim)',
              color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}
          >
            <Terminal size={18} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '13px',
                letterSpacing: '0.12em',
                fontWeight: 800,
                color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)',
                margin: 0,
              }}
            >
              THE FINAL DEDUCTION
            </h2>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {isUnlocked
                ? 'ALL SIX RIDDLES RECOVERED // SYNTHESIZE META DEDUCTION'
                : 'SECURITY LOCK ACTIVE // COMPLETE LEVEL 6 TO RECOVER FINAL RIDDLE'}
            </div>
          </div>
        </div>

        <span
          className={`badge ${isUnlocked ? 'badge-cyan animate-pulse' : ''}`}
          style={{
            border: isUnlocked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-dim)',
            color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '10px',
          }}
        >
          {isUnlocked ? 'OVERRIDE READY // INPUT SYNTHESIS' : 'CONTAINMENT LOCK ACTIVE'}
        </span>
      </div>

      {!isUnlocked ? (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'rgba(5, 7, 10, 0.5)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-dim)',
          }}
        >
          <Lock size={26} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            FINAL REASONING TERMINAL LOCKED
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            Complete all 6 levels to gather all six general logic riddles and activate the Final Deduction Console.
          </div>
        </div>
      ) : (
        <div>
          {/* Instructions Header */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-cold-white)', fontWeight: 700, margin: '0 0 6px 0' }}>
              You have recovered all six riddles. Review your discoveries.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              The team must collaborate over your answers to Riddles I through V to answer Riddle VI's connecting question.
            </p>
          </div>

          {/* Tabbed Review of All 6 Riddles */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {SIX_MYSTERY_RIDDLES.map((riddle, idx) => {
                const isSelected = selectedRiddleIndex === idx;
                return (
                  <button
                    key={riddle.id}
                    type="button"
                    onClick={() => setSelectedRiddleIndex(idx)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-dim)',
                      backgroundColor: isSelected ? 'rgba(0, 217, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div>{riddle.romanNumeral}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{riddle.clueRole}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Riddle Text Viewer */}
            <div
              style={{
                backgroundColor: 'rgba(5, 8, 14, 0.9)',
                border: '1px solid var(--border-cyan)',
                borderRadius: 'var(--radius-xs)',
                padding: '16px 20px',
                fontSize: '12px',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                {SIX_MYSTERY_RIDDLES[selectedRiddleIndex].romanNumeral} — {SIX_MYSTERY_RIDDLES[selectedRiddleIndex].title} [{SIX_MYSTERY_RIDDLES[selectedRiddleIndex].clueRole}]
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {SIX_MYSTERY_RIDDLES[selectedRiddleIndex].riddleText}
              </div>
            </div>
          </div>

          {/* Final Question Section */}
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: 'rgba(0, 217, 255, 0.06)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>
              <HelpCircle size={15} />
              <span>FINAL QUESTION</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-cold-white)', lineHeight: '1.6', margin: 0 }}>
              Use everything you have discovered. Arrange what you found from the first five riddles.
              <br />
              <strong style={{ color: 'var(--accent-cyan)' }}>What single idea connects all five?</strong>
            </p>
          </div>

          {feedbackMsg && (
            <div
              className="animate-fade-in"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isError ? 'rgba(225, 29, 72, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: '1px solid',
                borderColor: isError ? 'var(--accent-crimson)' : 'var(--status-success)',
                color: isError ? 'var(--accent-crimson)' : 'var(--status-success)',
                fontSize: '12px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isError ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
              <span className="font-bold">{feedbackMsg}</span>
            </div>
          )}

          {/* Response Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.08em' }}>
                TEAM FINAL RESPONSE:
              </div>
              <input
                type="text"
                value={deductionInput}
                onChange={(e) => setDeductionInput(e.target.value)}
                placeholder="ENTER CONNECTING IDEA (e.g. TIME, STATE, INVARIANCE)..."
                disabled={isSubmitting}
                className="cyber-input"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  backgroundColor: 'rgba(2, 4, 7, 0.95)',
                  border: '2px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  borderRadius: 'var(--radius-xs)',
                }}
              />
            </div>

            <CinematicButton
              variant="primary"
              type="submit"
              disabled={!deductionInput.trim() || isSubmitting}
              style={{ width: '100%', padding: '16px', fontSize: '13px', fontWeight: 900, letterSpacing: '0.12em' }}
            >
              {isSubmitting ? (
                <span>EVALUATING FINAL DEDUCTION...</span>
              ) : (
                <>
                  <span>SUBMIT FINAL DEDUCTION</span>
                  <Send size={15} />
                </>
              )}
            </CinematicButton>
          </form>
        </div>
      )}
    </div>
  );
};
