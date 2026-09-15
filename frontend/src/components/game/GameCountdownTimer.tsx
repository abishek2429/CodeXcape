import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface GameCountdownTimerProps {
  deadline?: string | null;
  serverTime?: string | null;
  onExpire?: () => void;
  className?: string;
}

export const GameCountdownTimer: React.FC<GameCountdownTimerProps> = ({
  deadline,
  serverTime,
  onExpire,
  className = '',
}) => {
  // Compute initial server offset to align client clock with server authority
  const offsetRef = useRef<number>(
    serverTime ? new Date(serverTime).getTime() - Date.now() : 0
  );
  useEffect(() => {
    if (serverTime) {
      offsetRef.current = new Date(serverTime).getTime() - Date.now();
    }
  }, [serverTime]);

  const calculateRemaining = () => {
    if (!deadline) return null;
    const now = Date.now() + offsetRef.current;
    const target = new Date(deadline).getTime();
    return Math.max(0, Math.ceil((target - now) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(calculateRemaining);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setRemainingSeconds(calculateRemaining());
    hasExpiredRef.current = false;

    if (!deadline) return;

    const interval = window.setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining === 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadline, serverTime]);

  if (remainingSeconds === null) {
    return null;
  }

  const isTimerCritical = remainingSeconds < 300; // < 5 mins
  const isTimerWarning = remainingSeconds < 900; // < 15 mins

  const totalMinutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`game-countdown-timer ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: isTimerCritical
          ? 'var(--accent-crimson-bright)'
          : isTimerWarning
          ? 'var(--status-warning)'
          : 'var(--text-cold-white)',
        fontSize: '18px',
        fontWeight: 800,
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
        textShadow: isTimerCritical ? '0 0 12px rgba(225, 6, 19, 0.6)' : 'none',
      }}
      role="timer"
      aria-live="polite"
    >
      <Clock
        size={14}
        className={isTimerCritical ? 'animate-pulse' : ''}
        style={{
          opacity: 0.6,
          color: isTimerCritical ? 'var(--accent-crimson-bright)' : 'var(--text-secondary)',
        }}
      />
      <span className={isTimerCritical ? 'animate-pulse' : ''}>{formatted}</span>
    </div>
  );
};
