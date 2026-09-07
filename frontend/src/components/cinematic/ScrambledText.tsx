import React, { useState, useEffect } from 'react';

interface ScrambledTextProps {
  text: string;
  className?: string;
  glitchRate?: number; // 0.0 to 1.0 probability of a glyph being glitchy on tick
  intervalMs?: number;
  active?: boolean;
}

const GLYPHS = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789';

export const ScrambledText: React.FC<ScrambledTextProps> = ({
  text,
  className = '',
  glitchRate = 0.15,
  intervalMs = 120,
  active = true,
}) => {
  const [scrambled, setScrambled] = useState(text);

  useEffect(() => {
    if (!active) {
      setScrambled(text);
      return;
    }

    const interval = window.setInterval(() => {
      const result = text
        .split('')
        .map((char) => {
          if (char === ' ') return ' ';
          if (Math.random() < glitchRate) {
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          return char;
        })
        .join('');
      setScrambled(result);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [text, glitchRate, intervalMs, active]);

  return <span className={`scrambled-text font-mono ${className}`}>{scrambled}</span>;
};
