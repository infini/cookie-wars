import { CLICKER_ROBOTS } from '../config';
import type {
  ClickerRobotRareEvent,
  CookiePityMisses,
  GameState,
} from '../types/game';
import { calculateCookieClickTransition } from './cookieClick';
import { getCookieFragmentStats } from './cookieFragments';
import { saturatingAdd, saturatingProductInteger } from './safeNumbers';
import { calculateCookieStats } from './selectors/cookieSelectors';

export interface ClickerRobotJudgementTransition {
  amount: number;
  pityMisses: CookiePityMisses;
  rareEvent?: ClickerRobotRareEvent;
}

export function calculateClickerRobotJudgementBase(
  cookiesPerSecond: number,
): number {
  return saturatingProductInteger(
    cookiesPerSecond,
    CLICKER_ROBOTS.rareJudgement.intervalMs / 1000,
    'floor',
  );
}

export function calculateClickerRobotJudgement(
  state: GameState,
  pityMisses: CookiePityMisses,
  cookiesPerSecond: number,
  criticalRandomUnit: number,
  fragmentRandomUnit: number,
): ClickerRobotJudgementTransition {
  const baseAmount = calculateClickerRobotJudgementBase(cookiesPerSecond);
  if (baseAmount <= 0) return { amount: 0, pityMisses };

  const clickTransition = calculateCookieClickTransition(
    { ...state, cookiePityMisses: pityMisses },
    criticalRandomUnit,
    fragmentRandomUnit,
  );
  const cookieStats = calculateCookieStats(state);
  const critical = clickTransition.result.kind === 'normal'
    ? undefined
    : {
      kind: clickTransition.result.kind,
      amount: saturatingProductInteger(
        baseAmount,
        clickTransition.result.kind === 'superCritical'
          ? cookieStats.superCriticalRewardMultiplier
          : cookieStats.criticalRewardMultiplier,
      ),
    };
  const fragmentKind = clickTransition.result.spawnedFragmentKind;
  const fragmentStats = fragmentKind
    ? getCookieFragmentStats(state, fragmentKind)
    : undefined;
  const fragment = fragmentKind && fragmentStats
    ? {
      kind: fragmentKind,
      multiplier: fragmentStats.rewardMultiplier,
      amount: saturatingProductInteger(baseAmount, fragmentStats.rewardMultiplier),
    }
    : undefined;
  const amount = saturatingAdd(
    critical?.amount ?? baseAmount,
    fragment?.amount ?? 0,
  );

  return {
    amount,
    pityMisses: clickTransition.pityMisses,
    ...((critical || fragment) ? { rareEvent: { critical, fragment } } : {}),
  };
}
