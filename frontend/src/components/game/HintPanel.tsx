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
  currentLevel,
  currentStage = 1,
  isOpen,
  onClose,
  onUseHint,
}) => {
  if (!isOpen) return null;

  const handleRequest = (hintNum: number) => {
    soundService.playClick();
    if (onUseHint) {
      onUseHint(hintNum);
    }
  };

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
                LEVEL 0{currentLevel || 1} · STAGE 0{currentStage}
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
          {hints.length === 0 ? (
            <div className="hints-empty-state">
              <p>NO HINTS CURRENTLY LOGGED FOR THIS STAGE.</p>
            </div>
          ) : (
            <div className="hints-list">
              {hints.map((hint, idx) => {
                const hintNum = hint.hintNumber || idx + 1;
                const isUnlocked = hint.isUnlocked && !!hint.hintContent;

                return (
                  <div
                    key={`${hint.levelNumber}-${hintNum}`}
                    className={`hint-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="hint-item-header">
                      <div className="hint-item-title">
                        {isUnlocked ? (
                          <Unlock size={13} style={{ color: 'var(--status-warning)' }} />
                        ) : (
                          <Lock size={13} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span>HINT 0{hintNum}</span>
                      </div>

                      {isUnlocked && (
                        <span className="hint-unlocked-badge">REVEALED</span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <div className="hint-content-box">
                        <p className="hint-content-text">{hint.hintContent}</p>
                      </div>
                    ) : (
                      <div className="hint-lock-action">
                        <p className="hint-prompt-text">
                          Unlock a tactical hint for this stage.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRequest(hintNum)}
                          className="hint-request-btn"
                        >
                          <span>REVEAL HINT 0{hintNum}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
