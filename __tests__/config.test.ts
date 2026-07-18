import { DIFFICULTIES, ENEMY_DISCS } from '../src/config';

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
      expect(difficulty.dodgeChance).toBeGreaterThanOrEqual(DIFFICULTIES[index].dodgeChance);
    });
    expect(ENEMY_DISCS).toHaveLength(15);
  });
});
