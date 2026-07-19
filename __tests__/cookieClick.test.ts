import { COOKIE_CRITICAL, COOKIE_FRAGMENTS, COOKIE_SUPER_CRITICAL } from '../src/config';
import {
  calculateCookieClickReward,
  calculateCookieClickTransition,
} from '../src/domain/cookieClick';
import { getCookiePityAttemptLimit } from '../src/domain/cookiePity';
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
    expect(formatCriticalChancePercent(2000)).toBe('1');
    expect(formatCriticalChancePercent(2500)).toBe('1.25');
    expect(formatSuperCriticalChancePercent(200)).toBe('0.1');
  });

  test('기존 슈퍼 크리티컬 레벨에도 레벨당 0.025%p를 소급 적용한다', () => {
    const levelTwentyState = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        cookieSuperCritical: 20,
      },
    };
    const stats = getCookieSuperCriticalStats(levelTwentyState);

    expect(stats.chanceUnits).toBe(1150);
    expect(formatSuperCriticalChancePercent(stats.chanceUnits)).toBe('0.575');
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

  test('쿠키 보상 판정과 별도의 확률로 쿠키 조각을 발견한다', () => {
    expect(calculateCookieClickReward(initialGameState, 0.9, 0)).toMatchObject({
      kind: 'normal',
      spawnedFragmentKind: 'magma',
    });
    expect(calculateCookieClickReward(initialGameState, 0.9, 0.002)).toMatchObject({
      kind: 'normal',
      spawnedFragmentKind: 'electric',
    });
    const noFragment = calculateCookieClickReward(initialGameState, 0, 0.9);
    expect(noFragment.kind).toBe('superCritical');
    expect(noFragment).not.toHaveProperty('spawnedFragmentKind');
  });

  test('현재 10% 크리티컬이 9번 연속 실패하면 10번째는 확정 발동한다', () => {
    const state = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        cookieCritical: 37,
      },
      cookiePityMisses: {
        ...initialGameState.cookiePityMisses,
        critical: 9,
      },
    };
    const stats = calculateCookieStats(state);
    const transition = calculateCookieClickTransition(state, 0.99, 0.99);

    expect(stats.criticalChanceUnits / COOKIE_CRITICAL.probabilityScale).toBe(0.1);
    expect(getCookiePityAttemptLimit(
      stats.criticalChanceUnits,
      COOKIE_CRITICAL.probabilityScale,
    )).toBe(10);
    expect(transition.result.kind).toBe('critical');
    expect(transition.pityMisses.critical).toBe(0);
  });

  test('자연 슈퍼 크리티컬은 일반 크리티컬 천장으로 낮아지지 않고 두 실패 카운터를 모두 초기화한다', () => {
    const state = {
      ...initialGameState,
      cookiePityMisses: {
        ...initialGameState.cookiePityMisses,
        critical: 999,
        superCritical: 999,
      },
    };
    const transition = calculateCookieClickTransition(state, 0, 0.99);

    expect(transition.result.kind).toBe('superCritical');
    expect(transition.pityMisses.critical).toBe(0);
    expect(transition.pityMisses.superCritical).toBe(0);
  });

  test('슈퍼 크리티컬과 전기 조각도 각 확률의 최대 실패 횟수 뒤 확정된다', () => {
    const state = {
      ...initialGameState,
      cookiePityMisses: {
        ...initialGameState.cookiePityMisses,
        superCritical: 999,
        electric: 1999,
      },
    };
    const transition = calculateCookieClickTransition(state, 0.99, 0.99);

    expect(transition.result).toMatchObject({
      kind: 'superCritical',
      spawnedFragmentKind: 'electric',
    });
    expect(transition.pityMisses.superCritical).toBe(0);
    expect(transition.pityMisses.electric).toBe(0);
  });

  test('두 조각 보정이 겹치면 희귀한 전기를 먼저 주고 마그마 보정은 다음 클릭까지 유지한다', () => {
    const magmaLimit = getCookiePityAttemptLimit(400, COOKIE_FRAGMENTS.probabilityScale);
    const electricLimit = getCookiePityAttemptLimit(100, COOKIE_FRAGMENTS.probabilityScale);
    const state = {
      ...initialGameState,
      cookiePityMisses: {
        ...initialGameState.cookiePityMisses,
        magma: magmaLimit - 1,
        electric: electricLimit - 1,
      },
    };
    const electricFirst = calculateCookieClickTransition(state, 0.99, 0.99);
    const magmaNext = calculateCookieClickTransition({
      ...state,
      cookiePityMisses: electricFirst.pityMisses,
    }, 0.99, 0.99);

    expect(electricFirst.result.spawnedFragmentKind).toBe('electric');
    expect(electricFirst.pityMisses.magma).toBe(magmaLimit);
    expect(magmaNext.result.spawnedFragmentKind).toBe('magma');
  });
});
