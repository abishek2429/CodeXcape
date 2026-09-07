import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  padZero?: boolean;
  className?: string;
  onComplete?: () => void;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 800,
  prefix = '',
  suffix = '',
  padZero = true,
  className = '',
  onComplete,
}) => {
  const [current, setCurrent] = useState<number>(from);
  const startValRef = useRef(from);
  const startTimeRef = useRef<number | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    startValRef.current = current;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startValRef.current + (to - startValRef.current) * eased);
      setCurrent(val);

      if (progress < 1) {
        animIdRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(to);
        if (onComplete) onComplete();
      }
    };

    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [to, duration]);

  const formatted = padZero && current < 10 && current >= 0 ? `0${current}` : `${current}`;

  return (
    <span className={`count-up font-mono ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
