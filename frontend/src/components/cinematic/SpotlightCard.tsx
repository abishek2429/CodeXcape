import React, { useRef } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'danger' | 'obsidian';
  showCorners?: boolean;
  className?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  variant = 'cyan',
  showCorners = true,
  className = '',
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const dangerClass = variant === 'danger' ? 'spotlight-danger' : '';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${dangerClass} ${className}`}
      {...rest}
    >
      {showCorners && (
        <>
          <div className="spotlight-card-corner-tl" />
          <div className="spotlight-card-corner-tr" />
          <div className="spotlight-card-corner-bl" />
          <div className="spotlight-card-corner-br" />
        </>
      )}
      <div className="spotlight-card-content">{children}</div>
    </div>
  );
};
