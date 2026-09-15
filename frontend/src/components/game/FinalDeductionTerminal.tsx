import React, { useState } from 'react';
import { HelpCircle, Send } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES } from '../../config/riddleConfig';
import { submitFinalPasskey, FinalPasskeyResponse } from '../../services/passkeyService';
import { soundService } from '../../services/soundService';

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

  if (!isUnlocked || isCompleted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = deductionInput.trim();
    if (!trimmed) {
      setFeedbackMsg('PLEASE ENTER YOUR TEAM DEDUCTION.');
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
        setFeedbackMsg('DEDUCTION VERIFIED. SYSTEM DECRYPTED. ESCAPE GRANTED.');
        if (onSuccess) onSuccess();
      } else if (res.status === 'INCORRECT') {
        soundService.playWrongAnswer();
        setIsError(true);
        setFeedbackMsg(res.message || 'SYNTHESIS REJECTED. REVIEW RIDDLES I–V CAREFULLY.');
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

  const selectedRiddle = SIX_MYSTERY_RIDDLES[selectedRiddleIndex];

  return (
    <section className="final-deduction-section" aria-label="Final Deduction">
      <div className="final-deduction-header">
        <h1 className="final-deduction-title">THE FINAL DEDUCTION</h1>
        <p className="final-deduction-subtitle">
          You have recovered all six riddles. Review the evidence.
        </p>
      </div>

      {/* Riddles Evidence Selector */}
      <div className="final-riddles-selector">
        <div className="final-riddles-tabs">
          {SIX_MYSTERY_RIDDLES.map((riddle, idx) => {
            const isSelected = selectedRiddleIndex === idx;
            return (
              <button
                key={riddle.id}
                type="button"
                onClick={() => {
                  soundService.playSelect();
                  setSelectedRiddleIndex(idx);
                }}
                className={`final-riddle-tab ${isSelected ? 'selected' : ''}`}
              >
                <span className="tab-numeral">{riddle.romanNumeral}</span>
                <span className="tab-role">{riddle.clueRole}</span>
              </button>
            );
          })}
        </div>

        {/* Active Riddle Inspection Block */}
        <div className="final-riddle-inspection">
          <div className="inspection-header">
            <span className="inspection-title">
              {selectedRiddle.romanNumeral} — {selectedRiddle.title}
            </span>
            <span className="inspection-role">ROLE: {selectedRiddle.clueRole}</span>
          </div>
          <pre className="inspection-text">
            {selectedRiddle.riddleText}
          </pre>
        </div>
      </div>

      {/* Final Question */}
      <div className="final-question-box">
        <div className="question-header">
          <HelpCircle size={15} className="text-cyan" />
          <span>FINAL QUESTION</span>
        </div>
        <p className="question-text">
          Arrange what you discovered from the first five riddles.
          <br />
          <strong>What single idea connects all five?</strong>
        </p>
      </div>

      {feedbackMsg && (
        <div className={`notification-banner ${isError ? 'banner-error' : 'banner-success'} animate-fade-in`}>
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Team Deduction Submission */}
      <form onSubmit={handleSubmit} className="final-deduction-form">
        <div className="answer-header">
          <span className="answer-label">TEAM RESPONSE</span>
        </div>
        <div className="answer-input-row">
          <input
            type="text"
            value={deductionInput}
            onChange={(e) => setDeductionInput(e.target.value)}
            className="answer-input-field"
            placeholder="Enter your team's deduction..."
            disabled={isSubmitting}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!deductionInput.trim() || isSubmitting}
            className="answer-submit-btn"
          >
            <span>{isSubmitting ? 'VERIFYING...' : 'SUBMIT'}</span>
            {!isSubmitting && <Send size={14} />}
          </button>
        </div>
      </form>
    </section>
  );
};
