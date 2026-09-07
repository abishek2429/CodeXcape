import React, { useEffect, useState } from 'react';
import './PixelTransition.css';

interface PixelTransitionProps {
  isActive: boolean;
  duration?: number; // total duration ms
  gridCols?: number;
  gridRows?: number;
  variant?: 'obsidian' | 'crimson';
  onComplete?: () => void;
}

export const PixelTransition: React.FC<PixelTransitionProps> = ({
  isActive,
  duration = 450,
  gridCols = 10,
  gridRows = 7,
  variant = 'obsidian',
  onComplete,
}) => {
  const [blocksState, setBlocksState] = useState<boolean[]>([]);
  const totalBlocks = gridCols * gridRows;

  useEffect(() => {
    if (!isActive) {
      setBlocksState(new Array(totalBlocks).fill(false));
      return;
    }

    // Generate random stagger order
    const indices = Array.from({ length: totalBlocks }, (_, i) => i);
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const interval = duration / totalBlocks;

    const timers: number[] = [];

    indices.forEach((blockIndex, step) => {
      const t = window.setTimeout(() => {
        setBlocksState((prev) => {
          const next = [...prev];
          next[blockIndex] = true;
          return next;
        });
      }, step * interval);
      timers.push(t);
    });

    const completionTimer = window.setTimeout(() => {
      if (onComplete) onComplete();
    }, duration + 60);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      clearTimeout(completionTimer);
    };
  }, [isActive, totalBlocks, duration]);

  if (!isActive && blocksState.every((b) => !b)) return null;

  return (
    <div
      className="pixel-transition-overlay"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: totalBlocks }).map((_, idx) => (
        <div
          key={idx}
          className={`pixel-transition-block ${blocksState[idx] ? 'active' : ''} ${variant === 'crimson' ? 'danger' : ''}`}
        />
      ))}
    </div>
  );
};
