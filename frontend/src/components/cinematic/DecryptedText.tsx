import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number; // ms per frame
  maxIterations?: number;
  characters?: string;
  className?: string;
  animateOn?: 'view' | 'hover';
  sequential?: boolean;
  onComplete?: () => void;
}

const DEFAULT_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*$@!?<>/[]{}';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 12,
  characters = DEFAULT_CHARACTERS,
  className = '',
  animateOn = 'view',
  sequential = true,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const startAnimation = () => {
    let iteration = 0;
    const len = text.length;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (sequential) {
              const revealThreshold = Math.floor((iteration / maxIterations) * len);
              if (index < revealThreshold) return text[index];
            } else if (iteration >= maxIterations) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('');
      });

      iteration++;
      if (iteration > maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsDecrypted(true);
        if (onComplete) onComplete();
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      startAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOn]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      startAnimation();
    }
  };

  return (
    <span
      className={`decrypted-text font-mono ${className} ${isDecrypted ? 'is-decrypted' : 'is-decrypting'}`}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </span>
  );
};
