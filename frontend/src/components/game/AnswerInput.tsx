import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { AnswerType } from '../../types/game';
import { soundService } from '../../services/soundService';

interface AnswerInputProps {
  stageId: string | number;
  answerType: AnswerType;
  placeholderText?: string;
  options?: string[];
  puzzleMetadata?: string;
  onSubmit: (answer: string, interactionPayload?: string) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  stageId,
  answerType,
  placeholderText,
  options: propOptions,
  puzzleMetadata,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answer, setAnswer] = useState('');
  const prevStageIdRef = useRef<string | number>(stageId);

  // FIX STALE ANSWER INPUT:
  // Reset input ONLY when the stage identifier changes (previousStageId !== currentStageId)
  // Does NOT clear on re-renders, does NOT erase text while typing on the current stage.
  useEffect(() => {
    if (prevStageIdRef.current !== stageId) {
      prevStageIdRef.current = stageId;
      setAnswer('');
    }
  }, [stageId]);

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
    const trimmed = answer.trim();
    if (!trimmed || isSubmitting) return;

    soundService.playClick();
    onSubmit(trimmed);
  };

  const isMcq = answerType === 'MULTIPLE_CHOICE' || availableOptions.length > 0;

  return (
    <div className="answer-section">
      <div className="answer-header">
        <span className="answer-label">TEAM ANSWER</span>
      </div>

      <form onSubmit={handleSubmit} className="answer-form">
        {/* MCQ option selectors (if applicable) */}
        {isMcq && availableOptions.length > 0 && (
          <div className="answer-options-grid">
            {availableOptions.map((opt) => {
              const isSelected = answer.trim().toUpperCase() === opt.trim().toUpperCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  className={`answer-option-btn ${isSelected ? 'selected' : ''}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Answer input field & Submit button */}
        <div className="answer-input-row">
          <input
            type={answerType === 'NUMERIC' ? 'number' : 'text'}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="answer-input-field"
            placeholder={
              placeholderText ||
              (answerType === 'NUMERIC'
                ? "Enter your team's numeric answer..."
                : isMcq
                ? 'Select an option or type answer...'
                : "Enter your team's answer...")
            }
            disabled={isSubmitting}
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="answer-submit-btn"
          >
            <span>{isSubmitting ? 'TRANSMITTING...' : 'SUBMIT'}</span>
            {!isSubmitting && <Send size={14} />}
          </button>
        </div>
      </form>
    </div>
  );
};
