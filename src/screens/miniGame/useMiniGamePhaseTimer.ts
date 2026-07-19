import { useCallback, useEffect, useRef, useState } from 'react';

interface MiniGamePhaseTimerOptions {
  active: boolean;
  durationMs: number;
  refreshIntervalMs: number;
  onFinished: () => void;
}

export function useMiniGamePhaseTimer({
  active,
  durationMs,
  refreshIntervalMs,
  onFinished,
}: MiniGamePhaseTimerOptions) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const endAtRef = useRef(0);
  const completedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!active) {
      endAtRef.current = 0;
      completedRef.current = false;
      setRemainingMs(durationMs);
      return undefined;
    }
    completedRef.current = false;
    endAtRef.current = Date.now() + durationMs;
    setRemainingMs(durationMs);
    const tick = () => {
      const next = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(next);
      if (next > 0 || completedRef.current) return;
      completedRef.current = true;
      onFinishedRef.current();
    };
    const interval = setInterval(tick, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [active, durationMs, refreshIntervalMs]);

  const acceptsClick = useCallback(() => (
    active && !completedRef.current && Date.now() < endAtRef.current
  ), [active]);

  return { remainingMs, acceptsClick };
}
