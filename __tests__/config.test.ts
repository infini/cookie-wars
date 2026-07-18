import {
  AUDIO_SETTINGS,
  BATTLE_STAGE_RULES,
  BATTLE_RULES,
  BATTLE_REWARDS,
  BATTLE_FEEDBACK,
  BATTLE_MAPS,
  BOSS_BALANCE,
  BOSS_ANIMATION,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
  BOT_ANIMATION,
  BOTS,
  COOKIE_CRITICAL,
  COOKIE_FEEDBACK,
  COOKIE_UPGRADES,
  COOKIE_UPGRADE_RULES,
  COOKIES,
  CONFIG_TABLES,
  ConfigValidationError,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  ENEMY_DISCS,
  ENEMY_WAVES,
  GIANT_DISC,
  MONSTERS,
  PROGRESSION,
  SAVE_MIGRATIONS,
  getBattleMapForDifficulty,
  getCookie,
  getDifficulty,
  getEnemyDisc,
  getEnemyWave,
  getMonster,
  validateGameConfig,
} from '../src/config';
import { getBattleDifficulty } from '../src/domain/gameSelectors';

describe('데이터 테이블', () => {
  test('요청한 15개 난이도 순서를 유지한다', () => {
    expect(DIFFICULTIES.map((difficulty) => difficulty.name)).toEqual([
      'easy',
      'normal',
      'hard',
      'harder',
      'insane',
      'easy demon',
      'medium demon',
      'hard demon',
      'insane demon',
      'extreme demon',
      'easy god',
      'medium god',
      'hard god',
      'insane god',
      'extreme god',
    ]);
  });

  test('난이도가 올라도 보스는 한 마리이고 원반과 능력치만 오른다', () => {
    DIFFICULTIES.slice(1).forEach((difficulty, index) => {
      expect('reward' in difficulty).toBe(false);
      expect(difficulty.enemyCount).toBe(1);
      expect(difficulty.enemyDiscLevel).toBeGreaterThan(DIFFICULTIES[index].enemyDiscLevel);
      expect(difficulty.moveSpeed).toBeGreaterThanOrEqual(DIFFICULTIES[index].moveSpeed);
      expect(difficulty.hpMultiplier).toBeGreaterThan(DIFFICULTIES[index].hpMultiplier);
      expect(difficulty.attackMultiplier).toBeGreaterThan(DIFFICULTIES[index].attackMultiplier);
    });
    expect('reward' in DIFFICULTIES[0]).toBe(false);
    expect(DIFFICULTIES[0].enemyCount).toBe(1);
    expect(ENEMY_DISCS).toHaveLength(15);
  });

  test('각 난이도는 고유한 보스 웨이브를 참조한다', () => {
    expect(ENEMY_WAVES).toHaveLength(DIFFICULTIES.length);
    expect(new Set(DIFFICULTIES.map((difficulty) => difficulty.enemyWaveId)).size)
      .toBe(DIFFICULTIES.length);
    expect(new Set(ENEMY_WAVES.map((wave) => wave.bossMonsterId)).size)
      .toBe(DIFFICULTIES.length);
    ENEMY_WAVES.forEach((wave) => {
      expect(wave.monsterPatternIds).toEqual([wave.bossMonsterId]);
      expect(wave.bossEveryEnemies).toBe(1);
    });
    const bosses = MONSTERS.filter((monster) => monster.rank === '보스');
    const combatProfiles = new Set(bosses.map((boss) => JSON.stringify({
      baseHp: boss.baseHp,
      baseAttack: boss.baseAttack,
      moveSpeedMultiplier: boss.moveSpeedMultiplier,
      discDamageMultiplier: boss.discDamageMultiplier,
      sizeMultiplier: boss.sizeMultiplier,
    })));
    expect(combatProfiles.size).toBe(1);
  });

  test('모든 난이도는 실제 웨이브와 몬스터 테이블을 참조한다', () => {
    const monsterIds = new Set(MONSTERS.map((monster) => monster.id));
    const waveIds = new Set(ENEMY_WAVES.map((wave) => wave.id));
    DIFFICULTIES.forEach((difficulty) => {
      expect(waveIds.has(difficulty.enemyWaveId)).toBe(true);
    });
    ENEMY_WAVES.forEach((wave) => {
      wave.monsterPatternIds.forEach((monsterId) => expect(monsterIds.has(monsterId)).toBe(true));
      expect(monsterIds.has(wave.bossMonsterId)).toBe(true);
    });
    expect(MONSTERS.slice(0, 4).map((monster) => monster.rank))
      .toEqual(['졸개', '정예', '중장갑', '원거리']);
    expect(MONSTERS.filter((monster) => monster.rank === '보스'))
      .toHaveLength(DIFFICULTIES.length);
  });

  test('진행·음량·상점 값은 데이터 테이블에서 제공한다', () => {
    expect(PROGRESSION.winsToUnlockNextDifficulty).toBe(20);
    expect(PROGRESSION.giantDiscRewardPerFirstClear).toBe(1);
    expect(SAVE_MIGRATIONS.currentSaveVersion).toBe(10);
    expect(SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion).toBe(8);
    expect(SAVE_MIGRATIONS.battleMedalMigrationVersion).toBe(9);
    expect(SAVE_MIGRATIONS.battleMedalsPerLegacyWin).toBe(1);
    expect(BATTLE_REWARDS).toEqual({
      battleMedalsPerStageClear: 1,
      clickPowerBonusPercentPerMedal: 1,
      autoProductionBonusPercentPerMedal: 1,
      castleHealthBonusPercentPerMedal: 1,
    });
    expect(SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade).toEqual({
      id: 'cookieSize',
      baseLevel: 1,
      maximumLevel: 6,
    });
    expect(GIANT_DISC.damageMultiplier).toBe(30);
    expect(GIANT_DISC.renderWidthRatio).toBeGreaterThanOrEqual(1 / 3);
    expect(AUDIO_SETTINGS.levels.map((item) => item.level)).toEqual([1, 2, 3, 4, 5]);
    expect(DISCS).toHaveLength(5);
    expect(BOTS).toHaveLength(5);
    expect(DISCS.every((disc) => disc.purchaseCost > 0)).toBe(true);
    expect(BOTS.every((bot) => bot.baseCost > 0 && bot.costMultiplier >= 1)).toBe(true);
    expect(BOTS[BOTS.length - 1].discDamageMultiplier).toBeGreaterThanOrEqual(
      BOTS[0].discDamageMultiplier * 20,
    );
    expect(BOTS[BOTS.length - 1].attackIntervalMs).toBeLessThanOrEqual(
      BOTS[0].attackIntervalMs / 5,
    );
    expect(DISCS[DISCS.length - 1].levels[0].damage).toBeGreaterThanOrEqual(
      DISCS[0].levels[0].damage * 40,
    );
    expect(DISC_UPGRADE_RULES.minimumCooldownMs).toBeGreaterThan(0);
    expect(BATTLE_RULES.botDiscSizeMultiplier).toBeGreaterThan(0);
    expect(BATTLE_RULES.botDiscSizeMultiplier).toBeLessThan(1);
    expect(Object.keys(COOKIE_UPGRADE_RULES).sort()).toEqual([
      'autoProduction',
      'clickPower',
      'cookieCritical',
      'cookieHealth',
    ]);
    const cookieSize = COOKIE_UPGRADES.find((upgrade) => upgrade.id === 'cookieSize');
    expect(cookieSize).toMatchObject({
      enabled: false,
      visible: false,
      countsTowardCookieEvolution: false,
      renderBaseSizePixels: 190,
      renderMaximumSizePixels: 224,
    });
    expect(
      COOKIE_UPGRADES
        .filter((upgrade) => upgrade.countsTowardCookieEvolution)
        .map((upgrade) => upgrade.id),
    ).toEqual(['clickPower', 'cookieCritical', 'autoProduction', 'cookieHealth']);
    expect(COOKIE_UPGRADES.every(
      (upgrade) => typeof upgrade.countsTowardCookieEvolution === 'boolean',
    )).toBe(true);
    expect(Math.max(...cookieSize!.levels.map((level) => level.value))).toBeGreaterThan(0);
    expect(COOKIES).toHaveLength(50);
    expect(COOKIES.map((cookie) => cookie.requiredTotalUpgradeLevels)).toEqual(
      Array.from({ length: 50 }, (_, index) => 3 + index * 6),
    );
    COOKIES.slice(1).forEach((cookie, index) => {
      expect(cookie.requiredTotalUpgradeLevels).toBeGreaterThan(
        COOKIES[index].requiredTotalUpgradeLevels,
      );
      expect(cookie.clickMultiplier).toBeGreaterThan(COOKIES[index].clickMultiplier);
      expect(cookie.autoProductionMultiplier).toBe(cookie.clickMultiplier);
      expect(cookie.healthMultiplier).toBe(cookie.clickMultiplier);
    });
    expect(new Set(COOKIES.map((cookie) => cookie.name)).size).toBe(COOKIES.length);
    expect(new Set(COOKIES.map((cookie) => cookie.imageKey)).size).toBe(COOKIES.length);
    expect(COOKIES[10].name).toBe('별사탕 쿠키');
    expect(COOKIES[29].name).toBe('무한 우주 쿠키');
    expect(COOKIES[30].name).toBe('혜성 꼬리 쿠키');
    expect(COOKIES[COOKIES.length - 1].name).toBe('쿠키왕국 심장 쿠키');
    expect(COOKIE_CRITICAL.probabilityScale).toBe(10_000);
    expect(COOKIE_CRITICAL.maximumChanceUnits).toBe(5_000);
    expect(COOKIE_CRITICAL.baseRewardMultiplier).toBe(10);
    expect(COOKIE_FEEDBACK.audio.voicePlaybackRates).toHaveLength(3);
    expect(COOKIE_FEEDBACK.audio.voiceVolumeMultipliers).toHaveLength(3);
    expect(COOKIE_FEEDBACK.audio.minimumFullCriticalIntervalMs)
      .toBeGreaterThanOrEqual(COOKIE_FEEDBACK.audio.criticalLayerDurationMs);
    expect(COOKIE_FEEDBACK.criticalEffect.maximumConcurrentFullEffects).toBe(2);
    expect(COOKIE_FEEDBACK.criticalEffect.durationMs)
      .toBeLessThanOrEqual(COOKIE_FEEDBACK.floatingGain.durationMs);
    expect(BOSS_BALANCE.playerPowerBaseSurvivalSeconds).toBeGreaterThan(0);
    expect(BOSS_BALANCE.hpMultiplierReference).toBeGreaterThan(0);
    expect(BOSS_BALANCE.maximumPowerScaledSurvivalSeconds)
      .toBeGreaterThan(BOSS_BALANCE.playerPowerBaseSurvivalSeconds);
    expect(BOSS_BALANCE.minimumAutomaticHitsToDefeat).toBeGreaterThan(1);
    expect(BOSS_BEHAVIOR.globalAttackDamageMultiplier).toBe(2);
    expect(BOSS_BEHAVIOR.globalAttackCooldownMultiplier).toBe(0.5);
    expect(BOSS_BEHAVIOR.globalMoveSpeedMultiplier).toBe(0.8);
    expect(BOSS_BEHAVIOR.globalDifficultyMultiplier).toBe(1.2);
    expect(BOSS_BEHAVIOR.enrageHealthRatio).toBe(0.5);
    expect(BOSS_SPECIAL_ATTACK.intervalMs).toBe(5000);
    expect(BOSS_SPECIAL_ATTACK.windupMs).toBeGreaterThan(0);
    expect(BOSS_ANIMATION.sets).toHaveLength(DIFFICULTIES.length);
    expect(BOSS_ANIMATION.walkFrameSequence).toHaveLength(4);
    expect(BOSS_ANIMATION.impactHoldMs).toBeGreaterThan(0);
    expect(BOT_ANIMATION.sets).toHaveLength(BOTS.length);
    expect(BOT_ANIMATION.runFrameSequence).toHaveLength(4);
    expect(BOT_ANIMATION.throwWindupMs).toBeGreaterThan(0);
    expect(BOSS_SPECIAL_ATTACK.impactCrackPaths.length).toBeGreaterThan(0);
    expect(BOSS_SPECIAL_ATTACK.projectileScale).toBeGreaterThan(1);
    expect(BATTLE_FEEDBACK.enemyAttackWindupMs).toBeGreaterThan(0);
    expect(BATTLE_FEEDBACK.impactEffectDurationMs).toBeGreaterThan(0);
    expect(BATTLE_FEEDBACK.impactBursts.length).toBeGreaterThanOrEqual(4);
    expect(BATTLE_RULES.battleSpeedMultipliers).toEqual([1, 2, 3]);
    expect(BATTLE_RULES.defaultBattleSpeedMultiplier).toBe(1);
  });

  test('각 난이도는 색상 변경이 아닌 고유 전장 테마를 사용한다', () => {
    expect(BATTLE_MAPS).toHaveLength(DIFFICULTIES.length);
    expect(new Set(BATTLE_MAPS.map((map) => map.imageKey)).size).toBe(BATTLE_MAPS.length);
    expect(new Set(BATTLE_MAPS.map((map) => map.name)).size).toBe(BATTLE_MAPS.length);
    expect(new Set(BATTLE_MAPS.map((map) => map.difficultyId)).size)
      .toBe(DIFFICULTIES.length);
    DIFFICULTIES.forEach((difficulty) => {
      expect(getBattleMapForDifficulty(difficulty.id).difficultyId).toBe(difficulty.id);
    });
  });

  test('길 없는 보스 전장의 위치와 공격 반경은 데이터 테이블에서 제공한다', () => {
    expect(BATTLE_RULES.enemyX).toBe(BATTLE_RULES.playerStartX);
    expect(BATTLE_RULES.enemyStartY).toBeLessThan(BATTLE_RULES.enemyStopY);
    expect(BATTLE_RULES.castleAttackRadius).toBeGreaterThan(0);
    expect(BATTLE_RULES.castleAttackRadius).toBeLessThan(1);
    expect(BATTLE_RULES.botAttackRadius).toBeGreaterThan(0);
    expect(BATTLE_RULES.botAttackRadius).toBeLessThan(1);
    expect(BATTLE_RULES.botAttackRadius).toBeGreaterThan(BATTLE_RULES.castleAttackRadius);
    expect(BATTLE_RULES.enemyAttackRadius).toBeGreaterThan(0);
    expect(BATTLE_RULES.maximumSimultaneousEnemyProjectiles).toBeGreaterThan(0);
  });

  test('같은 난이도도 승리할 때마다 다음 전투가 강해진다', () => {
    const first = getBattleDifficulty(DIFFICULTIES[0], 0);
    const second = getBattleDifficulty(DIFFICULTIES[0], 1);
    const final = getBattleDifficulty(DIFFICULTIES[0], PROGRESSION.winsToUnlockNextDifficulty - 1);
    expect(BATTLE_STAGE_RULES.hpMultiplierPerWin).toBeGreaterThan(0);
    expect(BATTLE_STAGE_RULES.hpMultiplierPerWin).toBeCloseTo(0.08);
    expect(BATTLE_STAGE_RULES.attackMultiplierPerWin).toBeCloseTo(0.05);
    expect(BATTLE_STAGE_RULES.moveSpeedMultiplierPerWin).toBeCloseTo(0.001);
    expect(BATTLE_STAGE_RULES.extraEnemiesPerStep).toBe(0);
    expect(second.hpMultiplier).toBeGreaterThan(first.hpMultiplier);
    expect(second.attackMultiplier).toBeGreaterThan(first.attackMultiplier);
    expect(second.moveSpeed).toBeGreaterThan(first.moveSpeed);
    expect(final.enemyCount).toBe(1);
    expect(final.enemyDiscLevel).toBe(first.enemyDiscLevel);
  });

  test('다음 난이도의 첫 전투는 이전 난이도의 20번째 전투보다 항상 강하다', () => {
    DIFFICULTIES.slice(1).forEach((nextBase, index) => {
      const previousFinal = getBattleDifficulty(
        DIFFICULTIES[index],
        PROGRESSION.winsToUnlockNextDifficulty - 1,
      );
      const nextFirst = getBattleDifficulty(nextBase, 0);
      expect(nextFirst.hpMultiplier).toBeGreaterThan(previousFinal.hpMultiplier);
      expect(nextFirst.attackMultiplier).toBeGreaterThan(previousFinal.attackMultiplier);
      expect(nextFirst.moveSpeed).toBeGreaterThan(previousFinal.moveSpeed);
      expect(nextFirst.enemyDiscLevel).toBeGreaterThan(previousFinal.enemyDiscLevel);
    });
  });
});

describe('데이터 테이블 런타임 검증', () => {
  const cloneConfig = (): any => JSON.parse(JSON.stringify(CONFIG_TABLES));
  const requiredPositiveFields: Array<[string, (config: any) => void]> = [
    ['BATTLE_RULES.tickMs', (config) => { config.BATTLE_RULES.tickMs = 0; }],
    ['BATTLE_RULES.enemyMoveDivisor', (config) => {
      config.BATTLE_RULES.enemyMoveDivisor = 0;
    }],
    ['BATTLE_RULES.enemyProjectileMoveDivisor', (config) => {
      config.BATTLE_RULES.enemyProjectileMoveDivisor = 0;
    }],
    ['BATTLE_RULES.enemyMeleeIntervalMs', (config) => {
      config.BATTLE_RULES.enemyMeleeIntervalMs = 0;
    }],
    ['BATTLE_RULES.playerHomingMs', (config) => {
      config.BATTLE_RULES.playerHomingMs = 0;
    }],
    ['BATTLE_RULES.playerProjectileMoveDivisor', (config) => {
      config.BATTLE_RULES.playerProjectileMoveDivisor = 0;
    }],
    ['BATTLE_STAGE_RULES.extraEnemyEveryWins', (config) => {
      config.BATTLE_STAGE_RULES.extraEnemyEveryWins = 0;
    }],
    ['BATTLE_STAGE_RULES.enemyDiscLevelEveryWins', (config) => {
      config.BATTLE_STAGE_RULES.enemyDiscLevelEveryWins = 0;
    }],
    ['BOTS[0].attackIntervalMs', (config) => { config.BOTS[0].attackIntervalMs = 0; }],
    ['DISCS[0].levels[0].cooldownMs', (config) => {
      config.DISCS[0].levels[0].cooldownMs = 0;
    }],
    ['DISC_UPGRADE_RULES.minimumCooldownMs', (config) => {
      config.DISC_UPGRADE_RULES.minimumCooldownMs = 0;
    }],
    ['ENEMY_DISCS[0].cooldownMs', (config) => {
      config.ENEMY_DISCS[0].cooldownMs = 0;
    }],
    ['BOSS_BALANCE.hpMultiplierReference', (config) => {
      config.BOSS_BALANCE.hpMultiplierReference = 0;
    }],
    ['BOSS_BEHAVIOR.globalAttackCooldownMultiplier', (config) => {
      config.BOSS_BEHAVIOR.globalAttackCooldownMultiplier = 0;
    }],
    ['BOSS_SPECIAL_ATTACK.intervalMs', (config) => {
      config.BOSS_SPECIAL_ATTACK.intervalMs = 0;
    }],
    ['BATTLE_FEEDBACK.enemyAttackWindupMs', (config) => {
      config.BATTLE_FEEDBACK.enemyAttackWindupMs = 0;
    }],
    ['BATTLE_UI.projectileSpinDurationMs', (config) => {
      config.BATTLE_UI.projectileSpinDurationMs = 0;
    }],
    ['GIANT_DISC.effectPulseDurationMs', (config) => {
      config.GIANT_DISC.effectPulseDurationMs = 0;
    }],
    ['PROGRESSION.autoProductionIntervalMs', (config) => {
      config.PROGRESSION.autoProductionIntervalMs = 0;
    }],
    ['SAVE_MIGRATIONS.currentSaveVersion', (config) => {
      config.SAVE_MIGRATIONS.currentSaveVersion = 0;
    }],
    ['SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion', (config) => {
      config.SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion = 0;
    }],
  ];

  const discreteIntegerFields: Array<[string, (config: any) => void]> = [
    ['BOTS[0].baseCost', (config) => { config.BOTS[0].baseCost = 35.5; }],
    ['BOTS[0].attackIntervalMs', (config) => {
      config.BOTS[0].attackIntervalMs = 1800.5;
    }],
    ['COOKIE_UPGRADES[0].levels[0].level', (config) => {
      config.COOKIE_UPGRADES[0].levels[0].level = 1.5;
    }],
    ['COOKIE_UPGRADES[0].levels[0].value', (config) => {
      config.COOKIE_UPGRADES[0].levels[0].value = 1.5;
    }],
    ['COOKIE_UPGRADES[0].levels[0].cost', (config) => {
      config.COOKIE_UPGRADES[0].levels[0].cost = 0.5;
    }],
    ['COOKIE_UPGRADE_RULES.clickPower.valueIncreasePerLevel', (config) => {
      config.COOKIE_UPGRADE_RULES.clickPower.valueIncreasePerLevel = 25.5;
    }],
    ['DISCS[0].purchaseCost', (config) => { config.DISCS[0].purchaseCost = 30.5; }],
    ['DISCS[0].levels[0].level', (config) => {
      config.DISCS[0].levels[0].level = 1.5;
    }],
    ['DISCS[0].levels[0].damage', (config) => {
      config.DISCS[0].levels[0].damage = 3.5;
    }],
    ['DISCS[0].levels[0].size', (config) => {
      config.DISCS[0].levels[0].size = 42.5;
    }],
    ['DISCS[0].levels[0].speed', (config) => {
      config.DISCS[0].levels[0].speed = 260.5;
    }],
    ['DISCS[0].levels[0].cooldownMs', (config) => {
      config.DISCS[0].levels[0].cooldownMs = 1200.5;
    }],
    ['DISCS[0].levels[0].cost', (config) => {
      config.DISCS[0].levels[0].cost = 0.5;
    }],
    ['DISC_UPGRADE_RULES.sizeIncreasePerLevel', (config) => {
      config.DISC_UPGRADE_RULES.sizeIncreasePerLevel = 1.5;
    }],
    ['DISC_UPGRADE_RULES.speedIncreasePerLevel', (config) => {
      config.DISC_UPGRADE_RULES.speedIncreasePerLevel = 8.5;
    }],
    ['DISC_UPGRADE_RULES.cooldownReductionMsPerLevel', (config) => {
      config.DISC_UPGRADE_RULES.cooldownReductionMsPerLevel = 10.5;
    }],
    ['DISC_UPGRADE_RULES.minimumCooldownMs', (config) => {
      config.DISC_UPGRADE_RULES.minimumCooldownMs = 250.5;
    }],
    ['ENEMY_DISCS[0].level', (config) => { config.ENEMY_DISCS[0].level = 1.5; }],
    ['ENEMY_DISCS[0].damage', (config) => { config.ENEMY_DISCS[0].damage = 4.5; }],
    ['ENEMY_DISCS[0].size', (config) => { config.ENEMY_DISCS[0].size = 20.5; }],
    ['ENEMY_DISCS[0].speed', (config) => { config.ENEMY_DISCS[0].speed = 90.5; }],
    ['ENEMY_DISCS[0].cooldownMs', (config) => {
      config.ENEMY_DISCS[0].cooldownMs = 3800.5;
    }],
    ['MONSTERS[0].baseHp', (config) => { config.MONSTERS[0].baseHp = 12.5; }],
    ['MONSTERS[0].baseAttack', (config) => {
      config.MONSTERS[0].baseAttack = 3.5;
    }],
    ['BATTLE_STAGE_RULES.extraEnemiesPerStep', (config) => {
      config.BATTLE_STAGE_RULES.extraEnemiesPerStep = 0.5;
    }],
    ['BATTLE_STAGE_RULES.maximumExtraEnemies', (config) => {
      config.BATTLE_STAGE_RULES.maximumExtraEnemies = 0.5;
    }],
    ['BOSS_BALANCE.minimumAutomaticHitsToDefeat', (config) => {
      config.BOSS_BALANCE.minimumAutomaticHitsToDefeat = 6.5;
    }],
    ['SAVE_MIGRATIONS.currentSaveVersion', (config) => {
      config.SAVE_MIGRATIONS.currentSaveVersion = 7.5;
    }],
    ['SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion', (config) => {
      config.SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion = 7.5;
    }],
    ['BOTS[0].baseCost', (config) => {
      config.BOTS[0].baseCost = Number.MAX_SAFE_INTEGER + 1;
    }],
  ];

  test('현재 포함된 모든 JSON 설정을 앱 로딩 경계에서 검증한다', () => {
    expect(() => validateGameConfig(cloneConfig())).not.toThrow();
  });

  test('필수 필드 누락과 잘못된 중첩 타입은 정확한 경로로 실패한다', () => {
    const missing = cloneConfig();
    delete missing.BOTS[0].name;
    expect(() => validateGameConfig(missing)).toThrow('BOTS[0].name');

    const wrongType = cloneConfig();
    wrongType.COOKIE_UPGRADES[0].levels[0].cost = '무료';
    expect(() => validateGameConfig(wrongType)).toThrow(
      'COOKIE_UPGRADES[0].levels[0].cost',
    );

    const missingEvolutionFlag = cloneConfig();
    delete missingEvolutionFlag.COOKIE_UPGRADES[0].countsTowardCookieEvolution;
    expect(() => validateGameConfig(missingEvolutionFlag)).toThrow(
      'COOKIE_UPGRADES[0].countsTowardCookieEvolution',
    );

    const invalidEvolutionFlag = cloneConfig();
    invalidEvolutionFlag.COOKIE_UPGRADES[0].countsTowardCookieEvolution = '예';
    expect(() => validateGameConfig(invalidEvolutionFlag)).toThrow(
      'COOKIE_UPGRADES[0].countsTowardCookieEvolution',
    );

    const hiddenEvolutionUpgrade = cloneConfig();
    hiddenEvolutionUpgrade.COOKIE_UPGRADES[0].visible = false;
    expect(() => validateGameConfig(hiddenEvolutionUpgrade)).toThrow(
      'COOKIE_UPGRADES[0].countsTowardCookieEvolution',
    );

    const noEvolutionUpgrades = cloneConfig();
    noEvolutionUpgrades.COOKIE_UPGRADES.forEach((upgrade: any) => {
      upgrade.countsTowardCookieEvolution = false;
    });
    expect(() => validateGameConfig(noEvolutionUpgrades)).toThrow(
      'COOKIE_UPGRADES.countsTowardCookieEvolution',
    );

    const migrationAfterCurrentVersion = cloneConfig();
    migrationAfterCurrentVersion.SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion =
      SAVE_MIGRATIONS.currentSaveVersion + 1;
    expect(() => validateGameConfig(migrationAfterCurrentVersion)).toThrow(
      'SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion',
    );

    const medalMigrationAfterCurrentVersion = cloneConfig();
    medalMigrationAfterCurrentVersion.SAVE_MIGRATIONS.battleMedalMigrationVersion =
      SAVE_MIGRATIONS.currentSaveVersion + 1;
    expect(() => validateGameConfig(medalMigrationAfterCurrentVersion)).toThrow(
      'SAVE_MIGRATIONS.battleMedalMigrationVersion',
    );

    const invalidLegacyMedalReward = cloneConfig();
    invalidLegacyMedalReward.SAVE_MIGRATIONS.battleMedalsPerLegacyWin = 0;
    expect(() => validateGameConfig(invalidLegacyMedalReward)).toThrow(
      'SAVE_MIGRATIONS.battleMedalsPerLegacyWin',
    );

    const invalidStageMedalReward = cloneConfig();
    invalidStageMedalReward.BATTLE_REWARDS.battleMedalsPerStageClear = 0;
    expect(() => validateGameConfig(invalidStageMedalReward)).toThrow(
      'BATTLE_REWARDS.battleMedalsPerStageClear',
    );

    const invalidMedalBonus = cloneConfig();
    invalidMedalBonus.BATTLE_REWARDS.autoProductionBonusPercentPerMedal = 0;
    expect(() => validateGameConfig(invalidMedalBonus)).toThrow(
      'BATTLE_REWARDS.autoProductionBonusPercentPerMedal',
    );

    const fractionalMedalBonus = cloneConfig();
    fractionalMedalBonus.BATTLE_REWARDS.castleHealthBonusPercentPerMedal = 1.5;
    expect(() => validateGameConfig(fractionalMedalBonus)).toThrow(
      'BATTLE_REWARDS.castleHealthBonusPercentPerMedal',
    );

    const missingLegacyUpgrade = cloneConfig();
    delete missingLegacyUpgrade.SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade;
    expect(() => validateGameConfig(missingLegacyUpgrade)).toThrow(
      'SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade',
    );

    const reversedLegacyRange = cloneConfig();
    reversedLegacyRange.SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade.maximumLevel = 0;
    expect(() => validateGameConfig(reversedLegacyRange)).toThrow(
      'SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade.maximumLevel',
    );

    const unorderedCookies = cloneConfig();
    unorderedCookies.COOKIES[1].requiredTotalUpgradeLevels = (
      unorderedCookies.COOKIES[0].requiredTotalUpgradeLevels
    );
    expect(() => validateGameConfig(unorderedCookies)).toThrow(
      'COOKIES[1].requiredTotalUpgradeLevels',
    );

    const mismatchedCookieMultiplier = cloneConfig();
    mismatchedCookieMultiplier.COOKIES[1].autoProductionMultiplier = (
      mismatchedCookieMultiplier.COOKIES[1].clickMultiplier + 0.01
    );
    expect(() => validateGameConfig(mismatchedCookieMultiplier)).toThrow(
      'COOKIES[1].autoProductionMultiplier',
    );

    const decreasingCookieMultiplier = cloneConfig();
    decreasingCookieMultiplier.COOKIES[1].clickMultiplier = (
      decreasingCookieMultiplier.COOKIES[0].clickMultiplier
    );
    decreasingCookieMultiplier.COOKIES[1].autoProductionMultiplier = (
      decreasingCookieMultiplier.COOKIES[0].clickMultiplier
    );
    decreasingCookieMultiplier.COOKIES[1].healthMultiplier = (
      decreasingCookieMultiplier.COOKIES[0].clickMultiplier
    );
    expect(() => validateGameConfig(decreasingCookieMultiplier)).toThrow(
      'COOKIES[1].clickMultiplier',
    );

    const missingBattleFlashOpacity = cloneConfig();
    delete missingBattleFlashOpacity.BATTLE_FEEDBACK.screenFlashMaximumOpacity;
    expect(() => validateGameConfig(missingBattleFlashOpacity)).toThrow(
      'BATTLE_FEEDBACK.screenFlashMaximumOpacity',
    );

    const invalidBattleFlashOpacity = cloneConfig();
    invalidBattleFlashOpacity.BATTLE_FEEDBACK.screenFlashMaximumOpacity = 1.1;
    expect(() => validateGameConfig(invalidBattleFlashOpacity)).toThrow(
      'BATTLE_FEEDBACK.screenFlashMaximumOpacity',
    );
  });

  test('중복 ID와 존재하지 않는 테이블 참조는 앱 시작 전에 실패한다', () => {
    const duplicate = cloneConfig();
    duplicate.DISCS[1].id = duplicate.DISCS[0].id;
    expect(() => validateGameConfig(duplicate)).toThrow("중복 값 'choco-chip-disc'");

    const duplicateCookieImage = cloneConfig();
    duplicateCookieImage.COOKIES[1].imageKey = duplicateCookieImage.COOKIES[0].imageKey;
    expect(() => validateGameConfig(duplicateCookieImage)).toThrow('COOKIES.imageKey[1]');

    const duplicateCookieName = cloneConfig();
    duplicateCookieName.COOKIES[1].name = duplicateCookieName.COOKIES[0].name;
    expect(() => validateGameConfig(duplicateCookieName)).toThrow('COOKIES.name[1]');

    const invalidReference = cloneConfig();
    invalidReference.DIFFICULTIES[0].enemyWaveId = 'missing-wave';
    expect(() => validateGameConfig(invalidReference)).toThrow(
      "존재하지 않는 웨이브 ID 'missing-wave'",
    );

    const invalidMigration = cloneConfig();
    invalidMigration.SAVE_MIGRATIONS.botIdAliases['old-bot'] = 'missing-bot';
    expect(() => validateGameConfig(invalidMigration)).toThrow(
      'SAVE_MIGRATIONS.botIdAliases.old-bot',
    );
  });

  test('잘못된 조회 키를 첫 번째 행으로 조용히 대체하지 않는다', () => {
    expect(() => getDifficulty('missing')).toThrow(ConfigValidationError);
    expect(() => getDifficulty('missing')).toThrow('DIFFICULTIES.id.missing');
    expect(() => getBattleMapForDifficulty('missing')).toThrow(
      'BATTLE_MAPS.difficultyId.missing',
    );
    expect(() => getEnemyDisc(999)).toThrow('ENEMY_DISCS.level.999');
    expect(() => getEnemyWave('missing')).toThrow('ENEMY_WAVES.id.missing');
    expect(() => getMonster('missing')).toThrow('MONSTERS.id.missing');
    expect(() => getCookie('missing')).toThrow('COOKIES.id.missing');
  });

  test.each(requiredPositiveFields)('%s는 0을 허용하지 않는다', (path, setZero) => {
    const invalid = cloneConfig();
    setZero(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test.each(discreteIntegerFields)('%s는 안전 정수만 허용한다', (path, setDecimal) => {
    const invalid = cloneConfig();
    setDecimal(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test('배율과 비율의 소수 값은 검증 후에도 그대로 보존한다', () => {
    const valid = cloneConfig();
    valid.BOTS[0].costMultiplier = 1.125;
    valid.BOTS[0].discDamageMultiplier = 1.375;
    valid.COOKIE_UPGRADE_RULES.clickPower.costGrowthMultiplier = 1.225;
    valid.DISC_UPGRADE_RULES.damageGrowthMultiplier = 1.135;
    valid.DISC_UPGRADE_RULES.costGrowthMultiplier = 1.215;
    valid.DIFFICULTIES[0].hpMultiplier = 0.125;
    valid.DIFFICULTIES[0].attackMultiplier = 0.375;
    valid.DIFFICULTIES[0].moveSpeed = 0.625;
    valid.MONSTERS[0].moveSpeedMultiplier = 0.875;
    valid.MONSTERS[0].discDamageMultiplier = 1.625;
    valid.MONSTERS[0].sizeMultiplier = 0.9375;

    const validated = validateGameConfig(valid);

    expect(validated.BOTS[0]).toMatchObject({
      costMultiplier: 1.125,
      discDamageMultiplier: 1.375,
    });
    expect(validated.COOKIE_UPGRADE_RULES.clickPower.costGrowthMultiplier).toBe(1.225);
    expect(validated.DISC_UPGRADE_RULES).toMatchObject({
      damageGrowthMultiplier: 1.135,
      costGrowthMultiplier: 1.215,
    });
    expect(validated.DIFFICULTIES[0]).toMatchObject({
      hpMultiplier: 0.125,
      attackMultiplier: 0.375,
      moveSpeed: 0.625,
    });
    expect(validated.MONSTERS[0]).toMatchObject({
      moveSpeedMultiplier: 0.875,
      discDamageMultiplier: 1.625,
      sizeMultiplier: 0.9375,
    });
  });

  test('효과음 음량 단계는 정확히 1~5가 모두 있어야 한다', () => {
    const invalid = cloneConfig();
    invalid.AUDIO_SETTINGS.levels.splice(2, 1);
    expect(() => validateGameConfig(invalid)).toThrow('AUDIO_SETTINGS.levels');
  });

  test('효과음 음량 단계는 1부터 5까지 순서대로 정의해야 한다', () => {
    const invalid = cloneConfig();
    invalid.AUDIO_SETTINGS.levels.reverse();
    expect(() => validateGameConfig(invalid)).toThrow(
      'AUDIO_SETTINGS.levels[0].level',
    );
  });

  test('효과음 음량은 단계가 오를 때마다 반드시 커져야 한다', () => {
    const invalid = cloneConfig();
    invalid.AUDIO_SETTINGS.levels[2].volume = invalid.AUDIO_SETTINGS.levels[1].volume;
    expect(() => validateGameConfig(invalid)).toThrow(
      'AUDIO_SETTINGS.levels[2].volume',
    );
  });

  test('쿠키 클릭 보이스의 재생 속도와 음량 설정 개수가 다르면 거부한다', () => {
    const invalid = cloneConfig();
    invalid.COOKIE_FEEDBACK.audio.voiceVolumeMultipliers.pop();
    expect(() => validateGameConfig(invalid)).toThrow(
      'COOKIE_FEEDBACK.audio.voiceVolumeMultipliers',
    );
  });

  test('강한 크리티컬 간격이 오디오 레이어 길이보다 짧으면 거부한다', () => {
    const invalid = cloneConfig();
    invalid.COOKIE_FEEDBACK.audio.minimumFullCriticalIntervalMs =
      invalid.COOKIE_FEEDBACK.audio.criticalLayerDurationMs - 1;
    expect(() => validateGameConfig(invalid)).toThrow(
      'COOKIE_FEEDBACK.audio.minimumFullCriticalIntervalMs',
    );
  });

  test('크리티컬 연출이 획득 텍스트보다 오래 남도록 설정하면 거부한다', () => {
    const invalid = cloneConfig();
    invalid.COOKIE_FEEDBACK.criticalEffect.durationMs =
      invalid.COOKIE_FEEDBACK.floatingGain.durationMs + 1;
    expect(() => validateGameConfig(invalid)).toThrow(
      'COOKIE_FEEDBACK.criticalEffect.durationMs',
    );
  });

  test.each([
    ['COOKIE_FEEDBACK.criticalEffect.ringFadeStartProgress', (config: any) => {
      config.COOKIE_FEEDBACK.criticalEffect.ringFadeStartProgress =
        config.COOKIE_FEEDBACK.criticalEffect.secondRingStartProgress;
    }],
    ['COOKIE_FEEDBACK.criticalEffect.sparkleFadeStartProgress', (config: any) => {
      config.COOKIE_FEEDBACK.criticalEffect.sparkleStaggerProgress = 0.2;
    }],
    ['COOKIE_FEEDBACK.criticalEffect.compactDurationMs', (config: any) => {
      config.COOKIE_FEEDBACK.criticalEffect.compactDurationMs =
        config.COOKIE_FEEDBACK.floatingGain.durationMs + 1;
    }],
  ])('%s의 보간 범위가 잘못되면 거부한다', (path, breakRange) => {
    const invalid = cloneConfig();
    breakRange(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test('보너스·추가 수량·최초 지연처럼 0이 의미 있는 설정은 계속 허용한다', () => {
    const valid = cloneConfig();
    valid.BATTLE_STAGE_RULES.hpMultiplierPerWin = 0;
    valid.BATTLE_STAGE_RULES.attackMultiplierPerWin = 0;
    valid.BATTLE_STAGE_RULES.moveSpeedMultiplierPerWin = 0;
    valid.BATTLE_STAGE_RULES.extraEnemiesPerStep = 0;
    valid.BATTLE_STAGE_RULES.maximumExtraEnemies = 0;
    valid.BATTLE_RULES.enemyFirstShotDelayMs = 0;
    valid.AUDIO_SETTINGS.previewDelayMs = 0;
    expect(() => validateGameConfig(valid)).not.toThrow();
  });

  test.each([
    ['ENEMY_DISCS[1].level', (config: any) => { config.ENEMY_DISCS.splice(1, 1); }],
    ['DISCS[0].levels[1].level', (config: any) => { config.DISCS[0].levels.splice(1, 1); }],
    [
      'COOKIE_UPGRADES[0].levels[1].level',
      (config: any) => { config.COOKIE_UPGRADES[0].levels.splice(1, 1); },
    ],
  ])('%s처럼 명시 레벨이 건너뛰면 거부한다', (path, removeLevel) => {
    const invalid = cloneConfig();
    removeLevel(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test.each([
    ['BOSS_ANIMATION.walkFrameSequence[0]', (config: any) => {
      config.BOSS_ANIMATION.walkFrameSequence[0] = 3;
    }],
    ['BOSS_ANIMATION.sets[0].walkImageKeys', (config: any) => {
      config.BOSS_ANIMATION.sets[0].walkImageKeys[1] =
        config.BOSS_ANIMATION.sets[0].walkImageKeys[0];
    }],
    ['BOT_ANIMATION.runFrameSequence[0]', (config: any) => {
      config.BOT_ANIMATION.runFrameSequence[0] = 3;
    }],
    ['BOSS_ANIMATION.impactEffectDurationMs', (config: any) => {
      config.BOSS_ANIMATION.impactEffectDurationMs = 0;
    }],
  ])('%s의 애니메이션 설정이 잘못되면 거부한다', (path, breakAnimation) => {
    const invalid = cloneConfig();
    breakAnimation(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test.each([
    ['BOSS_ANIMATION.impactHoldMs', (config: any) => {
      config.BOSS_ANIMATION.impactHoldMs =
        config.BATTLE_RULES.maxDeltaMs
        * (Math.max(...config.BATTLE_RULES.battleSpeedMultipliers) - 1)
        - 1;
    }],
    ['BOT_ANIMATION.throwReleaseHoldMs', (config: any) => {
      config.BOT_ANIMATION.throwReleaseHoldMs =
        config.BATTLE_RULES.maxDeltaMs
        * (Math.max(...config.BATTLE_RULES.battleSpeedMultipliers) - 1)
        - 1;
    }],
  ])('%s가 X3 서브스텝보다 짧으면 거부한다', (path, makeTooShort) => {
    const invalid = cloneConfig();
    makeTooShort(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });

  test.each([
    ['BATTLE_RULES.enemyStopY', (config: any) => {
      config.BATTLE_RULES.enemyStopY = config.BATTLE_RULES.enemyStartY;
    }],
    ['BATTLE_UI.enemyBaseRenderSize', (config: any) => {
      config.BATTLE_UI.enemyBaseRenderSize = config.BATTLE_UI.enemyMinimumRenderSize - 1;
    }],
    ['BOSS_SPECIAL_ATTACK.impactInnerRadiusX', (config: any) => {
      config.BOSS_SPECIAL_ATTACK.impactInnerRadiusX =
        config.BOSS_SPECIAL_ATTACK.impactOuterRadiusX + 1;
    }],
    ['BOSS_BEHAVIOR.enrageHealthRatio', (config: any) => {
      config.BOSS_BEHAVIOR.enrageHealthRatio = 1.1;
    }],
    ['BATTLE_FEEDBACK.impactBursts[0].delayMs', (config: any) => {
      config.BATTLE_FEEDBACK.impactBursts[0].delayMs = -1;
    }],
    ['BATTLE_FEEDBACK.impactBursts[0].scale', (config: any) => {
      config.BATTLE_FEEDBACK.impactBursts[0].scale = 0;
    }],
    ['BATTLE_UI.bossHealthWidthRatio', (config: any) => {
      config.BATTLE_UI.bossHealthWidthRatio = 1.1;
    }],
    ['BATTLE_UI.healthBarSaturationPercent', (config: any) => {
      config.BATTLE_UI.healthBarSaturationPercent = 101;
    }],
    ['GIANT_DISC.renderWidthRatio', (config: any) => {
      config.GIANT_DISC.renderWidthRatio = 1.1;
    }],
  ])('%s의 필수 의미 관계가 잘못되면 거부한다', (path, breakSemantics) => {
    const invalid = cloneConfig();
    breakSemantics(invalid);
    expect(() => validateGameConfig(invalid)).toThrow(path);
  });
});
