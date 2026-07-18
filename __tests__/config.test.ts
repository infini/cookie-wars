import {
  AUDIO_SETTINGS,
  BATTLE_STAGE_RULES,
  BOTS,
  COOKIE_UPGRADE_RULES,
  COOKIES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  ENEMY_DISCS,
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

  test('난이도가 오르면 적 수와 원반 레벨이 감소하지 않는다', () => {
    DIFFICULTIES.slice(1).forEach((difficulty, index) => {
      expect(difficulty.enemyCount).toBeGreaterThanOrEqual(DIFFICULTIES[index].enemyCount);
      expect(difficulty.enemyDiscLevel).toBeGreaterThan(DIFFICULTIES[index].enemyDiscLevel);
      expect(difficulty.moveSpeed).toBeGreaterThanOrEqual(DIFFICULTIES[index].moveSpeed);
      expect(difficulty.hpMultiplier).toBeGreaterThan(DIFFICULTIES[index].hpMultiplier);
      expect(difficulty.attackMultiplier).toBeGreaterThan(DIFFICULTIES[index].attackMultiplier);
    });
    expect(ENEMY_DISCS).toHaveLength(15);
  });

  test('모든 난이도는 실제 몬스터 테이블을 참조한다', () => {
    const monsterIds = new Set(MONSTERS.map((monster) => monster.id));
    DIFFICULTIES.forEach((difficulty) => {
      expect(monsterIds.has(difficulty.monsterId)).toBe(true);
    });
  });

  test('진행·음량·상점 값은 데이터 테이블에서 제공한다', () => {
    expect(PROGRESSION.winsToUnlockNextDifficulty).toBe(20);
    expect(AUDIO_SETTINGS.levels.map((item) => item.level)).toEqual([1, 2, 3, 4, 5]);
    expect(DISCS).toHaveLength(10);
    expect(BOTS).toHaveLength(10);
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

  test('같은 난이도도 승리할 때마다 다음 전투가 강해진다', () => {
    const first = getBattleDifficulty(DIFFICULTIES[0], 0);
    const second = getBattleDifficulty(DIFFICULTIES[0], 1);
    const final = getBattleDifficulty(DIFFICULTIES[0], PROGRESSION.winsToUnlockNextDifficulty - 1);
    expect(BATTLE_STAGE_RULES.hpMultiplierPerWin).toBeGreaterThan(0);
    expect(second.hpMultiplier).toBeGreaterThan(first.hpMultiplier);
    expect(second.attackMultiplier).toBeGreaterThan(first.attackMultiplier);
    expect(second.moveSpeed).toBeGreaterThan(first.moveSpeed);
    expect(final.enemyCount).toBeGreaterThan(first.enemyCount);
    expect(final.enemyDiscLevel).toBeGreaterThan(first.enemyDiscLevel);
  });
});
