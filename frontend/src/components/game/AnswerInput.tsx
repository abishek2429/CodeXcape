import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Terminal } from 'lucide-react';
import { AnswerType } from '../../types/game';
import { CinematicButton } from '../cinematic/CinematicButton';
import { soundService } from '../../services/soundService';

interface AnswerInputProps {
  answerType: AnswerType;
  placeholderText?: string;
  options?: string[];
  puzzleMetadata?: string;
  stageKey?: string;
  onSubmit: (answer: string, interactionPayload?: string) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  answerType,
  placeholderText,
  options: propOptions,
  puzzleMetadata,
  stageKey,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  // Reset answer field whenever the active stage changes
  useEffect(() => {
    setAnswer('');
    setSubmittedFeedback(null);
  }, [stageKey]);

  // Parse options safely from metadata if not explicitly provided as prop
  let availableOptions: string[] = propOptions || [];
  if (availableOptions.length === 0 && puzzleMetadata) {
    try {
      const parsed = JSON.parse(puzzleMetadata);
      if (Array.isArray(parsed.options)) {
        availableOptions = parsed.options;
      }
    } catch {
      availableOptions = [];
    }
  }

  const handleOptionClick = (opt: string) => {
    setAnswer(opt);
    soundService.playSelect();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    soundService.playClick();
    const submission = answer.trim();
    onSubmit(submission);
    setSubmittedFeedback(`> SOLUTION TRANSMITTED: "${submission.toUpperCase()}"...`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  const isMcq = answerType === 'MULTIPLE_CHOICE' || availableOptions.length > 0;

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-cyan)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px dashed var(--border-cyan)',
        }}
      >
        <h2
          style={{
            fontSize: '13px',
            letterSpacing: '0.12em',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-cyan)',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          <Terminal size={15} />
          <span>TEAM ANSWER</span>
        </h2>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {answerType} INPUT MODE
        </span>
      </div>

      {submittedFeedback && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(0, 217, 255, 0.08)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={16} />
          <span className="font-bold">{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Option Selectors for Multiple Choice */}
        {isMcq && availableOptions.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>
              SELECT AN OPTION OR TYPE SOLUTION BELOW:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(availableOptions.length, 4)}, 1fr)`, gap: '10px' }}>
              {availableOptions.map((opt) => {
                const isSelected = answer.trim().toUpperCase() === opt.trim().toUpperCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleOptionClick(opt)}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-dim)',
                      backgroundColor: isSelected ? 'rgba(0, 217, 255, 0.18)' : 'rgba(0, 0, 0, 0.5)',
                      color: isSelected ? 'var(--text-cold-white)' : 'var(--text-secondary)',
                      boxShadow: isSelected ? '0 0 16px rgba(0, 217, 255, 0.3)' : 'none',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Text / Numeric Input Field */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontWeight: 800,
              fontSize: '16px',
              color: 'var(--accent-cyan)',
              pointerEvents: 'none',
            }}
          >
            &gt;
          </div>
          <input
            type={answerType === 'NUMERIC' ? 'number' : 'text'}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="cyber-input"
            placeholder={
              placeholderText ||
              (answerType === 'NUMERIC'
                ? 'ENTER NUMERIC VALUE_'
                : isMcq
                ? 'SELECT OR TYPE OPTION (e.g. A, B, C, D)_'
                : 'ENTER SOLUTION_')
            }
            disabled={isSubmitting}
            style={{ paddingLeft: '40px', paddingRight: '90px', fontSize: '15px', height: '52px' }}
          />
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-dim)',
            }}
          >
            {answerType}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CinematicButton
            variant="primary"
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.1em' }}
          >
            {isSubmitting ? (
              <span>SUBMITTING ANSWER...</span>
            ) : (
              <>
                <span>SUBMIT</span>
                <Send size={15} />
              </>
            )}
          </CinematicButton>
        </div>
      </form>
    </div>
  );
};
