import React from 'react';
import { X, HelpCircle, Lock, Unlock } from 'lucide-react';
import { HintData } from '../../types/game';
import { soundService } from '../../services/soundService';

interface HintPanelProps {
  hints: HintData[];
  currentLevel?: number;
  currentStage?: number;
  isOpen: boolean;
  onClose: () => void;
  onUseHint?: (hintNumber: number) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  currentLevel = 1,
  currentStage = 1,
  isOpen,
  onClose,
  onUseHint,
}) => {
  if (!isOpen) return null;

  const handleRequest = (hintNum: number = 1) => {
    soundService.playClick();
    if (onUseHint) {
      onUseHint(hintNum);
    }
  };

  const currentStageHint = hints.find(
    (h) => h.levelNumber === currentLevel && (h.stageNumber === currentStage || (!h.stageNumber && currentStage === 1))
  );
  const isCurrentUnlocked = Boolean(currentStageHint?.isUnlocked && currentStageHint?.hintContent);

  const previousRevealedHints = hints.filter(
    (h) => h.levelNumber === currentLevel && h.stageNumber !== undefined && h.stageNumber !== currentStage && h.isUnlocked && Boolean(h.hintContent)
  );

  return (
    <div className="drawer-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="drawer-panel hint-drawer animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <HelpCircle size={16} style={{ color: 'var(--status-warning)' }} />
            <div>
              <h2 className="drawer-title">STAGE HINTS</h2>
              <p className="drawer-subtitle">
                LEVEL 0{currentLevel} · STAGE 0{currentStage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close Hints"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hints Content */}
        <div className="drawer-body">
          <div className="hints-list">
            {/* Current Stage Hint */}
            <div className={`hint-item ${isCurrentUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="hint-item-header">
                <div className="hint-item-title">
                  {isCurrentUnlocked ? (
                    <Unlock size={13} style={{ color: 'var(--status-warning)' }} />
                  ) : (
                    <Lock size={13} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span>STAGE 0{currentStage} HINT</span>
                </div>

                {isCurrentUnlocked && (
                  <span className="hint-unlocked-badge">REVEALED</span>
                )}
              </div>

              {isCurrentUnlocked ? (
                <div className="hint-content-box">
                  <p className="hint-content-text">{currentStageHint?.hintContent}</p>
                </div>
              ) : (
                <div className="hint-lock-action">
                  <p className="hint-prompt-text">
                    Unlock a tactical hint for this stage (-5 pts).
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRequest(1)}
                    className="hint-request-btn"
                  >
                    <span>REVEAL HINT (-5 PTS)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Previously Revealed Hints in Current Level */}
            {previousRevealedHints.map((prevHint) => (
              <div
                key={`prev-${prevHint.levelNumber}-${prevHint.stageNumber}`}
                className="hint-item unlocked"
                style={{ marginTop: '16px', opacity: 0.85 }}
              >
                <div className="hint-item-header">
                  <div className="hint-item-title">
                    <Unlock size={13} style={{ color: 'var(--status-warning)' }} />
                    <span>STAGE 0{prevHint.stageNumber} HINT (PREVIOUS)</span>
                  </div>
                  <span className="hint-unlocked-badge">REVEALED</span>
                </div>
                <div className="hint-content-box">
                  <p className="hint-content-text">{prevHint.hintContent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
