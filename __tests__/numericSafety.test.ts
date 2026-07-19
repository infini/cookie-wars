import {
  BOTS,
  COOKIE_UPGRADES,
  DIFFICULTIES,
  DISCS,
  MONSTERS,
  SAVE_MIGRATIONS,
} from '../src/config';
import {
  calculateBotPrice,
  calculateCookieStats,
  calculateDiscLevel,
  calculateUpgradeLevel,
  getActiveBots,
  getBattleDifficulty,
  getBattleMedalBonuses,
  getBotOffer,
  getCookieEvolutionProgress,
  getDiscProgress,
  getTotalBotCount,
  getUpgradeProgress,
} from '../src/domain/gameSelectors';
import {
  clampSafeInteger,
  MAX_GAME_INTEGER,
  nextSafeInteger,
  saturatingAdd,
  saturatingExponentialInteger,
  saturatingLinearInteger,
  saturatingProductInteger,
  saturatingSubtract,
} from '../src/domain/safeNumbers';
import {
  type GameAction,
  gameReducer,
  initialGameState,
  mergeSavedGame,
} from '../src/state/gameReducer';
import { createProjectedGameDispatcher } from '../src/state/gameRuntime';
import { createGameCommands } from '../src/state/useGameCommands';

function expectSafeInteger(value: number): void {
  expect(Number.isSafeInteger(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(MAX_GAME_INTEGER);
}

function expectSafeStoredIntegers(state: typeof initialGameState): void {
  for (const value of [
    state.saveVersion,
    state.cookies,
    state.lifetimeCookies,
    state.legacyCookieEvolutionBonusLevels,
    state.highestUnlockedDifficultyIndex,
    state.giantDiscCount,
    state.battleMedals,
    state.soundVolumeLevel,
    state.lastSavedAt,
    ...Object.values(state.upgradeLevels),
    ...Object.values(state.discLevels),
    ...Object.values(state.discUpgradeSpentCookies),
    ...Object.values(state.botCounts),
    ...Object.values(state.difficultyWinCounts),
  ]) expectSafeInteger(value);
  expect(state.lifetimeCookies).toBeGreaterThanOrEqual(state.cookies);
}

describe('게임 숫자 안전 경계', () => {
  test('공통 정수 연산은 손상된 입력을 복구하고 큰 유한 결과를 포화한다', () => {
    expect(clampSafeInteger(Number.NaN)).toBe(0);
    expect(clampSafeInteger(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampSafeInteger(-100)).toBe(0);
    expect(clampSafeInteger(3.9)).toBe(3);
    expect(saturatingAdd(MAX_GAME_INTEGER - 2, 10)).toBe(MAX_GAME_INTEGER);
    expect(saturatingAdd(7, Number.POSITIVE_INFINITY)).toBe(7);
    expect(saturatingSubtract(7, 20)).toBe(0);
    expect(saturatingSubtract(7, -20)).toBe(7);
    expect(saturatingLinearInteger(100, 120, MAX_GAME_INTEGER)).toBe(MAX_GAME_INTEGER);
    expect(saturatingProductInteger(MAX_GAME_INTEGER, 3.65)).toBe(MAX_GAME_INTEGER);
    expect(saturatingExponentialInteger(10, 1.25, MAX_GAME_INTEGER))
      .toBe(MAX_GAME_INTEGER);
    expect(nextSafeInteger(MAX_GAME_INTEGER)).toBeUndefined();
  });

  test('쿠키 획득 액션은 큰 값은 포화하고 NaN·Infinity·음수를 거부한다', () => {
    const startingState = { ...initialGameState, cookies: 5, lifetimeCookies: 7 };

    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(gameReducer(startingState, { type: 'GAIN_COOKIES', amount }))
        .toBe(startingState);
    }

    const saturated = gameReducer(startingState, {
      type: 'GAIN_COOKIES',
      amount: Number.MAX_VALUE,
    });
    expect(saturated.cookies).toBe(MAX_GAME_INTEGER);
    expect(saturated.lifetimeCookies).toBe(MAX_GAME_INTEGER);
    expectSafeInteger(saturated.cookies);
    expectSafeInteger(saturated.lifetimeCookies);

    const alreadyMaximum = gameReducer(saturated, { type: 'GAIN_COOKIES', amount: 1 });
    expect(alreadyMaximum).toBe(saturated);
  });

  test('MAX 레벨 강화와 MAX 쿠키봇은 비용만 소모하지 않고 정확히 중단된다', () => {
    const disc = DISCS[0];
    const bot = BOTS[0];
    const maximumState = {
      ...initialGameState,
      cookies: MAX_GAME_INTEGER,
      lifetimeCookies: MAX_GAME_INTEGER,
      ownedDiscIds: [disc.id],
      selectedDiscId: disc.id,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        clickPower: MAX_GAME_INTEGER,
      },
      discLevels: {
        ...initialGameState.discLevels,
        [disc.id]: MAX_GAME_INTEGER,
      },
      botCounts: {
        ...initialGameState.botCounts,
        [bot.id]: MAX_GAME_INTEGER,
      },
    };

    const upgrade = getUpgradeProgress(maximumState, 'clickPower')!;
    const discUpgrade = getDiscProgress(maximumState, disc.id)!;
    const botOffer = getBotOffer(maximumState, bot.id)!;
    expect(upgrade.current.level).toBe(MAX_GAME_INTEGER);
    expect(upgrade.next).toBeUndefined();
    expect(upgrade.affordable).toBe(false);
    expect(discUpgrade.current.level).toBe(MAX_GAME_INTEGER);
    expect(discUpgrade.next).toBeUndefined();
    expect(discUpgrade.upgradeAffordable).toBe(false);
    expect(botOffer.count).toBe(MAX_GAME_INTEGER);
    expect(botOffer.price).toBe(MAX_GAME_INTEGER);
    expect(botOffer.affordable).toBe(false);

    expect(gameReducer(maximumState, {
      type: 'BUY_UPGRADE',
      upgradeId: 'clickPower',
    })).toBe(maximumState);
    expect(gameReducer(maximumState, {
      type: 'UPGRADE_DISC',
      discId: disc.id,
    })).toBe(maximumState);
    expect(gameReducer(maximumState, {
      type: 'BUY_BOT',
      botId: bot.id,
    })).toBe(maximumState);
    expect(maximumState.cookies).toBe(MAX_GAME_INTEGER);
  });

  test('MAX 직전 레벨은 한 번만 올라가고 다음 요청은 쿠키를 소모하지 않는다', () => {
    const disc = DISCS[0];
    const upgradeState = {
      ...initialGameState,
      cookies: MAX_GAME_INTEGER,
      lifetimeCookies: MAX_GAME_INTEGER,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        clickPower: MAX_GAME_INTEGER - 1,
      },
    };
    const upgraded = gameReducer(upgradeState, {
      type: 'BUY_UPGRADE',
      upgradeId: 'clickPower',
    });
    const blockedUpgrade = gameReducer(upgraded, {
      type: 'BUY_UPGRADE',
      upgradeId: 'clickPower',
    });
    expect(upgraded.upgradeLevels.clickPower).toBe(MAX_GAME_INTEGER);
    expectSafeInteger(upgraded.cookies);
    expect(blockedUpgrade).toBe(upgraded);

    const discState = {
      ...initialGameState,
      cookies: MAX_GAME_INTEGER,
      lifetimeCookies: MAX_GAME_INTEGER,
      ownedDiscIds: [disc.id],
      selectedDiscId: disc.id,
      discLevels: {
        ...initialGameState.discLevels,
        [disc.id]: MAX_GAME_INTEGER - 1,
      },
    };
    const upgradedDisc = gameReducer(discState, {
      type: 'UPGRADE_DISC',
      discId: disc.id,
    });
    const blockedDisc = gameReducer(upgradedDisc, {
      type: 'UPGRADE_DISC',
      discId: disc.id,
    });
    expect(upgradedDisc.discLevels[disc.id]).toBe(MAX_GAME_INTEGER);
    expectSafeInteger(upgradedDisc.cookies);
    expect(blockedDisc).toBe(upgradedDisc);
  });

  test('전투 보상과 거대 원반 소비도 MAX_SAFE 범위를 유지한다', () => {
    const maximumInventory = {
      ...initialGameState,
      giantDiscCount: MAX_GAME_INTEGER,
      battleMedals: MAX_GAME_INTEGER,
    };
    const completed = gameReducer(maximumInventory, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });
    expect(completed.giantDiscCount).toBe(MAX_GAME_INTEGER);
    expect(completed.battleMedals).toBe(MAX_GAME_INTEGER);
    expectSafeInteger(completed.difficultyWinCounts[DIFFICULTIES[0].id]);

    const consumed = gameReducer(completed, { type: 'USE_GIANT_DISC' });
    expect(consumed.giantDiscCount).toBe(MAX_GAME_INTEGER - 1);
    expectSafeInteger(consumed.giantDiscCount);
  });

  test('모든 reducer 액션 뒤 저장 정수 필드의 안전 범위가 유지된다', () => {
    const saturatedSave = mergeSavedGame({
      saveVersion: SAVE_MIGRATIONS.currentSaveVersion,
      cookies: Number.MAX_VALUE,
      lifetimeCookies: Number.MAX_VALUE,
      legacyCookieEvolutionBonusLevels: Number.MAX_VALUE,
      upgradeLevels: Object.fromEntries(
        COOKIE_UPGRADES.map((upgrade) => [upgrade.id, Number.MAX_VALUE]),
      ),
      ownedDiscIds: DISCS.map((disc) => disc.id),
      selectedDiscId: DISCS[0].id,
      discLevels: Object.fromEntries(
        DISCS.map((disc) => [disc.id, Number.MAX_VALUE]),
      ),
      botCounts: Object.fromEntries(
        BOTS.map((bot) => [bot.id, Number.MAX_VALUE]),
      ),
      difficultyWinCounts: Object.fromEntries(
        DIFFICULTIES.map((difficulty) => [difficulty.id, Number.MAX_VALUE]),
      ),
      giantDiscCount: Number.MAX_VALUE,
      battleMedals: Number.MAX_VALUE,
      lastSavedAt: Number.MAX_VALUE,
    });
    let state = gameReducer(initialGameState, {
      type: 'HYDRATE',
      payload: saturatedSave,
      now: 10_000,
    });
    const actions: GameAction[] = [
      { type: 'GAIN_COOKIES', amount: Number.MAX_VALUE },
      { type: 'GAIN_COOKIES', amount: Number.NaN },
      { type: 'BUY_UPGRADE', upgradeId: 'clickPower' },
      { type: 'BUY_DISC', discId: DISCS[0].id },
      { type: 'UPGRADE_DISC', discId: DISCS[0].id },
      { type: 'RESET_DISC', discId: DISCS[0].id },
      { type: 'EQUIP_DISC', discId: DISCS[1].id },
      { type: 'BUY_BOT', botId: BOTS[0].id },
      { type: 'SET_DIFFICULTY', difficultyId: DIFFICULTIES.at(-1)!.id },
      { type: 'DISCOVER_MONSTER', monsterId: MONSTERS[0].id },
      { type: 'ACKNOWLEDGE_MONSTERS' },
      { type: 'COMPLETE_BATTLE', difficultyId: DIFFICULTIES[0].id },
      { type: 'USE_GIANT_DISC' },
      { type: 'TOGGLE_SOUND' },
      { type: 'SET_SOUND_VOLUME', level: 5 },
      { type: 'TOGGLE_VIBRATION' },
    ];

    expectSafeStoredIntegers(state);
    for (const action of actions) {
      state = gameReducer(state, action);
      expectSafeStoredIntegers(state);
    }
  });

  test('MAX 저장 상태의 경제·전투 selector는 모두 유한한 안전 값을 반환한다', () => {
    const extremeState = mergeSavedGame({
      saveVersion: SAVE_MIGRATIONS.currentSaveVersion,
      cookies: Number.MAX_VALUE,
      lifetimeCookies: Number.MAX_VALUE,
      legacyCookieEvolutionBonusLevels: Number.MAX_VALUE,
      upgradeLevels: Object.fromEntries(
        COOKIE_UPGRADES.map((upgrade) => [upgrade.id, Number.MAX_VALUE]),
      ),
      ownedDiscIds: DISCS.map((disc) => disc.id),
      selectedDiscId: DISCS[0].id,
      discLevels: Object.fromEntries(
        DISCS.map((disc) => [disc.id, Number.MAX_VALUE]),
      ),
      botCounts: Object.fromEntries(
        BOTS.map((bot) => [bot.id, Number.MAX_VALUE]),
      ),
      battleMedals: Number.MAX_VALUE,
    });

    for (const upgrade of COOKIE_UPGRADES) {
      const progress = getUpgradeProgress(extremeState, upgrade.id)!;
      expectSafeInteger(progress.current.level);
      expectSafeInteger(progress.current.value);
      expectSafeInteger(progress.current.cost);
      if (upgrade.enabled !== false) expect(progress.next).toBeUndefined();
    }
    for (const disc of DISCS) {
      const progress = getDiscProgress(extremeState, disc.id)!;
      expect(progress.next).toBeUndefined();
      for (const value of [
        progress.current.level,
        progress.current.damage,
        progress.current.size,
        progress.current.speed,
        progress.current.cooldownMs,
        progress.current.cost,
        progress.purchaseCost,
      ]) expectSafeInteger(value);
    }
    for (const bot of BOTS) {
      const offer = getBotOffer(extremeState, bot.id)!;
      expectSafeInteger(calculateBotPrice(bot, offer.count));
      expectSafeInteger(offer.count);
      expectSafeInteger(offer.price);
      expect(offer.affordable).toBe(false);
    }

    const evolution = getCookieEvolutionProgress(extremeState);
    const stats = calculateCookieStats(extremeState);
    const medalBonuses = getBattleMedalBonuses(extremeState);
    expect(evolution.totalUpgradeLevels).toBe(MAX_GAME_INTEGER);
    expect(Number.isFinite(evolution.progressRatio)).toBe(true);
    for (const value of [
      stats.clickPower,
      stats.autoProduction,
      stats.maxHealth,
      stats.cookieLevel,
      stats.totalUpgradeLevels,
      medalBonuses.battleMedals,
      medalBonuses.clickPowerBonusPercent,
      medalBonuses.autoProductionBonusPercent,
      medalBonuses.castleHealthBonusPercent,
      getTotalBotCount(extremeState),
      ...getActiveBots(extremeState).map((bot) => bot.count),
    ]) expectSafeInteger(value);

    const battleDifficulty = getBattleDifficulty(DIFFICULTIES[0], Number.POSITIVE_INFINITY);
    expectSafeInteger(battleDifficulty.enemyCount);
    expectSafeInteger(battleDifficulty.enemyDiscLevel);
    for (const value of [
      battleDifficulty.hpMultiplier,
      battleDifficulty.attackMultiplier,
      battleDifficulty.moveSpeed,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(MAX_GAME_INTEGER);
    }
  });

  test('직접 파생 계산에 MAX 레벨을 넣어도 Infinity를 만들지 않는다', () => {
    const upgrade = calculateUpgradeLevel(COOKIE_UPGRADES[0], MAX_GAME_INTEGER);
    const disc = calculateDiscLevel(DISCS[0], MAX_GAME_INTEGER);

    for (const value of [upgrade.level, upgrade.value, upgrade.cost]) {
      expectSafeInteger(value);
    }
    for (const value of [
      disc.level,
      disc.damage,
      disc.size,
      disc.speed,
      disc.cooldownMs,
      disc.cost,
    ]) expectSafeInteger(value);
  });

  test('중앙 projected dispatcher가 자동 획득과 구매를 같은 상태 순서로 직렬화한다', () => {
    const upgradeId = 'clickPower';
    const firstUpgrade = getUpgradeProgress(initialGameState, upgradeId)!.next!;
    const stateRef = { current: initialGameState };
    const actions: GameAction[] = [];
    const dispatchProjectedAction = createProjectedGameDispatcher((action) => {
      actions.push(action);
    }, stateRef);
    const commands = createGameCommands(dispatchProjectedAction, stateRef);

    expect(dispatchProjectedAction({
      type: 'GAIN_COOKIES',
      amount: firstUpgrade.cost,
    })).toBe(true);
    expect(commands.buyUpgrade(upgradeId)).toBe(true);
    expect(stateRef.current.cookies).toBe(0);
    expect(stateRef.current.upgradeLevels[upgradeId]).toBe(firstUpgrade.level);
    expect(actions.reduce(gameReducer, initialGameState)).toEqual(stateRef.current);

    const maximumActions: GameAction[] = [];
    const maximumRef = {
      current: {
        ...initialGameState,
        cookies: MAX_GAME_INTEGER - 1,
        lifetimeCookies: MAX_GAME_INTEGER - 1,
      },
    };
    const maximumProjectedDispatch = createProjectedGameDispatcher((action) => {
      maximumActions.push(action);
    }, maximumRef);
    expect(maximumProjectedDispatch({ type: 'GAIN_COOKIES', amount: 10 })).toBe(true);
    expect(maximumProjectedDispatch({ type: 'GAIN_COOKIES', amount: 1 })).toBe(false);
    expect(maximumRef.current.cookies).toBe(MAX_GAME_INTEGER);
    expect(maximumActions).toHaveLength(1);
  });
});
