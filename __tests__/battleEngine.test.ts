import { DIFFICULTIES, DISC, PRIMARY_BOT, getEnemyDisc } from '../src/config';
import { BattleState, advanceBattle } from '../src/engine/useBattleEngine';

function activeBattle(): BattleState {
  return {
    status: 'active',
    now: 1000,
    enemies: [{
      id: 'enemy-1',
      name: '테스트 적',
      hp: 10,
      maxHp: 10,
      x: 0.5,
      y: 0.4,
      lastShotAt: 1000,
      lastMeleeAt: 1000,
    }],
    enemyProjectiles: [],
    playerProjectile: {
      id: 'disc-1',
      owner: 'player',
      x: 0.5,
      y: 0.405,
      targetId: 'enemy-1',
      level: 1,
      damage: 3,
      size: 44,
      speed: 280,
    },
    baseHealth: 100,
    baseMaxHealth: 100,
    killedEnemies: 0,
    lastPlayerThrowAt: 1000,
    lastBotAttackAt: 1000,
    notice: null,
    noticeUntil: 0,
    lastEvent: null,
  };
}

describe('전투 엔진', () => {
  test('easy 적은 원반을 피하지 못하고 피해를 받는다', () => {
    const difficulty = DIFFICULTIES[0];
    const next = advanceBattle(activeBattle(), {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISC.levels[0],
      botCount: 0,
      bot: PRIMARY_BOT,
      now: 1050,
      deltaMs: 0,
      random: () => 0,
    });
    expect(next.enemies[0].hp).toBe(7);
    expect(next.playerProjectile).toBeNull();
  });

  test('최고 난이도 적은 AI 확률에 따라 옆으로 회피한다', () => {
    const difficulty = DIFFICULTIES[DIFFICULTIES.length - 1];
    const before = activeBattle();
    const next = advanceBattle(before, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISC.levels[0],
      botCount: 0,
      bot: PRIMARY_BOT,
      now: 1050,
      deltaMs: 0,
      random: () => 0,
    });
    expect(next.enemies[0].hp).toBe(10);
    expect(next.enemies[0].x).not.toBe(before.enemies[0].x);
    expect(next.notice).toBe('회피!');
  });
});
