import React, { useEffect, useState, useRef } from 'react';
import './TargetCursor.css';

interface TargetCursorProps {
  enabled?: boolean;
}

export const TargetCursor: React.FC<TargetCursorProps> = ({ enabled = true }) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDanger, setIsDanger] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const targetPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Fast pointer event listener
    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Inspect target element for interactive cues
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, input, select, textarea, [role="button"], [data-targetable="true"], .interactive-target'
      );
      setIsHovering(Boolean(interactive));

      const dangerElem = target.closest('.is-danger, [data-danger="true"], .banner-error');
      setIsDanger(Boolean(dangerElem));
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth lerp loop for physical inertia feel
    const loop = () => {
      setPosition((prev) => {
        const dx = targetPos.current.x - prev.x;
        const dy = targetPos.current.y - prev.y;
        return {
          x: prev.x + dx * 0.35,
          y: prev.y + dy * 0.35,
        };
      });
      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [enabled, isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="target-cursor-container" aria-hidden="true">
      <div
        className={`target-cursor ${isHovering ? 'is-hovering' : ''} ${isDanger ? 'is-danger' : ''}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`,
        }}
      >
        <div className="target-cursor-hairline-x" />
        <div className="target-cursor-hairline-y" />
        <div className="target-cursor-reticle" />
        <div className="target-cursor-pip" />
      </div>
    </div>
  );
};
