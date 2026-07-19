import { COOKIE_CRITICAL, COOKIE_SUPER_CRITICAL } from '../src/config';
import { calculateCookieClickReward } from '../src/domain/cookieClick';
import {
  formatCriticalChancePercent,
  getCookieCriticalStats,
} from '../src/domain/cookieCritical';
import {
  formatSuperCriticalChancePercent,
  getCookieSuperCriticalStats,
} from '../src/domain/cookieSuperCritical';
import { calculateCookieStats } from '../src/domain/gameSelectors';
import { initialGameState } from '../src/state/gameReducer';

describe('쿠키 클릭 크리티컬', () => {
  test('기본 확률은 정확히 1%이고 성공하면 기본 클릭 보상의 10배를 지급한다', () => {
    const stats = calculateCookieStats(initialGameState);
    const superCritical = calculateCookieClickReward(initialGameState, 0.0009);
    const critical = calculateCookieClickReward(initialGameState, 0.001);
    const normal = calculateCookieClickReward(initialGameState, 0.011);

    expect(stats.criticalChanceUnits / COOKIE_CRITICAL.probabilityScale).toBe(0.01);
    expect(stats.criticalRewardMultiplier).toBe(10);
    expect(stats.superCriticalChanceUnits / COOKIE_SUPER_CRITICAL.probabilityScale).toBe(0.001);
    expect(stats.superCriticalRewardMultiplier).toBe(100);
    expect(superCritical).toEqual({ amount: stats.clickPower * 100, kind: 'superCritical' });
    expect(critical).toEqual({ amount: stats.clickPower * 10, kind: 'critical' });
    expect(normal).toEqual({ amount: stats.clickPower, kind: 'normal' });
  });

  test('0.25% 단위 강화도 화면에서 버리지 않고 표시한다', () => {
    expect(formatCriticalChancePercent(100)).toBe('1');
    expect(formatCriticalChancePercent(125)).toBe('1.25');
    expect(formatSuperCriticalChancePercent(10)).toBe('0.1');
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
    expect(calculateCookieClickReward(highLevelState, 0.5009).kind).toBe('critical');
    expect(calculateCookieClickReward(highLevelState, 0.501).kind).toBe('normal');
  });

  test('슈퍼 크리티컬도 확률 상한 뒤 배수는 무한히 성장한다', () => {
    const highLevelState = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        cookieSuperCritical: 10_000,
      },
    };
    const stats = getCookieSuperCriticalStats(highLevelState);
    expect(stats.chanceUnits).toBe(COOKIE_SUPER_CRITICAL.maximumChanceUnits);
    expect(stats.rewardMultiplier).toBeGreaterThan(
      COOKIE_SUPER_CRITICAL.baseRewardMultiplier,
    );
  });
});
