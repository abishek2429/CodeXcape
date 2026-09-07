import React, { useRef } from 'react';
import { soundService } from '../../services/soundService';
import './CinematicButton.css';

interface CinematicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  showBrackets?: boolean;
  withSound?: boolean;
}

export const CinematicButton: React.FC<CinematicButtonProps> = ({
  children,
  variant = 'primary',
  showBrackets = true,
  withSound = true,
  className = '',
  onClick,
  onMouseEnter,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btnRef.current.style.setProperty('--mouse-x', `${x}px`);
    btnRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (withSound) {
      if (variant === 'danger') {
        soundService.playAccessDenied();
      } else {
        soundService.playClick();
      }
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`cinematic-btn cinematic-btn-${variant} ${className}`}
      {...rest}
    >
      {showBrackets && <span className="cinematic-btn-bracket">[</span>}
      {children}
      {showBrackets && <span className="cinematic-btn-bracket">]</span>}
    </button>
  );
};
