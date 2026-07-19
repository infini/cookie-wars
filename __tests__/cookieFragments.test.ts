import { COOKIE_FRAGMENTS } from '../src/config';
import {
  calculateCookieFragmentReward,
  formatCookieFragmentChancePercent,
  getCookieFragmentStats,
  rollCookieFragment,
} from '../src/domain/cookieFragments';
import { calculateCookieStats } from '../src/domain/gameSelectors';
import { initialGameState } from '../src/state/gameReducer';

describe('쿠키 조각', () => {
  test('기본 확률은 마그마 0.2%, 전기 0.05%이고 서로 겹치지 않는다', () => {
    expect(getCookieFragmentStats(initialGameState, 'magma').chanceUnits).toBe(400);
    expect(getCookieFragmentStats(initialGameState, 'electric').chanceUnits).toBe(100);
    expect(COOKIE_FRAGMENTS.types.find((item) => item.id === 'magma')?.baseRewardMultiplier)
      .toBe(50);
    expect(formatCookieFragmentChancePercent(400, 'magma')).toBe('0.2');
    expect(formatCookieFragmentChancePercent(100, 'electric')).toBe('0.05');

    expect(rollCookieFragment(initialGameState, 0)).toBe('magma');
    expect(rollCookieFragment(initialGameState, 0.00199)).toBe('magma');
    expect(rollCookieFragment(initialGameState, 0.002)).toBe('electric');
    expect(rollCookieFragment(initialGameState, 0.00249)).toBe('electric');
    expect(rollCookieFragment(initialGameState, 0.0025)).toBeUndefined();
  });

  test('Lv.1 획득 보상은 현재 클릭 힘의 마그마 50배, 전기 200배다', () => {
    const clickPower = calculateCookieStats(initialGameState).clickPower;
    expect(calculateCookieFragmentReward(initialGameState, 'magma')).toEqual({
      kind: 'magma',
      amount: clickPower * 50,
      multiplier: 50,
    });
    expect(calculateCookieFragmentReward(initialGameState, 'electric')).toEqual({
      kind: 'electric',
      amount: clickPower * 200,
      multiplier: 200,
    });
  });

  test('강화하면 발견 확률과 획득 배수가 함께 오르고 확률 상한 뒤에도 배수는 성장한다', () => {
    const state = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        magmaFragmentChance: 200,
        electricFragmentChance: 200,
      },
    };
    COOKIE_FRAGMENTS.types.forEach((fragment) => {
      const stats = getCookieFragmentStats(state, fragment.id);
      expect(stats.chanceUnits).toBe(fragment.maximumChanceUnits);
      expect(stats.rewardMultiplier).toBe(
        fragment.baseRewardMultiplier + 199 * fragment.rewardMultiplierIncreasePerLevel,
      );
    });

    const higherState = {
      ...state,
      upgradeLevels: {
        ...state.upgradeLevels,
        magmaFragmentChance: 201,
        electricFragmentChance: 201,
      },
    };
    COOKIE_FRAGMENTS.types.forEach((fragment) => {
      const capped = getCookieFragmentStats(state, fragment.id);
      const higher = getCookieFragmentStats(higherState, fragment.id);
      expect(higher.chanceUnits).toBe(capped.chanceUnits);
      expect(higher.rewardMultiplier - capped.rewardMultiplier)
        .toBe(fragment.rewardMultiplierIncreasePerLevel);
    });
  });
});
