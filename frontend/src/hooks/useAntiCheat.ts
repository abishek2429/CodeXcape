import { useEffect, useRef, useState } from 'react';
import { reportAntiCheatEvent, fetchTeamAntiCheatSummary, AntiCheatSummary } from '../services/antiCheatService';

interface UseAntiCheatProps {
  isActive: boolean;
  onViolationAlert?: (message: string) => void;
}

export function useAntiCheat({ isActive, onViolationAlert }: UseAntiCheatProps) {
  const [teamSummary, setTeamSummary] = useState<AntiCheatSummary | null>(null);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  const isGracePeriodRef = useRef(true);
  const lastReportedTimeRef = useRef<Record<string, number>>({});
  const onViolationRef = useRef(onViolationAlert);
  onViolationRef.current = onViolationAlert;

  // Refresh team anti-cheat summary from backend
  const refreshSummary = async () => {
    try {
      const summary = await fetchTeamAntiCheatSummary();
      setTeamSummary(summary);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    if (isActive) {
      refreshSummary();
    }
  }, [isActive]);

  // Grace period on initial mount/activation (3 seconds) to prevent false positives during page load/transitions
  useEffect(() => {
    if (!isActive) return;

    isGracePeriodRef.current = true;
    const timer = setTimeout(() => {
      isGracePeriodRef.current = false;
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const sendCandidate = async (eventType: string) => {
      if (isGracePeriodRef.current) {
        return;
      }

      const now = Date.now();
      const last = lastReportedTimeRef.current[eventType] || 0;
      // Client-side debounce: 3 seconds
      if (now - last < 3000) {
        return;
      }
      lastReportedTimeRef.current[eventType] = now;

      try {
        const res = await reportAntiCheatEvent(eventType);
        if (res.accepted && res.message) {
          setLastAlert(res.message);
          if (onViolationRef.current) {
            onViolationRef.current(res.message);
          }
          refreshSummary();
        }
      } catch {
        // Fail gracefully; anti-cheat should never crash player gameplay
      }
    };

    // 1. Visibility change listener (Tab switch / window minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendCandidate('TAB_SWITCH');
      } else if (document.visibilityState === 'visible') {
        sendCandidate('VISIBILITY_RESTORED');
      }
    };

    // 2. Fullscreen change listener
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (!isFullscreen) {
        sendCandidate('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive]);

  return {
    teamSummary,
    lastAlert,
    refreshSummary,
    clearLastAlert: () => setLastAlert(null),
  };
}
