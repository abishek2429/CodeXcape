import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { CountUp } from '../cinematic/CountUp';
import { soundService } from '../../services/soundService';
import './RankDisplay.css';

interface RankDisplayProps {
  currentRank: number;
  className?: string;
}

export const RankDisplay: React.FC<RankDisplayProps> = ({ currentRank, className = '' }) => {
  const [prevRank, setPrevRank] = useState<number>(currentRank);
  const [shiftText, setShiftText] = useState<string | null>(null);

  useEffect(() => {
    if (prevRank !== currentRank) {
      const fromFormatted = prevRank < 10 ? `0${prevRank}` : `${prevRank}`;
      const toFormatted = currentRank < 10 ? `0${currentRank}` : `${currentRank}`;
      setShiftText(`#${fromFormatted} → #${toFormatted}`);
      soundService.playRadarPip();

      const timer = window.setTimeout(() => {
        setShiftText(null);
      }, 5000);

      setPrevRank(currentRank);
      return () => clearTimeout(timer);
    }
  }, [currentRank, prevRank]);

  return (
    <div className={`rank-display-card ${className}`}>
      <div className="rank-display-label">YOUR POSITION</div>
      <div className="rank-display-value">
        <Trophy size={14} color="var(--status-warning)" />
        <CountUp to={currentRank} from={prevRank} prefix="#" duration={600} />
        {shiftText && (
          <span className="rank-shift-pill" title="Position Updated">
            {shiftText}
          </span>
        )}
      </div>
    </div>
  );
};
