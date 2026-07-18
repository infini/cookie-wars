import {
  AUDIO_SETTINGS,
  BOTS,
  COOKIE_UPGRADES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  MONSTERS,
  PROGRESSION,
  SAVE_MIGRATIONS,
} from '../src/config';
import { completeBattleTransition } from '../src/domain/battleCompletion';
import {
  calculateBotPrice,
  calculateCookieStats,
  getBotOffer,
  getCookieEvolutionProgress,
  getBattleStageId,
  getDiscProgress,
  getMaximumCookieRenderSize,
  getSortedUpgradeProgress,
  getUpgradeProgress,
} from '../src/domain/gameSelectors';
import {
  consumeGiantDiscInventory,
  type GameAction,
  gameReducer,
  initialGameState,
  mergeSavedGame,
  prepareSavedGame,
} from '../src/state/gameReducer';
import { createProjectedGameDispatcher } from '../src/state/gameRuntime';
import { createGameCommands } from '../src/state/useGameCommands';
import type { GameState } from '../src/types/game';

function createTestCommands(actions: GameAction[], stateRef: { current: GameState }) {
  return createGameCommands(
    createProjectedGameDispatcher((action) => {
      actions.push(action);
    }, stateRef),
    stateRef,
  );
}

describe('게임 저장 상태', () => {
  test('전투 완료 순수 전이가 최초 보상 결과와 reducer 상태를 함께 만든다', () => {
    const funded = { ...initialGameState, cookies: 123, giantDiscCount: 4 };
    const transition = completeBattleTransition(funded, DIFFICULTIES[0].id);
    const reduced = gameReducer(funded, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });

    expect(transition.result).toEqual({
      firstClear: true,
      giantDiscReward: PROGRESSION.giantDiscRewardPerFirstClear,
      stageNumber: 1,
      difficultyWins: 1,
      winsRequired: PROGRESSION.winsToUnlockNextDifficulty,
      unlockedNextDifficulty: false,
    });
    expect(transition.state).toEqual(reduced);
    expect(transition.state.cookies).toBe(funded.cookies);
    expect(transition.state.lifetimeCookies).toBe(funded.lifetimeCookies);
    expect(transition.state.giantDiscCount).toBe(
      funded.giantDiscCount + PROGRESSION.giantDiscRewardPerFirstClear,
    );
    expect(transition.state.rewardClaimedStageIds).toEqual([
      getBattleStageId(DIFFICULTIES[0].id, 1),
    ]);
    expect(transition.state.clearedDifficultyIds).toEqual([DIFFICULTIES[0].id]);
  });

  test('렌더 전 연속 전투 완료도 projected 상태와 reducer 진행이 일치한다', () => {
    const actions: GameAction[] = [];
    const stateRef = { current: initialGameState };
    const commands = createTestCommands(actions, stateRef);
    const results = [
      commands.completeBattle(DIFFICULTIES[0].id),
      commands.completeBattle(DIFFICULTIES[0].id),
    ];
    const reduced = actions.reduce(gameReducer, initialGameState);

    expect(stateRef.current).toEqual(reduced);
    expect(results.map((result) => result.stageNumber)).toEqual([1, 2]);
    expect(results.map((result) => result.difficultyWins)).toEqual([1, 2]);
    expect(stateRef.current.giantDiscCount).toBe(
      PROGRESSION.giantDiscRewardPerFirstClear * 2,
    );
    expect(actions).toEqual([
      { type: 'COMPLETE_BATTLE', difficultyId: DIFFICULTIES[0].id },
      { type: 'COMPLETE_BATTLE', difficultyId: DIFFICULTIES[0].id },
    ]);
  });

  test('정확히 한 번 강화할 쿠키로 빠르게 두 번 누르면 첫 구매만 승인한다', () => {
    const upgradeId = 'clickPower';
    const pricingState = { ...initialGameState, cookies: Number.MAX_SAFE_INTEGER };
    const firstUpgrade = getUpgradeProgress(pricingState, upgradeId)!.next!;
    const startingState = { ...initialGameState, cookies: firstUpgrade.cost };
    const actions: GameAction[] = [];
    const stateRef = { current: startingState };
    const commands = createTestCommands(actions, stateRef);

    expect([
      commands.buyUpgrade(upgradeId),
      commands.buyUpgrade(upgradeId),
    ]).toEqual([true, false]);
    expect(stateRef.current.cookies).toBe(0);
    expect(stateRef.current.upgradeLevels[upgradeId]).toBe(firstUpgrade.level);
    expect(actions).toEqual([{ type: 'BUY_UPGRADE', upgradeId }]);
    expect(actions.reduce(gameReducer, startingState)).toEqual(stateRef.current);
  });

  test('두 단계 비용이 있으면 빠른 연속 강화가 각 단계 가격을 순서대로 적용한다', () => {
    const upgradeId = 'clickPower';
    const pricingState = { ...initialGameState, cookies: Number.MAX_SAFE_INTEGER };
    const firstUpgrade = getUpgradeProgress(pricingState, upgradeId)!.next!;
    const afterFirst = gameReducer(pricingState, { type: 'BUY_UPGRADE', upgradeId });
    const secondUpgrade = getUpgradeProgress(afterFirst, upgradeId)!.next!;
    const startingState = {
      ...initialGameState,
      cookies: firstUpgrade.cost + secondUpgrade.cost,
    };
    const actions: GameAction[] = [];
    const stateRef = { current: startingState };
    const commands = createTestCommands(actions, stateRef);

    expect([
      commands.buyUpgrade(upgradeId),
      commands.buyUpgrade(upgradeId),
      commands.buyUpgrade(upgradeId),
    ]).toEqual([true, true, false]);
    expect(stateRef.current.cookies).toBe(0);
    expect(stateRef.current.upgradeLevels[upgradeId]).toBe(secondUpgrade.level);
    expect(actions).toEqual([
      { type: 'BUY_UPGRADE', upgradeId },
      { type: 'BUY_UPGRADE', upgradeId },
    ]);
    expect(actions.reduce(gameReducer, startingState)).toEqual(stateRef.current);
  });

  test('클릭·설정·도감 명령도 렌더 전 projected 상태에 순서대로 직렬화한다', () => {
    const actions: GameAction[] = [];
    const stateRef = { current: initialGameState };
    const commands = createTestCommands(actions, stateRef);
    const clickPower = calculateCookieStats(initialGameState).clickPower;
    const monsterId = MONSTERS[0].id;

    expect(commands.clickCookie()).toBe(clickPower);
    expect(commands.clickCookie()).toBe(clickPower);
    commands.toggleSound();
    commands.setSoundVolume(5);
    commands.toggleVibration();
    commands.discoverMonster(monsterId);
    commands.acknowledgeMonsters();

    expect(stateRef.current.cookies).toBe(clickPower * 2);
    expect(stateRef.current.lifetimeCookies).toBe(clickPower * 2);
    expect(stateRef.current.soundEnabled).toBe(false);
    expect(stateRef.current.soundVolumeLevel).toBe(5);
    expect(stateRef.current.vibrationEnabled).toBe(false);
    expect(stateRef.current.discoveredMonsterIds).toContain(monsterId);
    expect(stateRef.current.newMonsterIds).toEqual([]);
    expect(actions.reduce(gameReducer, initialGameState)).toEqual(stateRef.current);
  });

  test('마지막 스테이지 최초 승리는 다음 난이도를 정확히 한 번 해금한다', () => {
    const difficulty = DIFFICULTIES[0];
    const previousWins = PROGRESSION.winsToUnlockNextDifficulty - 1;
    const beforeLastStage = {
      ...initialGameState,
      giantDiscCount: previousWins,
      difficultyWinCounts: {
        ...initialGameState.difficultyWinCounts,
        [difficulty.id]: previousWins,
      },
      clearedDifficultyIds: [difficulty.id],
      rewardClaimedStageIds: Array.from(
        { length: previousWins },
        (_, index) => getBattleStageId(difficulty.id, index + 1),
      ),
    };

    const completed = completeBattleTransition(beforeLastStage, difficulty.id);
    const replayed = completeBattleTransition(completed.state, difficulty.id);

    expect(completed.result).toEqual({
      firstClear: true,
      giantDiscReward: PROGRESSION.giantDiscRewardPerFirstClear,
      stageNumber: PROGRESSION.winsToUnlockNextDifficulty,
      difficultyWins: PROGRESSION.winsToUnlockNextDifficulty,
      winsRequired: PROGRESSION.winsToUnlockNextDifficulty,
      unlockedNextDifficulty: true,
    });
    expect(completed.state.highestUnlockedDifficultyIndex).toBe(1);
    expect(completed.state.giantDiscCount).toBe(
      previousWins + PROGRESSION.giantDiscRewardPerFirstClear,
    );
    expect(replayed.result).toEqual({
      ...completed.result,
      firstClear: false,
      giantDiscReward: 0,
      unlockedNextDifficulty: false,
    });
    expect(replayed.state.giantDiscCount).toBe(completed.state.giantDiscCount);
    expect(replayed.state.rewardClaimedStageIds).toEqual(
      completed.state.rewardClaimedStageIds,
    );
  });

  test('잠긴 난이도와 알 수 없는 난이도의 완료 요청은 상태와 보상을 바꾸지 않는다', () => {
    for (const difficultyId of [DIFFICULTIES[1].id, 'unknown-difficulty']) {
      const transition = completeBattleTransition(initialGameState, difficultyId);
      const reduced = gameReducer(initialGameState, {
        type: 'COMPLETE_BATTLE',
        difficultyId,
      });

      expect(transition.state).toBe(initialGameState);
      expect(reduced).toBe(initialGameState);
      expect(transition.result.firstClear).toBe(false);
      expect(transition.result.giantDiscReward).toBe(0);
      expect(transition.result.difficultyWins).toBe(0);
      expect(transition.result.unlockedNextDifficulty).toBe(false);
    }
  });

  test('이전 난이도 단위 보상 저장을 불러와도 같은 스테이지 보상을 다시 주지 않는다', () => {
    const difficultyId = DIFFICULTIES[0].id;
    const migrated = mergeSavedGame({
      rewardClaimedDifficultyIds: [difficultyId],
      giantDiscCount: 7,
    });
    const transition = completeBattleTransition(migrated, difficultyId);

    expect(transition.result.firstClear).toBe(false);
    expect(transition.result.giantDiscReward).toBe(0);
    expect(transition.result.stageNumber).toBe(1);
    expect(transition.result.difficultyWins).toBe(1);
    expect(transition.state.giantDiscCount).toBe(7);
    expect(transition.state.rewardClaimedStageIds).toEqual([
      getBattleStageId(difficultyId, 1),
    ]);
  });

  test('각 전투 스테이지는 최초 클리어마다 거대 원반을 주고 쿠키는 주지 않는다', () => {
    const funded = { ...initialGameState, cookies: 10 };
    const first = gameReducer(funded, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });
    const second = gameReducer(first, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });
    expect(first.cookies).toBe(10);
    expect(second.cookies).toBe(10);
    expect(first.lifetimeCookies).toBe(funded.lifetimeCookies);
    expect(second.lifetimeCookies).toBe(funded.lifetimeCookies);
    expect(first.giantDiscCount).toBe(1);
    expect(second.giantDiscCount).toBe(2);

    let completed = second;
    for (let win = 2; win < PROGRESSION.winsToUnlockNextDifficulty; win += 1) {
      completed = gameReducer(completed, {
        type: 'COMPLETE_BATTLE',
        difficultyId: DIFFICULTIES[0].id,
      });
    }
    const replay = gameReducer(completed, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });
    expect(replay.cookies).toBe(completed.cookies);
    expect(replay.giantDiscCount).toBe(completed.giantDiscCount);
    expect(completed.giantDiscCount).toBe(PROGRESSION.winsToUnlockNextDifficulty);
    expect(replay.rewardClaimedStageIds).toHaveLength(PROGRESSION.winsToUnlockNextDifficulty);
    expect(replay.rewardClaimedStageIds).toContain(getBattleStageId(DIFFICULTIES[0].id, 20));
  });

  test('거대 원반은 사용할 때마다 저장 수량이 한 개 줄어든다', () => {
    const stocked = { ...initialGameState, giantDiscCount: 2 };
    const usedOnce = gameReducer(stocked, { type: 'USE_GIANT_DISC' });
    const usedTwice = gameReducer(usedOnce, { type: 'USE_GIANT_DISC' });
    const emptyUse = gameReducer(usedTwice, { type: 'USE_GIANT_DISC' });

    expect(usedOnce.giantDiscCount).toBe(1);
    expect(usedTwice.giantDiscCount).toBe(0);
    expect(emptyUse).toEqual(usedTwice);
  });

  test('렌더 전 연속 소비도 projected 재고에서 두 번째 요청을 거부한다', () => {
    const startingState = { ...initialGameState, giantDiscCount: 1 };
    const actions: GameAction[] = [];
    const stateRef = { current: startingState };
    const commands = createTestCommands(actions, stateRef);

    expect(commands.consumeGiantDisc()).toBe(true);
    expect(commands.consumeGiantDisc()).toBe(false);
    expect(stateRef.current.giantDiscCount).toBe(0);
    expect(actions).toEqual([{ type: 'USE_GIANT_DISC' }]);
    expect(actions.reduce(gameReducer, startingState)).toEqual(stateRef.current);
  });

  test('같은 난이도에서 20번 승리해야 다음 난이도가 열린다', () => {
    let state = initialGameState;
    for (let win = 0; win < PROGRESSION.winsToUnlockNextDifficulty - 1; win += 1) {
      state = gameReducer(state, {
        type: 'COMPLETE_BATTLE',
        difficultyId: DIFFICULTIES[0].id,
      });
    }
    expect(state.highestUnlockedDifficultyIndex).toBe(0);

    state = gameReducer(state, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
    });
    expect(state.highestUnlockedDifficultyIndex).toBe(1);
    expect(state.difficultyWinCounts[DIFFICULTIES[0].id]).toBe(20);
  });

  test('원반은 충분한 쿠키가 있을 때 영구 구매된다', () => {
    const disc = DISCS[0];
    const funded = { ...initialGameState, cookies: disc.purchaseCost };
    const purchased = gameReducer(funded, { type: 'BUY_DISC', discId: disc.id });
    const purchasedAgain = gameReducer(purchased, { type: 'BUY_DISC', discId: disc.id });
    expect(purchased.ownedDiscIds).toContain(disc.id);
    expect(purchased.selectedDiscId).toBe(disc.id);
    expect(purchased.cookies).toBe(0);
    expect(purchasedAgain).toEqual(purchased);
  });

  test('명시적으로 잘못된 상점 ID는 기본 상품으로 바뀌지 않고 모든 계층에서 거부된다', () => {
    const unknownId = 'unknown-shop-item';
    const purchaseState = { ...initialGameState, cookies: Number.MAX_SAFE_INTEGER };
    const ownedDiscState = {
      ...purchaseState,
      ownedDiscIds: [DISCS[0].id],
      selectedDiscId: DISCS[0].id,
    };

    expect(getDiscProgress(purchaseState).config.id).toBe(DISCS[0].id);
    expect(getDiscProgress(
      { ...purchaseState, selectedDiscId: unknownId },
    ).config.id).toBe(DISCS[0].id);
    expect(getDiscProgress(purchaseState, unknownId)).toBeUndefined();
    expect(getUpgradeProgress(purchaseState, unknownId)).toBeUndefined();
    expect(getBotOffer(purchaseState, unknownId)).toBeUndefined();

    expect(gameReducer(purchaseState, { type: 'BUY_DISC', discId: unknownId }))
      .toBe(purchaseState);
    expect(gameReducer(ownedDiscState, { type: 'UPGRADE_DISC', discId: unknownId }))
      .toBe(ownedDiscState);
    expect(gameReducer(purchaseState, { type: 'BUY_UPGRADE', upgradeId: unknownId }))
      .toBe(purchaseState);
    expect(gameReducer(purchaseState, { type: 'BUY_BOT', botId: unknownId }))
      .toBe(purchaseState);

    const purchaseActions: GameAction[] = [];
    const purchaseRef = { current: purchaseState };
    const purchaseCommands = createTestCommands(purchaseActions, purchaseRef);
    expect([
      purchaseCommands.buyDisc(unknownId),
      purchaseCommands.buyUpgrade(unknownId),
      purchaseCommands.buyBot(unknownId),
    ]).toEqual([false, false, false]);
    expect(purchaseRef.current).toBe(purchaseState);
    expect(purchaseActions).toEqual([]);

    const upgradeActions: GameAction[] = [];
    const upgradeRef = { current: ownedDiscState };
    const upgradeCommands = createTestCommands(upgradeActions, upgradeRef);
    expect(upgradeCommands.upgradeDisc(unknownId)).toBe(false);
    expect(upgradeRef.current).toBe(ownedDiscState);
    expect(upgradeActions).toEqual([]);
  });

  test('쿠키봇 구매 수량을 저장한다', () => {
    const bot = BOTS[0];
    const funded = { ...initialGameState, cookies: 1000 };
    const bought = gameReducer(funded, {
      type: 'BUY_BOT',
      botId: bot.id,
    });
    expect(bought.botCounts[bot.id]).toBe(1);
    expect(bought.cookies).toBe(1000 - calculateBotPrice(bot, 0));
  });

  test('효과음 볼륨을 5단계로 저장하고 기존 저장은 4단계를 사용한다', () => {
    const loud = gameReducer(initialGameState, { type: 'SET_SOUND_VOLUME', level: 5 });
    const oldSave = mergeSavedGame({ cookies: 7 });

    expect(loud.soundVolumeLevel).toBe(5);
    expect(oldSave.soundVolumeLevel).toBe(AUDIO_SETTINGS.defaultLevel);
  });

  test('원반은 최고 레벨 없이 계속 강화된다', () => {
    const disc = DISCS[0];
    const highLevelState = {
      ...initialGameState,
      cookies: Number.MAX_SAFE_INTEGER,
      ownedDiscIds: [disc.id],
      selectedDiscId: disc.id,
      discLevels: { ...initialGameState.discLevels, [disc.id]: 100 },
    };
    const before = getDiscProgress(highLevelState, disc.id)!;
    const upgraded = gameReducer(highLevelState, { type: 'UPGRADE_DISC', discId: disc.id });
    expect(before.next).toBeDefined();
    expect(before.next!.level).toBe(101);
    expect(before.current.cooldownMs).toBe(DISC_UPGRADE_RULES.minimumCooldownMs);
    expect(before.next!.damage).toBeGreaterThan(before.current.damage);
    expect(before.next!.size).toBeGreaterThan(before.current.size);
    expect(before.next!.speed).toBeGreaterThan(before.current.speed);
    expect(upgraded.discLevels[disc.id]).toBe(101);
  });

  test('이전 단일 원반 저장은 첫 원반의 소유·레벨로 안전하게 이전된다', () => {
    const migrated = mergeSavedGame({
      discOwned: true,
      discLevel: 4,
      botCounts: { 'cookie-bot': 3 },
    });
    expect(migrated.saveVersion).toBe(SAVE_MIGRATIONS.currentSaveVersion);
    expect(migrated.ownedDiscIds).toEqual([DISCS[0].id]);
    expect(migrated.discLevels[DISCS[0].id]).toBe(4);
    expect(migrated.botCounts[BOTS[0].id]).toBe(3);
    expect('autoBattleEnabled' in migrated).toBe(false);
  });

  test('더 최신 앱의 저장은 정규화해 읽되 현재 버전으로 덮어쓰지 않는다', () => {
    const prepared = prepareSavedGame({
      ...initialGameState,
      saveVersion: initialGameState.saveVersion + 1,
      cookies: 321,
      lifetimeCookies: 654,
      lastSavedAt: 1_000,
    }, 10_000);

    expect(prepared.persistenceWritable).toBe(false);
    expect(prepared.state.saveVersion).toBe(initialGameState.saveVersion);
    expect(prepared.state.cookies).toBe(321);
    expect(prepared.state.lifetimeCookies).toBe(654);
    expect(prepared.state.lastSavedAt).toBe(1_000);
  });

  test.each([8.5, Number.MAX_VALUE])(
    '손상된 저장 버전 %p은 미래 버전으로 오인하지 않고 이전·저장할 수 있다',
    (invalidSaveVersion) => {
      const prepared = prepareSavedGame({
        ...initialGameState,
        saveVersion: invalidSaveVersion,
        legacyCookieEvolutionBonusLevels: 99,
        upgradeLevels: {
          ...initialGameState.upgradeLevels,
          cookieSize: 6,
        },
      }, 10_000);

      expect(prepared.persistenceWritable).toBe(true);
      expect(prepared.state.saveVersion).toBe(initialGameState.saveVersion);
      expect(prepared.state.legacyCookieEvolutionBonusLevels).toBe(5);
    },
  );

  test('10종 시절의 원반과 쿠키봇 저장은 현재 5종에 합쳐서 이전한다', () => {
    const migrated = mergeSavedGame({
      ownedDiscIds: ['starlight-disc', 'rainbow-disc', 'lava-disc'],
      selectedDiscId: 'starlight-disc',
      discLevels: {
        'starlight-disc': 12,
        'rainbow-disc': 8,
        'lava-disc': 15,
      },
      botCounts: {
        'star-bot': 2,
        'rainbow-bot': 3,
        'lava-bot': 4,
        'royal-bot': 1,
      },
    });

    expect(migrated.ownedDiscIds).toEqual(['rainbow-disc', 'crown-disc']);
    expect(migrated.selectedDiscId).toBe('rainbow-disc');
    expect(migrated.discLevels['rainbow-disc']).toBe(12);
    expect(migrated.discLevels['crown-disc']).toBe(15);
    expect(migrated.botCounts['rainbow-bot']).toBe(5);
    expect(migrated.botCounts['royal-bot']).toBe(5);
  });

  test('이전 몬스터 도감 ID를 새 다등급 몬스터 ID로 이전한다', () => {
    const migrated = mergeSavedGame({
      discoveredMonsterIds: ['crumb-goblin', 'sugar-slime', 'unknown-monster'],
      newMonsterIds: ['sugar-slime'],
    });
    expect(migrated.discoveredMonsterIds).toEqual(['crumb-minion', 'sugar-guard']);
    expect(migrated.newMonsterIds).toEqual(['sugar-guard']);
  });

  test('이전 난이도 단위 보상 기록은 해당 난이도 1스테이지 보상으로 이전한다', () => {
    const migrated = mergeSavedGame({ rewardClaimedDifficultyIds: [DIFFICULTIES[0].id] });
    expect(migrated.rewardClaimedStageIds).toEqual([
      getBattleStageId(DIFFICULTIES[0].id, 1),
    ]);
  });

  test.each(['clickPower', 'autoProduction', 'cookieHealth'])(
    '%s 업그레이드는 100레벨 이후에도 계속된다',
    (upgradeId) => {
      const config = COOKIE_UPGRADES.find((upgrade) => upgrade.id === upgradeId)!;
      const highLevelState = {
        ...initialGameState,
        cookies: Number.MAX_SAFE_INTEGER,
        upgradeLevels: { ...initialGameState.upgradeLevels, [upgradeId]: 100 },
      };
      const progress = getUpgradeProgress(highLevelState, config.id)!;
      const upgraded = gameReducer(highLevelState, { type: 'BUY_UPGRADE', upgradeId });
      expect(progress.next?.level).toBe(101);
      expect(progress.next?.value).toBeGreaterThan(progress.current.value);
      expect(upgraded.upgradeLevels[upgradeId]).toBe(101);
    },
  );

  test('신규 저장의 쿠키 진화 합계는 보이는 3종 강화의 기본 레벨만 합산한 3이다', () => {
    const evolution = getCookieEvolutionProgress(initialGameState);

    expect(initialGameState.legacyCookieEvolutionBonusLevels).toBe(0);
    expect(evolution.visibleUpgradeLevels).toBe(3);
    expect(evolution.legacyBonusLevels).toBe(0);
    expect(evolution.totalUpgradeLevels).toBe(3);
    expect(evolution.active.id).toBe('classic-cookie');
  });

  test('업그레이드 총레벨이 조건에 도달하면 더 좋은 쿠키로 자동 진화한다', () => {
    const evolvedState = {
      ...initialGameState,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        clickPower: 7,
      },
    };
    const evolution = getCookieEvolutionProgress(evolvedState);
    const stats = calculateCookieStats(evolvedState);
    expect(evolution.totalUpgradeLevels).toBe(9);
    expect(evolution.active.id).toBe('fortune-cookie');
    expect(evolution.remainingLevels).toBe(6);
    expect(evolution.progressRatio).toBe(0);
    expect(stats.clickPower).toBeGreaterThan(34);
  });

  test('쿠키 크기는 숨겨지고 구매할 수 없으며 v8 진화 합계에 영향을 주지 않는다', () => {
    const cookieSize = COOKIE_UPGRADES.find((upgrade) => upgrade.id === 'cookieSize')!;
    const funded = { ...initialGameState, cookies: Number.MAX_SAFE_INTEGER };
    const sizeProgress = getUpgradeProgress(funded, cookieSize.id)!;
    const blocked = gameReducer(funded, { type: 'BUY_UPGRADE', upgradeId: cookieSize.id });
    const commonSave = {
      saveVersion: SAVE_MIGRATIONS.currentSaveVersion,
      legacyCookieEvolutionBonusLevels: 2,
      upgradeLevels: {
        clickPower: 9,
        autoProduction: 1,
        cookieHealth: 1,
      },
    };
    const minimumSize = mergeSavedGame({
      ...commonSave,
      upgradeLevels: { ...commonSave.upgradeLevels, cookieSize: 1 },
    });
    const maximumSize = mergeSavedGame({
      ...commonSave,
      upgradeLevels: { ...commonSave.upgradeLevels, cookieSize: 6 },
    });
    const minimumEvolution = getCookieEvolutionProgress(minimumSize);
    const maximumEvolution = getCookieEvolutionProgress(maximumSize);

    expect(sizeProgress.next).toBeUndefined();
    expect(sizeProgress.affordable).toBe(false);
    expect(blocked).toEqual(funded);
    expect(maximumSize.upgradeLevels.cookieSize).toBe(6);
    expect(maximumEvolution).toEqual(minimumEvolution);
    expect(maximumEvolution.totalUpgradeLevels).toBe(13);
    expect(calculateCookieStats(maximumSize).cookieRenderSize)
      .toBe(getMaximumCookieRenderSize());
    expect(getMaximumCookieRenderSize()).toBe(cookieSize.renderMaximumSizePixels);
  });

  test.each([
    {
      cookieSizeLevel: 1,
      clickPowerLevel: 1,
      expectedBonus: 0,
      expectedCookieId: 'classic-cookie',
      expectedRemainingLevels: 6,
      expectedProgressRatio: 0,
    },
    {
      cookieSizeLevel: 3,
      clickPowerLevel: 6,
      expectedBonus: 2,
      expectedCookieId: 'fortune-cookie',
      expectedRemainingLevels: 5,
      expectedProgressRatio: 1 / 6,
    },
    {
      cookieSizeLevel: 6,
      clickPowerLevel: 9,
      expectedBonus: 5,
      expectedCookieId: 'donut-cookie',
      expectedRemainingLevels: 5,
      expectedProgressRatio: 1 / 6,
    },
  ])(
    'v7 쿠키 크기 Lv$cookieSizeLevel은 고정 보너스로 한 번만 이전해 기존 진화 진행을 보존한다',
    ({
      cookieSizeLevel,
      clickPowerLevel,
      expectedBonus,
      expectedCookieId,
      expectedRemainingLevels,
      expectedProgressRatio,
    }) => {
      const legacyTotalUpgradeLevels = clickPowerLevel + 1 + 1 + cookieSizeLevel;
      const migrated = mergeSavedGame({
        saveVersion: SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion - 1,
        upgradeLevels: {
          clickPower: clickPowerLevel,
          cookieSize: cookieSizeLevel,
          autoProduction: 1,
          cookieHealth: 1,
        },
      });
      const evolution = getCookieEvolutionProgress(migrated);
      const reloaded = mergeSavedGame(migrated);
      const reloadedEvolution = getCookieEvolutionProgress(reloaded);

      expect(migrated.saveVersion).toBe(SAVE_MIGRATIONS.currentSaveVersion);
      expect(migrated.legacyCookieEvolutionBonusLevels).toBe(expectedBonus);
      expect(evolution.visibleUpgradeLevels).toBe(clickPowerLevel + 2);
      expect(evolution.totalUpgradeLevels).toBe(legacyTotalUpgradeLevels - 1);
      expect(evolution.active.id).toBe(expectedCookieId);
      expect(evolution.remainingLevels).toBe(expectedRemainingLevels);
      expect(evolution.progressRatio).toBeCloseTo(expectedProgressRatio);
      expect(reloaded.legacyCookieEvolutionBonusLevels).toBe(expectedBonus);
      expect(reloadedEvolution).toEqual(evolution);
    },
  );

  test('v7의 손상된 쿠키 크기 레벨은 진화 보너스를 만들지 않는다', () => {
    for (const cookieSize of [-1, 7, Number.MAX_VALUE, Number.NaN]) {
      const migrated = mergeSavedGame({
        saveVersion: SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion - 1,
        upgradeLevels: {
          ...initialGameState.upgradeLevels,
          cookieSize,
        },
      });
      expect(migrated.legacyCookieEvolutionBonusLevels).toBe(0);
    }
    const flooredLegacyLevel = mergeSavedGame({
      saveVersion: SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion - 1,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        cookieSize: 6.9,
      },
    });
    expect(flooredLegacyLevel.legacyCookieEvolutionBonusLevels).toBe(5);
  });

  test('다음 쿠키 진화 진행률은 현재와 다음 조건 사이의 레벨 비율이다', () => {
    const midwayState = {
      ...initialGameState,
      upgradeLevels: { ...initialGameState.upgradeLevels, clickPower: 10 },
    };
    const evolution = getCookieEvolutionProgress(midwayState);

    expect(evolution.totalUpgradeLevels).toBe(12);
    expect(evolution.remainingLevels).toBe(3);
    expect(evolution.progressRatio).toBe(0.5);
  });

  test('강화 가능 항목을 위에, 완료 항목을 가장 아래에 정렬한다', () => {
    const state = {
      ...initialGameState,
      cookies: 110,
      upgradeLevels: { ...initialGameState.upgradeLevels, cookieSize: 6 },
    };
    const sorted = getSortedUpgradeProgress(state);
    expect(sorted.map((item) => item.config.id)).toEqual([
      'clickPower',
      'cookieHealth',
      'autoProduction',
    ]);
    expect(sorted.slice(0, 2).every((item) => item.affordable)).toBe(true);
    expect(sorted[2].affordable).toBe(false);
    expect(sorted.some((item) => item.config.id === 'cookieSize')).toBe(false);
  });

  test('NaN·Infinity·음수 저장 숫자는 모든 진행 필드에서 안전한 값으로 복구한다', () => {
    const restored = mergeSavedGame({
      saveVersion: Number.NaN,
      cookies: Number.NaN,
      lifetimeCookies: Number.POSITIVE_INFINITY,
      legacyCookieEvolutionBonusLevels: Number.NaN,
      upgradeLevels: {
        clickPower: Number.NaN,
        cookieSize: -6,
        autoProduction: Number.POSITIVE_INFINITY,
        cookieHealth: Number.NEGATIVE_INFINITY,
      },
      discLevels: {
        [DISCS[0].id]: Number.NaN,
        [DISCS[1].id]: Number.POSITIVE_INFINITY,
        [DISCS[2].id]: -10,
      },
      discLevel: Number.POSITIVE_INFINITY,
      botCounts: {
        [BOTS[0].id]: Number.NaN,
        [BOTS[1].id]: Number.POSITIVE_INFINITY,
        [BOTS[2].id]: -4,
        'cookie-bot': Number.NEGATIVE_INFINITY,
      },
      highestUnlockedDifficultyIndex: Number.POSITIVE_INFINITY,
      difficultyWinCounts: {
        [DIFFICULTIES[0].id]: Number.NaN,
        [DIFFICULTIES[1].id]: Number.POSITIVE_INFINITY,
        [DIFFICULTIES[2].id]: -8,
      },
      giantDiscCount: -3,
      soundEnabled: 'yes',
      soundVolumeLevel: Number.POSITIVE_INFINITY,
      vibrationEnabled: 1,
      lastSavedAt: Number.NEGATIVE_INFINITY,
    } as any);

    expect(restored.saveVersion).toBe(initialGameState.saveVersion);
    expect(restored.cookies).toBe(0);
    expect(restored.lifetimeCookies).toBe(0);
    expect(restored.legacyCookieEvolutionBonusLevels).toBe(0);
    expect(restored.upgradeLevels).toEqual(initialGameState.upgradeLevels);
    expect(restored.discLevels).toEqual(initialGameState.discLevels);
    expect(restored.botCounts).toEqual(initialGameState.botCounts);
    expect(restored.difficultyWinCounts).toEqual(initialGameState.difficultyWinCounts);
    expect(restored.highestUnlockedDifficultyIndex).toBe(0);
    expect(restored.giantDiscCount).toBe(0);
    expect(restored.soundEnabled).toBe(initialGameState.soundEnabled);
    expect(restored.soundVolumeLevel).toBe(AUDIO_SETTINGS.defaultLevel);
    expect(restored.vibrationEnabled).toBe(initialGameState.vibrationEnabled);
    expect(restored.lastSavedAt).toBe(0);
  });

  test('외부 저장 숫자는 정수화하고 필드별 상한에서 포화시킨다', () => {
    const restored = mergeSavedGame({
      cookies: Number.MAX_VALUE,
      lifetimeCookies: 123.9,
      saveVersion: SAVE_MIGRATIONS.currentSaveVersion,
      legacyCookieEvolutionBonusLevels: Number.MAX_VALUE,
      upgradeLevels: {
        ...initialGameState.upgradeLevels,
        clickPower: 12.9,
      },
      discLevels: {
        [DISCS[0].id]: 8.9,
      },
      botCounts: {
        [BOTS[0].id]: Number.MAX_VALUE,
        [BOTS[1].id]: 4.9,
      },
      difficultyWinCounts: {
        [DIFFICULTIES[0].id]: Number.MAX_VALUE,
        [DIFFICULTIES[1].id]: 3.9,
      },
      giantDiscCount: Number.MAX_VALUE,
      soundVolumeLevel: 3.9,
      lastSavedAt: Number.MAX_VALUE,
    } as any);

    expect(restored.cookies).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.lifetimeCookies).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.legacyCookieEvolutionBonusLevels).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.upgradeLevels.clickPower).toBe(12);
    expect(restored.discLevels[DISCS[0].id]).toBe(8);
    expect(restored.botCounts[BOTS[0].id]).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.botCounts[BOTS[1].id]).toBe(4);
    expect(restored.difficultyWinCounts[DIFFICULTIES[0].id]).toBe(
      PROGRESSION.winsToUnlockNextDifficulty,
    );
    expect(restored.difficultyWinCounts[DIFFICULTIES[1].id]).toBe(3);
    expect(restored.highestUnlockedDifficultyIndex).toBe(1);
    expect(restored.giantDiscCount).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.soundVolumeLevel).toBe(3);
    expect(restored.lastSavedAt).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('누적 쿠키와 클리어 목록은 정규화된 진행 상태의 불변식을 따른다', () => {
    const restored = mergeSavedGame({
      cookies: 12,
      lifetimeCookies: 5,
      difficultyWinCounts: {
        [DIFFICULTIES[0].id]: 2,
        'unknown-difficulty': 20,
      },
      clearedDifficultyIds: [DIFFICULTIES[1].id, 'unknown-difficulty'],
    });

    expect(restored.lifetimeCookies).toBe(12);
    expect(restored.clearedDifficultyIds).toEqual([
      DIFFICULTIES[0].id,
      DIFFICULTIES[1].id,
    ]);
    expect(restored.difficultyWinCounts[DIFFICULTIES[0].id]).toBe(2);
    expect(restored.difficultyWinCounts[DIFFICULTIES[1].id]).toBe(1);
    expect(restored.difficultyWinCounts).not.toHaveProperty('unknown-difficulty');
  });

  test('저장 배열 자리에 잘못된 타입이 들어와도 진행 복구가 중단되지 않는다', () => {
    let restored: ReturnType<typeof mergeSavedGame> | undefined;
    expect(() => {
      restored = mergeSavedGame({
        ownedDiscIds: 'choco-chip-disc',
        clearedDifficultyIds: DIFFICULTIES[0].id,
        rewardClaimedStageIds: 123,
        discoveredMonsterIds: {},
        newMonsterIds: false,
      } as any);
    }).not.toThrow();
    expect(restored!.ownedDiscIds).toEqual([]);
    expect(restored!.clearedDifficultyIds).toEqual([]);
    expect(restored!.rewardClaimedStageIds).toEqual([]);
    expect(restored!.discoveredMonsterIds).toEqual([]);
    expect(restored!.newMonsterIds).toEqual([]);
  });

  test('이전·현재 쿠키봇 수량을 합칠 때도 안전 정수 상한을 넘지 않는다', () => {
    const restored = mergeSavedGame({
      botCounts: {
        [BOTS[0].id]: Number.MAX_SAFE_INTEGER,
        'cookie-bot': 50,
      },
    });

    expect(restored.botCounts[BOTS[0].id]).toBe(Number.MAX_SAFE_INTEGER);
  });
});
