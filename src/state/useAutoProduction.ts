import { useEffect } from 'react';
import { PROGRESSION } from '../config';
import { calculateProductionForElapsedTime } from '../domain/offlineProduction';
import type { OfflineProductionResult } from '../domain/offlineProduction';
import {
  clampSafeInteger,
  MAX_GAME_INTEGER,
  saturatingAdd,
  saturatingProductInteger,
} from '../domain/safeNumbers';
import type { ProjectedGameDispatch } from './gameRuntime';

export interface AutoProductionTick {
  lastProductionAt: number;
  production: OfflineProductionResult;
}

interface AutoProductionOptions {
  hydrated: boolean;
  autoProduction: number;
  dispatchProjectedAction: ProjectedGameDispatch;
}

export function calculateAutoProductionTick(
  autoProduction: number,
  lastProductionAt: number,
  now: number,
): AutoProductionTick {
  const safeNow = clampSafeInteger(now);
  const normalizedLastProductionAt = clampSafeInteger(lastProductionAt, {
    fallback: safeNow,
  });
  const safeLastProductionAt = normalizedLastProductionAt === MAX_GAME_INTEGER
    && safeNow < normalizedLastProductionAt
    ? safeNow
    : normalizedLastProductionAt;
  const production = calculateProductionForElapsedTime(
    autoProduction,
    safeNow - safeLastProductionAt,
  );
  const completedDuration = saturatingProductInteger(
    production.completedIntervals,
    PROGRESSION.autoProductionIntervalMs,
    'floor',
  );
  return {
    lastProductionAt: production.completedIntervals > 0
      ? saturatingAdd(safeLastProductionAt, completedDuration)
      : safeLastProductionAt,
    production,
  };
}

export function useAutoProduction({
  hydrated,
  autoProduction,
  dispatchProjectedAction,
}: AutoProductionOptions): void {
  useEffect(() => {
    if (!hydrated || autoProduction <= 0) return undefined;
    let lastProductionAt = Date.now();
    const timer = setInterval(() => {
      const tick = calculateAutoProductionTick(
        autoProduction,
        lastProductionAt,
        Date.now(),
      );
      if (tick.production.completedIntervals <= 0) return;
      lastProductionAt = tick.lastProductionAt;
      dispatchProjectedAction({
        type: 'GAIN_COOKIES',
        amount: tick.production.cookiesEarned,
      });
    }, PROGRESSION.autoProductionIntervalMs);
    return () => clearInterval(timer);
  }, [hydrated, autoProduction, dispatchProjectedAction]);
}
