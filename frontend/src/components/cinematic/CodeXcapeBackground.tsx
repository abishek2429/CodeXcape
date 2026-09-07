import React, { useEffect, useRef } from 'react';
import './CodeXcapeBackground.css';

interface CodeXcapeBackgroundProps {
  showAnomalyNode?: boolean;
  intensity?: 'minimal' | 'normal' | 'cinematic';
}

export const CodeXcapeBackground: React.FC<CodeXcapeBackgroundProps> = ({
  showAnomalyNode = true,
  intensity = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Node count scaled by screen size, kept lightweight
    const nodeCount = intensity === 'minimal' ? 20 : intensity === 'cinematic' ? 45 : 32;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      isAnomaly: boolean;
      label?: string;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const isAnomaly = showAnomalyNode && i === 6;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isAnomaly ? 0.2 : 0.15),
        vy: (Math.random() - 0.5) * (isAnomaly ? 0.2 : 0.15),
        radius: isAnomaly ? 3 : Math.random() * 1.5 + 1,
        isAnomaly,
        label: i < 6 ? `NODE 0${i + 1}` : undefined,
      });
    }

    let scanLineY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle scanning horizon line
      scanLineY = (scanLineY + 0.5) % height;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(width, scanLineY);
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Draw connections between nearby nodes (Circuit / Threads feeling)
      const maxDist = intensity === 'cinematic' ? 140 : 110;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;

        if (n1.x < 0) n1.x = width;
        if (n1.x > width) n1.x = 0;
        if (n1.y < 0) n1.y = height;
        if (n1.y > height) n1.y = 0;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            if (n1.isAnomaly || n2.isAnomaly) {
              ctx.strokeStyle = `rgba(225, 29, 72, ${alpha * 1.6})`;
              ctx.lineWidth = 0.8;
            } else {
              ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
            }
            ctx.stroke();
          }
        }
      }

      // 3. Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.isAnomaly) {
          ctx.fillStyle = 'rgba(225, 29, 72, 0.85)';
          ctx.shadowColor = 'rgba(225, 29, 72, 0.8)';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(0, 217, 255, 0.4)';
          ctx.shadowColor = 'rgba(0, 217, 255, 0.3)';
          ctx.shadowBlur = 3;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [showAnomalyNode, intensity]);

  return (
    <div className="codexcape-bg-container" aria-hidden="true">
      <canvas ref={canvasRef} className="codexcape-bg-canvas" />
      <div className="codexcape-noise" />
      <div className="codexcape-crt-overlay" />
      <div className="codexcape-bg-graticule codexcape-bg-graticule-tl" />
      <div className="codexcape-bg-graticule codexcape-bg-graticule-tr" />
      <div className="codexcape-bg-graticule codexcape-bg-graticule-bl" />
      <div className="codexcape-bg-graticule codexcape-bg-graticule-br" />
    </div>
  );
};
