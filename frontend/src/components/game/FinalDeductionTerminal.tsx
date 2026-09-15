import React, { useState } from 'react';
import { Lock, Send, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';
import { soundService } from '../../services/soundService';

interface FinalDeductionTerminalProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  allRiddlesSolved: boolean;
  solvedRiddlesCount: number;
  onOpenRiddleBoard?: () => void;
  onSuccess?: () => void;
}

export const FinalDeductionTerminal: React.FC<FinalDeductionTerminalProps> = ({
  isUnlocked,
  isCompleted,
  allRiddlesSolved,
  solvedRiddlesCount,
  onOpenRiddleBoard,
  onSuccess,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isUnlocked || isCompleted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = passkeyInput.trim();
    if (!trimmed || trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setFeedbackMsg('PLEASE ENTER THE COMPLETE 6-DIGIT NUMERIC KEY.');
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
        setFeedbackMsg('ACCESS GRANTED. ESCAPE PROTOCOL AUTHORIZED.');
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        soundService.playWrongAnswer();
        setIsError(true);
        setFeedbackMsg(res.message || 'ACCESS DENIED: INVALID KEY SEQUENCE.');
      } else if (res.status === 'FINAL_NOT_AVAILABLE') {
        soundService.playError();
        setIsError(true);
        setFeedbackMsg(res.message || 'FINAL KEY TERMINAL IS LOCKED. SOLVE ALL 6 RIDDLES FIRST.');
      } else {
        soundService.playError();
        setIsError(true);
        setFeedbackMsg(res.message || 'SUBMISSION REJECTED.');
      }
    } catch (err: any) {
      soundService.playError();
      setIsError(true);
      setFeedbackMsg(err.message || 'TRANSMISSION ERROR. VERIFY NETWORK CONNECTION.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (val: string) => {
    // Only accept numeric digits up to 6 chars
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPasskeyInput(cleaned);
    if (feedbackMsg) setFeedbackMsg(null);
  };

  return (
    <section className="final-deduction-section animate-fade-in" aria-label="Final Key Terminal">
      <div className="final-deduction-header">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={22} className="text-cyan" />
          <h1 className="final-deduction-title">THE FINAL KEY</h1>
        </div>
        <p className="final-deduction-subtitle">
          All six tiers have been surmounted. Synthesize your deductions to enter the final six-digit escape key.
        </p>
      </div>

      {/* Prerequisite check: All 6 riddles must be solved */}
      {!allRiddlesSolved ? (
        <div className="final-locked-warning animate-fade-in">
          <div className="locked-warning-icon">
            <Lock size={28} className="text-amber-400" />
          </div>
          <div className="locked-warning-content">
            <h2 className="text-lg font-mono font-bold text-amber-300 mb-1">
              FINAL KEY TERMINAL LOCKED
            </h2>
            <p className="text-sm text-muted mb-3">
              To obtain the 6-digit key, operators must solve all 6 riddles on the Riddle Board.
              Each riddle deduces exactly one digit. Combine them in level order (Riddles I through VI).
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs px-2 py-1 rounded bg-slate-800 text-cyan border border-cyan/30">
                RIDDLE PROGRESS: {solvedRiddlesCount} / 6 SOLVED
              </span>
              {onOpenRiddleBoard && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onOpenRiddleBoard();
                  }}
                  className="px-3 py-1 text-xs font-mono font-bold rounded bg-cyan/20 text-cyan hover:bg-cyan/30 border border-cyan/40 transition-colors"
                >
                  OPEN RIDDLE BOARD →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="final-input-container animate-fade-in">
          <div className="final-prompt-card">
            <p className="text-sm text-slate-300 mb-1">
              Combine the six digits deduced from <strong>Riddle I</strong> through <strong>Riddle VI</strong> in level order:
            </p>
            <p className="text-xs text-muted font-mono">
              [Riddle 1] + [Riddle 2] + [Riddle 3] + [Riddle 4] + [Riddle 5] + [Riddle 6]
            </p>
          </div>

          {feedbackMsg && (
            <div
              className={`notification-banner ${isError ? 'banner-error' : 'banner-success'} animate-fade-in`}
              style={{ margin: '16px 0' }}
            >
              {isError ? <AlertCircle size={16} /> : <KeyRound size={16} />}
              <span className="terminal-text font-bold">{feedbackMsg}</span>
            </div>
          )}

          {/* 6-Digit Manual Submission Form */}
          <form onSubmit={handleSubmit} className="final-deduction-form">
            <div className="answer-header">
              <span className="answer-label">MASTER 6-DIGIT KEY</span>
              <span className="text-xs text-muted font-mono">MANUAL ENTRY ONLY</span>
            </div>

            <div className="answer-input-row">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={passkeyInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="answer-input-field font-mono text-center tracking-widest text-xl"
                placeholder="• • • • • •"
                disabled={isSubmitting}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={passkeyInput.length !== 6 || isSubmitting}
                className="answer-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHORIZE ESCAPE</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
