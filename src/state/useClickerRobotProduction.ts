import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { CLICKER_ROBOTS } from '../config';
import { calculateClickerRobotJudgement } from '../domain/clickerRobotJudgement';
import { saturatingAdd, saturatingProductInteger } from '../domain/safeNumbers';
import type { ClickerRobotRareEvent, CookiePityMisses } from '../types/game';
import type { GameStateReference, ProjectedGameDispatch } from './gameRuntime';

interface ClickerRobotProductionOptions {
  hydrated: boolean;
  cookiesPerSecond: number;
  dispatchProjectedAction: ProjectedGameDispatch;
  stateRef: GameStateReference;
  onRareJudgement: (event: ClickerRobotRareEvent) => void;
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
  stateRef,
  onRareJudgement,
}: ClickerRobotProductionOptions): void {
  const pityMissesRef = useRef<CookiePityMisses>(
    stateRef.current.clickerRobotPityMisses,
  );

  useEffect(() => {
    if (!hydrated || cookiesPerSecond <= 0) return undefined;
    pityMissesRef.current = { ...stateRef.current.clickerRobotPityMisses };
    const judgementsPerProduction = (
      CLICKER_ROBOTS.productionIntervalMs / CLICKER_ROBOTS.rareJudgement.intervalMs
    );
    let pendingAmount = 0;
    let pendingJudgements = 0;

    const flushProduction = () => {
      if (pendingJudgements <= 0) return;
      dispatchProjectedAction({
        type: 'APPLY_CLICKER_ROBOT_PRODUCTION',
        amount: pendingAmount,
        pityMisses: pityMissesRef.current,
      });
      pendingAmount = 0;
      pendingJudgements = 0;
    };
    const judgeRobotGroup = () => {
      if (AppState.currentState !== 'active') return;
      const transition = calculateClickerRobotJudgement(
        stateRef.current,
        pityMissesRef.current,
        cookiesPerSecond,
        Math.random(),
        Math.random(),
      );
      pityMissesRef.current = transition.pityMisses;
      pendingAmount = saturatingAdd(pendingAmount, transition.amount);
      pendingJudgements += 1;
      if (transition.rareEvent) onRareJudgement(transition.rareEvent);
      if (pendingJudgements >= judgementsPerProduction) flushProduction();
    };

    const timer = setInterval(
      judgeRobotGroup,
      CLICKER_ROBOTS.rareJudgement.intervalMs,
    );
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') flushProduction();
    });
    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
      flushProduction();
    };
  }, [
    cookiesPerSecond,
    dispatchProjectedAction,
    hydrated,
    onRareJudgement,
    stateRef,
  ]);
}
