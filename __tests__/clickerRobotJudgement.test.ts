import { CLICKER_ROBOTS } from '../src/config';
import {
  calculateClickerRobotJudgement,
  calculateClickerRobotJudgementBase,
} from '../src/domain/clickerRobotJudgement';
import { getCookieFragmentStats } from '../src/domain/cookieFragments';
import { calculateCookieStats } from '../src/domain/gameSelectors';
import { gameReducer, initialGameState } from '../src/state/gameReducer';

describe('클릭커 로봇 공용 희귀 판정', () => {
  const cookiesPerSecond = 500;
  const baseAmount = 100;

  test('전체 로봇을 합쳐 0.2초 생산량 한 번만 판정한다', () => {
    expect(CLICKER_ROBOTS.rareJudgement.intervalMs).toBe(200);
    expect(calculateClickerRobotJudgementBase(cookiesPerSecond)).toBe(baseAmount);

    const transition = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0.99,
      0.99,
    );

    expect(transition.amount).toBe(baseAmount);
    expect(transition.rareEvent).toBeUndefined();
    expect(transition.pityMisses).toEqual({
      critical: 1,
      superCritical: 1,
      magma: 1,
      electric: 1,
    });
  });

  test('크리티컬은 개별 로봇 수가 아니라 공용 생산 묶음에 한 번 배수를 적용한다', () => {
    const stats = calculateCookieStats(initialGameState);
    const critical = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0.001,
      0.99,
    );
    const superCritical = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0,
      0.99,
    );

    expect(critical.amount).toBe(baseAmount * stats.criticalRewardMultiplier);
    expect(critical.rareEvent?.critical).toEqual({
      kind: 'critical',
      amount: baseAmount * stats.criticalRewardMultiplier,
    });
    expect(superCritical.amount).toBe(
      baseAmount * stats.superCriticalRewardMultiplier,
    );
    expect(superCritical.rareEvent?.critical?.kind).toBe('superCritical');
  });

  test('조각은 무료 플라잉 클릭커가 공용 생산 묶음 배수로 즉시 회수한다', () => {
    const magmaStats = getCookieFragmentStats(initialGameState, 'magma');
    const electricStats = getCookieFragmentStats(initialGameState, 'electric');
    const magma = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0.99,
      0,
    );
    const electric = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0.99,
      0.002,
    );

    expect(magma.rareEvent?.fragment).toEqual({
      kind: 'magma',
      multiplier: magmaStats.rewardMultiplier,
      amount: baseAmount * magmaStats.rewardMultiplier,
    });
    expect(magma.amount).toBe(baseAmount * (1 + magmaStats.rewardMultiplier));
    expect(electric.rareEvent?.fragment).toEqual({
      kind: 'electric',
      multiplier: electricStats.rewardMultiplier,
      amount: baseAmount * electricStats.rewardMultiplier,
    });
  });

  test('클릭커 전용 천장 카운터를 저장 상태에 반영한다', () => {
    const transition = calculateClickerRobotJudgement(
      initialGameState,
      initialGameState.clickerRobotPityMisses,
      cookiesPerSecond,
      0.99,
      0.99,
    );
    const next = gameReducer(initialGameState, {
      type: 'APPLY_CLICKER_ROBOT_PRODUCTION',
      amount: transition.amount,
      pityMisses: transition.pityMisses,
    });

    expect(next.cookies).toBe(BigInt(baseAmount));
    expect(next.lifetimeCookies).toBe(BigInt(baseAmount));
    expect(next.clickerRobotPityMisses).toEqual(transition.pityMisses);
  });
});
