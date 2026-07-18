import {
  AUDIO_SETTINGS,
  BATTLE_STAGE_RULES,
  BATTLE_RULES,
  BOTS,
  COOKIE_UPGRADE_RULES,
  COOKIES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  ENEMY_DISCS,
  ENEMY_WAVES,
  MONSTERS,
  PROGRESSION,
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

  test('난이도가 오르면 적 수는 소폭만 늘고 원반 레벨은 감소하지 않는다', () => {
    DIFFICULTIES.slice(1).forEach((difficulty, index) => {
      expect(difficulty.enemyCount).toBeGreaterThanOrEqual(DIFFICULTIES[index].enemyCount);
      expect(difficulty.enemyDiscLevel).toBeGreaterThan(DIFFICULTIES[index].enemyDiscLevel);
      expect(difficulty.moveSpeed).toBeGreaterThanOrEqual(DIFFICULTIES[index].moveSpeed);
      expect(difficulty.hpMultiplier).toBeGreaterThan(DIFFICULTIES[index].hpMultiplier);
      expect(difficulty.attackMultiplier).toBeGreaterThan(DIFFICULTIES[index].attackMultiplier);
    });
    expect(DIFFICULTIES[DIFFICULTIES.length - 1].enemyCount - DIFFICULTIES[0].enemyCount)
      .toBeLessThanOrEqual(6);
    expect(ENEMY_DISCS).toHaveLength(15);
  });

  test('난이도는 단순 물량 대신 느리고 강한 적의 편성 비율로 상승한다', () => {
    const slowStrongIds = new Set(MONSTERS
      .filter((monster) => monster.moveSpeedMultiplier <= 0.62)
      .map((monster) => monster.id));
    const compositionScores = DIFFICULTIES.map((difficulty) => {
      const wave = ENEMY_WAVES.find((item) => item.id === difficulty.enemyWaveId)!;
      const strongPatternCount = wave.monsterPatternIds.filter(
        (monsterId) => slowStrongIds.has(monsterId),
      ).length;
      return strongPatternCount / wave.monsterPatternIds.length
        + 1 / wave.bossEveryEnemies;
    });

    compositionScores.slice(1).forEach((score, index) => {
      expect(score).toBeGreaterThan(compositionScores[index]);
    });
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
    expect(MONSTERS.map((monster) => monster.rank)).toEqual(['졸개', '정예', '중장갑', '원거리', '보스']);
  });

  test('진행·음량·상점 값은 데이터 테이블에서 제공한다', () => {
    expect(PROGRESSION.winsToUnlockNextDifficulty).toBe(20);
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
      'cookieHealth',
    ]);
    expect(COOKIES).toHaveLength(10);
    COOKIES.slice(1).forEach((cookie, index) => {
      expect(cookie.requiredTotalUpgradeLevels).toBeGreaterThan(
        COOKIES[index].requiredTotalUpgradeLevels,
      );
      expect(cookie.clickMultiplier).toBeGreaterThan(COOKIES[index].clickMultiplier);
    });
  });

  test('전투 경로와 공격 반경은 데이터 테이블에서 제공한다', () => {
    expect(BATTLE_RULES.enemyPaths.length).toBeGreaterThanOrEqual(3);
    BATTLE_RULES.enemyPaths.forEach((path) => {
      expect(path.waypoints.length).toBeGreaterThanOrEqual(2);
      const destination = path.waypoints[path.waypoints.length - 1];
      expect(Math.abs(destination.x - BATTLE_RULES.playerStartX)).toBeLessThanOrEqual(0.1);
      expect(destination.y).toBe(BATTLE_RULES.enemyStopY);
    });
    expect(BATTLE_RULES.enemyPathPattern.every(
      (pathIndex) => pathIndex >= 0 && pathIndex < BATTLE_RULES.enemyPaths.length,
    )).toBe(true);
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
    expect(BATTLE_STAGE_RULES.hpMultiplierPerWin).toBeCloseTo(0.05);
    expect(BATTLE_STAGE_RULES.attackMultiplierPerWin).toBeCloseTo(0.03);
    expect(BATTLE_STAGE_RULES.moveSpeedMultiplierPerWin).toBeCloseTo(0.015);
    expect(BATTLE_STAGE_RULES.extraEnemiesPerStep).toBe(1);
    expect(second.hpMultiplier).toBeGreaterThan(first.hpMultiplier);
    expect(second.attackMultiplier).toBeGreaterThan(first.attackMultiplier);
    expect(second.moveSpeed).toBeGreaterThan(first.moveSpeed);
    expect(final.enemyCount).toBeGreaterThan(first.enemyCount);
    expect(final.enemyDiscLevel).toBeGreaterThan(first.enemyDiscLevel);
  });
});
