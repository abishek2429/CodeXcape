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
  const offsetRef = useRef<number>(0);
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
  }, [deadline]);

  if (remainingSeconds === null) {
    return null;
  }

  const isTimerCritical = remainingSeconds < 300; // < 5 mins
  const isTimerWarning = remainingSeconds < 900; // < 15 mins

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`game-countdown-timer ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: isTimerCritical
          ? 'rgba(225, 29, 72, 0.15)'
          : isTimerWarning
          ? 'rgba(245, 158, 11, 0.1)'
          : 'rgba(0, 0, 0, 0.6)',
        border: '1px solid',
        borderColor: isTimerCritical
          ? 'var(--accent-crimson)'
          : isTimerWarning
          ? 'var(--status-warning)'
          : 'var(--border-cyan)',
        color: isTimerCritical
          ? 'var(--accent-crimson)'
          : isTimerWarning
          ? 'var(--status-warning)'
          : 'var(--accent-cyan)',
        boxShadow: isTimerCritical ? 'var(--glow-crimson)' : 'none',
        fontSize: '13px',
        fontWeight: 800,
        letterSpacing: '0.08em',
        fontFamily: 'var(--font-mono)',
      }}
      role="timer"
      aria-live="polite"
    >
      <Clock size={14} className={isTimerCritical ? 'animate-pulse' : ''} />
      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TIME REMAINING:</span>
      <span>{formatted}</span>
    </div>
  );
};
