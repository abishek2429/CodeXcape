import React, { useState } from 'react';
import { X, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES, MysteryRiddle } from '../../config/riddleConfig';
import { soundService } from '../../services/soundService';

interface MysteryBoardProps {
  completedLevelsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MysteryBoard: React.FC<MysteryBoardProps> = ({
  completedLevelsCount,
  isOpen,
  onClose,
}) => {
  const [selectedRiddleId, setSelectedRiddleId] = useState<number | null>(() => {
    return completedLevelsCount > 0 ? Math.min(completedLevelsCount, 6) : null;
  });

  if (!isOpen) return null;

  const unlockedCount = Math.min(Math.max(completedLevelsCount, 0), 6);

  const handleToggleRiddle = (riddle: MysteryRiddle, isUnlocked: boolean) => {
    if (!isUnlocked) {
      soundService.playError();
      return;
    }
    soundService.playSelect();
    setSelectedRiddleId((prev) => (prev === riddle.id ? null : riddle.id));
  };

  return (
    <div className="drawer-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="drawer-panel mystery-drawer animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <HelpCircle size={16} className="text-cyan" />
            <div>
              <h2 className="drawer-title">MYSTERY BOARD</h2>
              <p className="drawer-subtitle">
                INVESTIGATION ARCHIVE · {unlockedCount} / 6 RIDDLES UNLOCKED
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close Mystery Board"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Subtext */}
        <div className="drawer-meta-banner">
          <p>
            General reasoning riddles unlocked upon level completion. Discoveries persist across all levels.
          </p>
        </div>

        {/* Riddles List */}
        <div className="riddles-list">
          {SIX_MYSTERY_RIDDLES.map((riddle) => {
            const isUnlocked = completedLevelsCount >= riddle.levelNumber;
            const isSelected = selectedRiddleId === riddle.id;

            return (
              <div
                key={riddle.id}
                className={`riddle-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
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
                    {isUnlocked ? (
                      <span className="unlocked-diamond">◆</span>
                    ) : (
                      <span className="locked-diamond">◇</span>
                    )}
                  </div>

                  <div className="riddle-title-area">
                    <span className="riddle-numeral">{riddle.romanNumeral}</span>
                    <span className="riddle-title-text">{riddle.title}</span>
                  </div>

                  <div className="riddle-action-indicator">
                    {isUnlocked ? (
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
                      <span>DEDUCTION ROLE: {riddle.clueRole}</span>
                    </div>

                    <p className="riddle-text">
                      {riddle.riddleText}
                    </p>

                    <div className="riddle-footer-note">
                      <span>{riddle.briefPrompt}</span>
                    </div>
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
