import { useEffect } from 'react';
import { CLICKER_ROBOTS } from '../config';
import { saturatingProductInteger } from '../domain/safeNumbers';
import type { ProjectedGameDispatch } from './gameRuntime';

interface ClickerRobotProductionOptions {
  hydrated: boolean;
  cookiesPerSecond: number;
  dispatchProjectedAction: ProjectedGameDispatch;
}

export function calculateClickerRobotProductionTick(cookiesPerSecond: number): number {
  return saturatingProductInteger(
    cookiesPerSecond,
    CLICKER_ROBOTS.productionIntervalMs / 1000,
    'floor',
  );
}

export function useClickerRobotProduction({
  hydrated,
  cookiesPerSecond,
  dispatchProjectedAction,
}: ClickerRobotProductionOptions): void {
  useEffect(() => {
    if (!hydrated || cookiesPerSecond <= 0) return undefined;
    const cookiesPerTick = calculateClickerRobotProductionTick(cookiesPerSecond);
    if (cookiesPerTick <= 0) return undefined;
    const timer = setInterval(() => {
      dispatchProjectedAction({ type: 'GAIN_COOKIES', amount: cookiesPerTick });
    }, CLICKER_ROBOTS.productionIntervalMs);
    return () => clearInterval(timer);
  }, [cookiesPerSecond, dispatchProjectedAction, hydrated]);
}
