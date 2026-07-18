import {
  AUDIO_SETTINGS,
  BOTS,
  COOKIE_UPGRADES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  PROGRESSION,
} from '../src/config';
import {
  calculateBotPrice,
  calculateCookieStats,
  getCookieEvolutionProgress,
  getBattleStageId,
  getDiscProgress,
  getSortedUpgradeProgress,
  getUpgradeProgress,
} from '../src/domain/gameSelectors';
import { gameReducer, initialGameState, mergeSavedGame } from '../src/state/gameReducer';

describe('게임 저장 상태', () => {
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
    const before = getDiscProgress(highLevelState, disc.id);
    const upgraded = gameReducer(highLevelState, { type: 'UPGRADE_DISC', discId: disc.id });
    expect(before.next?.level).toBe(101);
    expect(before.current.cooldownMs).toBe(DISC_UPGRADE_RULES.minimumCooldownMs);
    expect(before.next.damage).toBeGreaterThan(before.current.damage);
    expect(before.next.size).toBeGreaterThan(before.current.size);
    expect(before.next.speed).toBeGreaterThan(before.current.speed);
    expect(upgraded.discLevels[disc.id]).toBe(101);
  });

  test('이전 단일 원반 저장은 첫 원반의 소유·레벨로 안전하게 이전된다', () => {
    const migrated = mergeSavedGame({
      discOwned: true,
      discLevel: 4,
      botCounts: { 'cookie-bot': 3 },
    });
    expect(migrated.saveVersion).toBe(7);
    expect(migrated.ownedDiscIds).toEqual([DISCS[0].id]);
    expect(migrated.discLevels[DISCS[0].id]).toBe(4);
    expect(migrated.botCounts[BOTS[0].id]).toBe(3);
    expect('autoBattleEnabled' in migrated).toBe(false);
  });

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
    expect(evolution.totalUpgradeLevels).toBe(10);
    expect(evolution.active.id).toBe('fortune-cookie');
    expect(stats.clickPower).toBeGreaterThan(34);
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
      'cookieSize',
    ]);
    expect(sorted.slice(0, 2).every((item) => item.affordable)).toBe(true);
    expect(sorted[2].affordable).toBe(false);
    expect(sorted[3].next).toBeUndefined();
  });
});
