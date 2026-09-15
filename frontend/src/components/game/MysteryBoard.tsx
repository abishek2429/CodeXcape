import React, { useState } from 'react';
import { HelpCircle, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import { SIX_MYSTERY_RIDDLES, MysteryRiddle } from '../../config/riddleConfig';
import { soundService } from '../../services/soundService';

interface MysteryBoardProps {
  completedLevelsCount: number;
}

export const MysteryBoard: React.FC<MysteryBoardProps> = ({ completedLevelsCount }) => {
  const [selectedRiddleId, setSelectedRiddleId] = useState<number | null>(() => {
    // Default to latest unlocked riddle or null
    return completedLevelsCount > 0 ? Math.min(completedLevelsCount, 6) : 1;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const unlockedCount = Math.min(Math.max(completedLevelsCount, 0), 6);

  const handleSelectRiddle = (riddle: MysteryRiddle, isUnlocked: boolean) => {
    if (!isUnlocked) {
      soundService.playError();
      return;
    }
    soundService.playSelect();
    setSelectedRiddleId((prev) => (prev === riddle.id ? null : riddle.id));
  };

  const activeRiddle = SIX_MYSTERY_RIDDLES.find((r) => r.id === selectedRiddleId);
  const isActiveUnlocked = activeRiddle ? activeRiddle.levelNumber <= completedLevelsCount : false;

  return (
    <div
      className="cyber-panel"
      style={{
        padding: '18px 20px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-cyan)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.75)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isCollapsed ? 'none' : '1px dashed var(--border-cyan)',
          paddingBottom: isCollapsed ? '0' : '12px',
          marginBottom: isCollapsed ? '0' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(0, 217, 255, 0.12)',
              border: '1px solid var(--border-cyan)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={15} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '12px',
                letterSpacing: '0.12em',
                fontWeight: 800,
                color: 'var(--text-cold-white)',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              MYSTERY BOARD
            </h2>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              REASONING RIDDLES: <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{unlockedCount} / 6 UNLOCKED</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              color: unlockedCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid var(--border-dim)',
            }}
          >
            META PUZZLE
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isCollapsed ? 'Expand Mystery Board' : 'Collapse Mystery Board'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Riddle Slot Selector Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            {SIX_MYSTERY_RIDDLES.map((riddle) => {
              const isUnlocked = completedLevelsCount >= riddle.levelNumber;
              const isSelected = selectedRiddleId === riddle.id;

              return (
                <button
                  key={riddle.id}
                  type="button"
                  onClick={() => handleSelectRiddle(riddle, isUnlocked)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid',
                    borderColor: isSelected
                      ? 'var(--accent-cyan)'
                      : isUnlocked
                      ? 'var(--border-dim)'
                      : 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected
                      ? 'rgba(0, 217, 255, 0.2)'
                      : isUnlocked
                      ? 'rgba(0, 217, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.5)',
                    color: isSelected
                      ? 'var(--accent-cyan)'
                      : isUnlocked
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(0, 217, 255, 0.25)' : 'none',
                  }}
                  title={isUnlocked ? `${riddle.romanNumeral}: ${riddle.title}` : `Locked. Complete Level ${riddle.levelNumber} to unlock.`}
                >
                  <div style={{ fontSize: '9px', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    {isUnlocked ? <span style={{ color: 'var(--accent-cyan)' }}>◆</span> : <span>◇</span>}
                    <span>L0{riddle.levelNumber}</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800 }}>
                    {riddle.romanNumeral.replace('RIDDLE ', '')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Riddle Inspection Panel */}
          {activeRiddle && isActiveUnlocked ? (
            <div
              style={{
                backgroundColor: 'rgba(5, 7, 10, 0.75)',
                border: '1px solid var(--border-cyan)',
                borderRadius: 'var(--radius-xs)',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
                    {activeRiddle.romanNumeral} — {activeRiddle.title}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>[{activeRiddle.clueRole}]</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--accent-cyan)' }}>
                  <Unlock size={11} />
                  <span>UNLOCKED</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  lineHeight: '1.7',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {activeRiddle.riddleText}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border-dim)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>SHARED TEAM CLUE</span>
                <span style={{ color: 'var(--accent-cyan)' }}>PERSISTS ACROSS ALL LEVELS</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(5, 7, 10, 0.4)',
                border: '1px dashed var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Lock size={20} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                {unlockedCount === 0
                  ? 'COMPLETE LEVEL 1 TO UNLOCK YOUR FIRST MYSTERY RIDDLE'
                  : 'SELECT AN UNLOCKED RIDDLE ABOVE TO REVIEW EVIDENCE'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
