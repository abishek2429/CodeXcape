import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ChevronRight, ChevronDown, CheckCircle2, Lock, Send, AlertCircle, Loader2 } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES, MysteryRiddle } from '../../config/riddleConfig';
import { fetchRiddleBoardState, submitRiddleDigit, RiddleItemState } from '../../services/riddleService';
import { soundService } from '../../services/soundService';

interface MysteryBoardProps {
  completedLevelsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onRiddleSolved?: () => void;
}

export const MysteryBoard: React.FC<MysteryBoardProps> = ({
  completedLevelsCount,
  isOpen,
  onClose,
  onRiddleSolved,
}) => {
  const [selectedRiddleId, setSelectedRiddleId] = useState<number | null>(null);
  const [riddleStates, setRiddleStates] = useState<Record<number, RiddleItemState>>({});
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({});
  const [submittingRiddleId, setSubmittingRiddleId] = useState<number | null>(null);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<number, { text: string; isError: boolean }>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load server-authoritative riddle states whenever opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadStates = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRiddleBoardState();
        if (isMounted && data.riddles) {
          const map: Record<number, RiddleItemState> = {};
          data.riddles.forEach((r) => {
            map[r.riddleIndex] = r;
          });
          setRiddleStates(map);

          // Auto-select first unlocked unsolved riddle, or first unlocked riddle
          if (selectedRiddleId === null) {
            const firstActive = SIX_MYSTERY_RIDDLES.find((r) => {
              const state = map[r.id];
              return (state?.status === 'UNLOCKED' || completedLevelsCount >= r.levelNumber) && state?.status !== 'SOLVED';
            }) || SIX_MYSTERY_RIDDLES.find((r) => {
              const state = map[r.id];
              return state?.status === 'SOLVED' || completedLevelsCount >= r.levelNumber;
            });
            if (firstActive) {
              setSelectedRiddleId(firstActive.id);
            }
          }
        }
      } catch {
        // Fallback to completedLevelsCount if network error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStates();
    return () => {
      isMounted = false;
    };
  }, [isOpen, completedLevelsCount]);

  if (!isOpen) return null;

  const handleToggleRiddle = (riddle: MysteryRiddle, isUnlocked: boolean) => {
    if (!isUnlocked) {
      soundService.playError();
      return;
    }
    soundService.playSelect();
    setSelectedRiddleId((prev) => (prev === riddle.id ? null : riddle.id));
    setFeedbackMessages((prev) => ({ ...prev, [riddle.id]: { text: '', isError: false } }));
  };

  const handleDigitChange = (riddleId: number, value: string) => {
    // Only allow single digit from 0 to 9
    const cleaned = value.replace(/\D/g, '').slice(-1);
    setDigitInputs((prev) => ({ ...prev, [riddleId]: cleaned }));
  };

  const handleSubmitDigit = async (riddleId: number, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digit = digitInputs[riddleId]?.trim();
    if (!digit || !/^[0-9]$/.test(digit)) {
      setFeedbackMessages((prev) => ({
        ...prev,
        [riddleId]: { text: 'PLEASE ENTER A SINGLE DIGIT (0–9).', isError: true },
      }));
      soundService.playError();
      return;
    }

    setSubmittingRiddleId(riddleId);
    setFeedbackMessages((prev) => ({ ...prev, [riddleId]: { text: '', isError: false } }));

    try {
      const res = await submitRiddleDigit(riddleId, digit);
      if (res.status === 'SOLVED') {
        soundService.playSelect();
        setRiddleStates((prev) => ({
          ...prev,
          [riddleId]: {
            riddleIndex: riddleId,
            levelNumber: riddleId,
            status: 'SOLVED',
            solvedDigit: res.solvedDigit || digit,
          },
        }));
        setFeedbackMessages((prev) => ({
          ...prev,
          [riddleId]: { text: res.message || 'CORRECT. RIDDLE SOLVED.', isError: false },
        }));
        if (onRiddleSolved) {
          onRiddleSolved();
        }
      } else if (res.status === 'RATE_LIMITED') {
        soundService.playError();
        setFeedbackMessages((prev) => ({
          ...prev,
          [riddleId]: { text: res.message || 'RATE LIMIT ACTIVE. PLEASE WAIT.', isError: true },
        }));
      } else {
        soundService.playWrongAnswer();
        setFeedbackMessages((prev) => ({
          ...prev,
          [riddleId]: { text: res.message || 'INCORRECT. RE-EXAMINE THE CLUES CAREFULLY.', isError: true },
        }));
      }
    } catch (err: any) {
      soundService.playError();
      setFeedbackMessages((prev) => ({
        ...prev,
        [riddleId]: { text: err.message || 'COMMUNICATION ERROR. PLEASE RETRY.', isError: true },
      }));
    } finally {
      setSubmittingRiddleId(null);
    }
  };

  const solvedCount = Object.values(riddleStates).filter((r) => r.status === 'SOLVED').length;
  const unlockedCount = Math.min(Math.max(completedLevelsCount, solvedCount), 6);

  return (
    <div className="drawer-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="drawer-panel mystery-drawer animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <HelpCircle size={18} className="text-cyan" />
            <div>
              <h2 className="drawer-title">RIDDLE BOARD</h2>
              <p className="drawer-subtitle">
                {isLoading
                  ? 'SYNCING ARCHIVE...'
                  : `INVESTIGATION ARCHIVE · ${unlockedCount} / 6 UNLOCKED · ${solvedCount} / 6 SOLVED`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close Riddle Board"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Subtext */}
        <div className="drawer-meta-banner">
          <p>
            Each level completion unlocks a logic riddle. Each riddle derives exactly ONE digit (0–9).
            Combine all six digits in level order (Riddles I–VI) to obtain the Final Key.
          </p>
        </div>

        {/* Riddles List */}
        <div className="riddles-list">
          {SIX_MYSTERY_RIDDLES.map((riddle) => {
            const serverState = riddleStates[riddle.id];
            const isSolved = serverState?.status === 'SOLVED';
            const isUnlocked = isSolved || serverState?.status === 'UNLOCKED' || completedLevelsCount >= riddle.levelNumber;
            const isSelected = selectedRiddleId === riddle.id;
            const isSubmitting = submittingRiddleId === riddle.id;
            const feedback = feedbackMessages[riddle.id];
            const currentDigit = digitInputs[riddle.id] || '';

            return (
              <div
                key={riddle.id}
                className={`riddle-card ${isSolved ? 'solved' : isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
              >
                <div
                  className="riddle-card-header"
                  onClick={() => handleToggleRiddle(riddle, isUnlocked)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleRiddle(riddle, isUnlocked);
                    }
                  }}
                >
                  <div className="riddle-status-icon">
                    {isSolved ? (
                      <CheckCircle2 size={16} className="text-emerald" />
                    ) : isUnlocked ? (
                      <span className="unlocked-diamond">◆</span>
                    ) : (
                      <Lock size={14} className="text-muted" />
                    )}
                  </div>

                  <div className="riddle-title-area">
                    <span className="riddle-numeral">{riddle.romanNumeral}</span>
                    <span className="riddle-title-text">{riddle.title}</span>
                  </div>

                  <div className="riddle-action-indicator">
                    {isSolved ? (
                      <span className="solved-badge font-mono font-bold">SOLVED ✓</span>
                    ) : isUnlocked ? (
                      isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                      <span className="locked-label">LOCKED</span>
                    )}
                  </div>
                </div>

                {/* Expanded Riddle Content */}
                {isUnlocked && isSelected && (
                  <div className="riddle-expanded-content animate-fade-in">
                    <div className="riddle-role-badge">
                      <span>CATEGORY: {riddle.category} · DIFFICULTY: {riddle.difficulty.toUpperCase()}</span>
                    </div>

                    <p className="riddle-text">
                      {riddle.riddleText}
                    </p>

                    <div className="riddle-footer-note">
                      <span>{riddle.briefPrompt}</span>
                    </div>

                    {/* Feedback Banner */}
                    {feedback && feedback.text && (
                      <div className={`riddle-feedback-banner ${feedback.isError ? 'feedback-error' : 'feedback-success'} animate-fade-in`}>
                        {feedback.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        <span>{feedback.text}</span>
                      </div>
                    )}

                    {/* Solved View vs Answer Submission Form */}
                    {isSolved ? (
                      <div className="riddle-solved-panel">
                        <div className="riddle-solved-header">
                          <CheckCircle2 size={16} className="text-emerald" />
                          <span className="font-mono font-bold text-emerald">STATUS: SOLVED</span>
                        </div>
                        {serverState?.solvedDigit && (
                          <div className="riddle-deduced-digit">
                            <span className="digit-label">DEDUCED DIGIT:</span>
                            <span className="digit-value">{serverState.solvedDigit}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => handleSubmitDigit(riddle.id, e)}
                        className="riddle-submission-form"
                      >
                        <div className="riddle-input-label">
                          <span>REQUIRED ANSWER: ONE DIGIT (0–9)</span>
                        </div>
                        <div className="riddle-input-group">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]"
                            maxLength={1}
                            value={currentDigit}
                            onChange={(e) => handleDigitChange(riddle.id, e.target.value)}
                            className="riddle-digit-field font-mono"
                            placeholder="?"
                            disabled={isSubmitting}
                            autoComplete="off"
                          />
                          <button
                            type="submit"
                            disabled={!currentDigit || isSubmitting}
                            className="riddle-submit-btn"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>VERIFYING...</span>
                              </>
                            ) : (
                              <>
                                <span>SUBMIT</span>
                                <Send size={13} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
