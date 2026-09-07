import React, { useEffect, useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import './FaultyTerminal.css';

export interface TerminalLineItem {
  id: string;
  content: string;
  variant?: 'normal' | 'cyan' | 'success' | 'warning' | 'danger';
  delayMs?: number;
  promptChar?: string;
}

interface FaultyTerminalProps {
  lines: TerminalLineItem[];
  title?: string;
  isGlitching?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const FaultyTerminal: React.FC<FaultyTerminalProps> = ({
  lines,
  title = 'SECURE KERNEL TELEMETRY',
  isGlitching = false,
  onComplete,
  className = '',
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(0);

  useEffect(() => {
    let currentIdx = 0;
    const timers: number[] = [];

    const scheduleNext = () => {
      if (currentIdx >= lines.length) {
        if (onComplete) onComplete();
        return;
      }

      const nextLine = lines[currentIdx];
      const delay = nextLine.delayMs ?? 250;

      const t = window.setTimeout(() => {
        currentIdx++;
        setVisibleCount(currentIdx);
        scheduleNext();
      }, delay);

      timers.push(t);
    };

    scheduleNext();

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [lines]);

  const displayedLines = lines.slice(0, visibleCount);
  const currentLine = displayedLines[displayedLines.length - 1];
  const isDangerCursor = currentLine?.variant === 'danger';

  return (
    <div className={`faulty-terminal ${className}`}>
      <div className="faulty-terminal-header">
        <div className="faulty-terminal-title">
          <TerminalIcon size={14} />
          <span>{title}</span>
        </div>
        <div className="faulty-terminal-dots">
          <div className="faulty-terminal-dot" />
          <div className="faulty-terminal-dot" />
          <div className="faulty-terminal-dot" />
        </div>
      </div>

      <div className="faulty-terminal-body">
        {displayedLines.map((line) => (
          <div key={line.id} className={`terminal-line terminal-line-${line.variant || 'normal'}`}>
            <span className="terminal-line-prompt">{line.promptChar ?? '>'}</span>
            <span>{line.content}</span>
          </div>
        ))}
        <div className="terminal-line">
          <span className="terminal-line-prompt">&gt;</span>
          <span
            className={`terminal-cursor ${isDangerCursor || isGlitching ? 'cursor-danger' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};
