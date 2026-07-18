import { COOKIE_CRITICAL } from '../src/config';
import { calculateCookieClickReward } from '../src/domain/cookieClick';
import {
  formatCriticalChancePercent,
  getCookieCriticalStats,
} from '../src/domain/cookieCritical';
import { calculateCookieStats } from '../src/domain/gameSelectors';
import { initialGameState } from '../src/state/gameReducer';

describe('쿠키 클릭 크리티컬', () => {
  test('기본 확률은 정확히 1%이고 성공하면 기본 클릭 보상의 10배를 지급한다', () => {
    const stats = calculateCookieStats(initialGameState);
    const critical = calculateCookieClickReward(initialGameState, 0.0099);
    const normal = calculateCookieClickReward(initialGameState, 0.01);

    expect(stats.criticalChanceUnits / COOKIE_CRITICAL.probabilityScale).toBe(0.01);
    expect(stats.criticalRewardMultiplier).toBe(10);
    expect(critical).toEqual({ amount: stats.clickPower * 10, critical: true });
    expect(normal).toEqual({ amount: stats.clickPower, critical: false });
  });

  test('0.25% 단위 강화도 화면에서 버리지 않고 표시한다', () => {
    expect(formatCriticalChancePercent(100)).toBe('1');
    expect(formatCriticalChancePercent(125)).toBe('1.25');
  });

  test('강화 레벨이 오르면 확률과 배수가 함께 오르고 확률만 50%에서 멈춘다', () => {
    const highLevelState = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        cookieCritical: 10_000,
      },
    };
    const stats = getCookieCriticalStats(highLevelState);

    expect(stats.chanceUnits).toBe(COOKIE_CRITICAL.maximumChanceUnits);
    expect(stats.rewardMultiplier).toBeGreaterThan(
      COOKIE_CRITICAL.baseRewardMultiplier,
    );
    expect(calculateCookieClickReward(highLevelState, 0.4999).critical).toBe(true);
    expect(calculateCookieClickReward(highLevelState, 0.5).critical).toBe(false);
  });
});
