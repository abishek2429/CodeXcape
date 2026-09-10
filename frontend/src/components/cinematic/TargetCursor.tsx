import React, { useEffect, useState, useRef } from 'react';
import './TargetCursor.css';

interface TargetCursorProps {
  enabled?: boolean;
}

export const TargetCursor: React.FC<TargetCursorProps> = ({ enabled = true }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDanger, setIsDanger] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const pos = useRef({ x: -100, y: -100 });
  const targetPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  const isVisibleRef = useRef(false);

  useEffect(() => {
    // Disable custom reticle on touch / coarse pointer devices
    const isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!enabled || !isFinePointer) return;

    let isRunning = false;

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        animFrameId.current = requestAnimationFrame(loop);
      }
    };

    const loop = () => {
      const dx = targetPos.current.x - pos.current.x;
      const dy = targetPos.current.y - pos.current.y;

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        pos.current.x = targetPos.current.x;
        pos.current.y = targetPos.current.y;
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
        }
        isRunning = false;
        return; // Idle when mouse position has settled
      }

      pos.current.x += dx * 0.35;
      pos.current.y += dy * 0.35;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      animFrameId.current = requestAnimationFrame(loop);
    };

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
      startLoop();

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
      isVisibleRef.current = false;
      setIsVisible(false);
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
      startLoop();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="target-cursor-container" aria-hidden="true">
      <div
        ref={cursorRef}
        className={`target-cursor ${isHovering ? 'is-hovering' : ''} ${isDanger ? 'is-danger' : ''}`}
        style={{
          transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`,
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
