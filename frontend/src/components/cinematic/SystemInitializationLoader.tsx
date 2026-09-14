import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../../services/soundService';
import { Shield, Cpu, Terminal, Radio } from 'lucide-react';
import './SystemInitializationLoader.css';

interface SystemInitializationLoaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

const STAGES = [
  { text: '> ESTABLISHING SECURE LINK...', threshold: 0 },
  { text: '> VERIFYING TWO OPERATORS...', threshold: 25 },
  { text: '> SYNCHRONIZING CHALLENGE NODES...', threshold: 52 },
  { text: '> LOADING ESCAPE PROTOCOL...', threshold: 78 },
  { text: '> SYSTEM READY', threshold: 100 },
];

export const SystemInitializationLoader: React.FC<SystemInitializationLoaderProps> = ({
  onComplete,
  minDurationMs = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isGlitchingOut, setIsGlitchingOut] = useState(false);

  const soundPlayedRef = useRef(false);
  const lastStageSoundRef = useRef(0);
  const completionTriggeredRef = useRef(false);

  // Play initial loading audio once on mount
  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      soundService.playLoadingScreen();
    }
  }, []);

  // Smooth progress calculation & status stage progression
  useEffect(() => {
    const startTime = Date.now();
    let animFrameId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const rawRatio = Math.min(elapsed / minDurationMs, 1);

      // Smooth easeInOutQuad curve
      const easedRatio =
        rawRatio < 0.5
          ? 2 * rawRatio * rawRatio
          : 1 - Math.pow(-2 * rawRatio + 2, 2) / 2;

      const currentPercent = Math.min(Math.floor(easedRatio * 100), 100);
      setProgress(currentPercent);

      // Determine active stage
      let stageIdx = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (currentPercent >= STAGES[i].threshold) {
          stageIdx = i;
          break;
        }
      }

      setCurrentStageIndex((prev) => {
        if (stageIdx > prev && stageIdx < STAGES.length - 1) {
          // Play subtle tick for intermediate stage progression
          if (lastStageSoundRef.current !== stageIdx) {
            lastStageSoundRef.current = stageIdx;
            soundService.playSelect(0.18);
          }
          return stageIdx;
        }
        return stageIdx;
      });

      if (rawRatio < 1) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        // Reached 100%
        setProgress(100);
        setCurrentStageIndex(STAGES.length - 1);
        setIsReady(true);

        if (!completionTriggeredRef.current) {
          completionTriggeredRef.current = true;
          // Play system unlock / arena ready confirmation sound
          soundService.playArenaEnter(0.42);

          // Hold 100% state briefly (450ms), then trigger short glitch/scan transition (350ms)
          setTimeout(() => {
            setIsGlitchingOut(true);
            soundService.playGlitchTransition(0.35);

            setTimeout(() => {
              soundService.stopLoadingScreen();
              if (onComplete) {
                onComplete();
              }
            }, 350);
          }, 450);
        }
      }
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [minDurationMs, onComplete]);

  const formattedPercent = progress.toString().padStart(2, '0');
  const activeStage = STAGES[currentStageIndex];

  return (
    <div className={`codexcape-loader-container ${isGlitchingOut ? 'loader-glitch-exit' : ''}`}>
      {/* Background Ambience & Scanline Effects */}
      <div className="loader-scanlines" aria-hidden="true" />
      <div className="loader-grid-bg" aria-hidden="true" />
      <div className="loader-radial-glow" aria-hidden="true" />

      {/* Screen Edge HUD Coordinates */}
      <div className="loader-hud-corner corner-top-left">
        <span className="hud-label">SEC://BOOT.01</span>
        <div className="hud-bracket-tl" />
      </div>
      <div className="loader-hud-corner corner-top-right">
        <span className="hud-label">SYS_FREQ::44.1KHZ</span>
        <div className="hud-bracket-tr" />
      </div>
      <div className="loader-hud-corner corner-bottom-left">
        <span className="hud-label">NET://NODE.COOP</span>
        <div className="hud-bracket-bl" />
      </div>
      <div className="loader-hud-corner corner-bottom-right">
        <span className="hud-label">CLEARANCE::OP_LVL</span>
        <div className="hud-bracket-br" />
      </div>

      {/* Center Initialization HUD Module */}
      <main className="loader-hud-module animate-fade-in">
        {/* Top Header Strip */}
        <div className="loader-header-strip">
          <div className="loader-header-left">
            <Radio size={12} className="loader-ping-icon" />
            <span className="loader-brand-title">CODEXCAPE // SYSTEM INITIALIZATION</span>
          </div>
          <div className="loader-badge-coop">
            <span>TWO OPERATORS // ONE MISSION</span>
          </div>
        </div>

        {/* Center System Core Icon */}
        <div className="loader-core-wrapper">
          <div className={`loader-core-ring-outer ${isReady ? 'core-illuminated' : ''}`}>
            <div className="loader-core-ring-inner" />
            <div className="loader-core-scan-beam" />
            <div className="loader-core-icon">
              <Cpu size={42} className={`core-cpu-svg ${isReady ? 'cpu-ready' : ''}`} />
            </div>
          </div>
          {/* Digital Reticle Crosshair */}
          <div className="loader-reticle-crosshair" aria-hidden="true">
            <div className="crosshair-h" />
            <div className="crosshair-v" />
          </div>
        </div>

        {/* Loading Titles */}
        <div className="loader-titles-section">
          <h1 className="loader-main-title">
            {isReady ? (
              <span className="text-ready-glow">SYSTEM READY</span>
            ) : (
              'INITIALIZING CODEXCAPE'
            )}
          </h1>
          <p className="loader-subtitle">
            {isReady ? 'AUTHENTICATED DIRECT ACCESS GRANTED' : 'SECURE SYSTEM BOOT...'}
          </p>
        </div>

        {/* Dynamic Status Display */}
        <div className="loader-status-console">
          <div className="status-terminal-line">
            <span className="status-cursor-mark">&gt;</span>
            <span className={`status-message-text ${isReady ? 'status-text-ready' : ''}`}>
              {activeStage.text.replace('> ', '')}
            </span>
            <span className="status-blinking-cursor">_</span>
          </div>
        </div>

        {/* Futuristic Segmented Progress Bar */}
        <div className="loader-progress-section">
          <div className="loader-progress-track">
            <div
              className={`loader-progress-fill ${isReady ? 'progress-fill-ready' : ''}`}
              style={{ width: `${progress}%` }}
            >
              <div className="progress-glow-head" />
            </div>
            {/* Segmentation markers */}
            <div className="loader-progress-grid-overlay" />
          </div>

          <div className="loader-progress-telemetry">
            <span className="telemetry-label">
              {isReady ? 'INITIALIZATION COMPLETE' : 'INITIALIZING...'}
            </span>
            <span className="telemetry-percent">{formattedPercent}%</span>
          </div>
        </div>

        {/* Bottom Micro-Telemetry Footer */}
        <div className="loader-footer-telemetry">
          <div className="telemetry-node-item">
            <Terminal size={11} />
            <span>OPERATOR 01 // SYNCED</span>
          </div>
          <div className="telemetry-node-divider">/</div>
          <div className="telemetry-node-item">
            <Shield size={11} />
            <span>OPERATOR 02 // SYNCED</span>
          </div>
        </div>
      </main>
    </div>
  );
};
