import { BATTLE_RULES, BOTS, DIFFICULTIES, DISCS, getEnemyDisc, getMonster } from '../src/config';
import {
  BattleState,
  advanceBattle,
  calculateCastleDiscDamage,
  canThrowCastleDisc,
  createBattleEnemies,
} from '../src/engine/useBattleEngine';

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
      spawnAt: 0,
      lastShotAt: 1000,
      lastMeleeAt: 1000,
    }],
    enemyProjectiles: [],
    playerProjectiles: [{
      id: 'disc-1',
      owner: 'player',
      x: 0.5,
      y: 0.405,
      targetId: 'enemy-1',
      level: 1,
      damage: 3,
      size: 44,
      speed: 280,
      source: 'castle',
    }],
    baseHealth: 100,
    baseMaxHealth: 100,
    killedEnemies: 0,
    lastCastleThrowAt: 1000,
    lastBotAttackAt: {},
    notice: null,
    noticeUntil: 0,
    lastEvent: null,
  };
}

describe('전투 엔진', () => {
  test('적은 균일한 가로 슬롯에서 한 마리씩 순차 등장한다', () => {
    const difficulty = { ...DIFFICULTIES[0], enemyCount: BATTLE_RULES.enemyColumns + 1 };
    const monster = getMonster(difficulty.monsterId);
    const startedAt = 1000;
    const enemies = createBattleEnemies(difficulty, monster, startedAt);
    const firstRow = enemies.slice(0, BATTLE_RULES.enemyColumns);
    const gaps = firstRow.slice(1).map((enemy, index) => enemy.x - firstRow[index].x);

    expect(enemies[0].spawnAt).toBe(startedAt);
    expect(enemies[1].spawnAt).toBe(startedAt + BATTLE_RULES.enemySpawnIntervalMs);
    expect(new Set(firstRow.map((enemy) => enemy.x)).size).toBe(BATTLE_RULES.enemyColumns);
    gaps.forEach((gap) => expect(gap).toBeCloseTo(BATTLE_RULES.enemyColumnGap));
    expect(enemies[BATTLE_RULES.enemyColumns].x).toBe(enemies[0].x);
  });

  test('easy 적은 원반을 피하지 못하고 피해를 받는다', () => {
    const difficulty = DIFFICULTIES[0];
    const monster = getMonster(difficulty.monsterId);
    const next = advanceBattle(activeBattle(), {
      difficulty,
      monster,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });
    expect(next.enemies[0].hp).toBe(7);
    expect(next.playerProjectiles).toHaveLength(0);
  });

  test('최고 난이도 적도 원반을 회피하지 않고 피해를 받는다', () => {
    const difficulty = DIFFICULTIES[DIFFICULTIES.length - 1];
    const monster = getMonster(difficulty.monsterId);
    const before = activeBattle();
    const next = advanceBattle(before, {
      difficulty,
      monster,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });
    expect(next.enemies[0].hp).toBe(7);
    expect(next.enemies[0].x).toBe(before.enemies[0].x);
    expect(next.notice).toBeNull();
  });

  test('쿠키 성 원반은 장착 원반의 정확히 2배 피해다', () => {
    const disc = DISCS[0].levels[0];
    expect(calculateCastleDiscDamage(disc)).toBe(disc.damage * 2);
  });

  test('쿠키봇은 공격 간격이 지나면 장착 원반을 자동 발사한다', () => {
    const difficulty = DIFFICULTIES[0];
    const monster = getMonster(difficulty.monsterId);
    const bot = BOTS[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    battle.lastBotAttackAt = { [bot.id]: 0 };
    const next = advanceBattle(battle, {
      difficulty,
      monster,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [{ config: bot, count: 1 }],
      now: bot.attackIntervalMs + 1,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(1);
    expect(next.playerProjectiles[0].source).toBe('bot');
    expect(next.playerProjectiles[0].damage).toBe(DISCS[0].levels[0].damage);
  });

  test('쿠키봇이 없으면 전투 시간이 지나도 쿠키 성은 자동 공격하지 않는다', () => {
    const difficulty = DIFFICULTIES[0];
    const monster = getMonster(difficulty.monsterId);
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const next = advanceBattle(battle, {
      difficulty,
      monster,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1000 + DISCS[0].levels[0].cooldownMs * 2,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(0);
  });

  test('기존 원반이 비행 중이어도 쿨타임이 끝나면 새 원반을 던질 수 있다', () => {
    const battle = activeBattle();
    const disc = DISCS[0].levels[0];
    expect(battle.playerProjectiles).toHaveLength(1);
    expect(canThrowCastleDisc(battle, true, disc, 1000 + disc.cooldownMs)).toBe(true);

    const difficulty = DIFFICULTIES[0];
    const monster = getMonster(difficulty.monsterId);
    const bot = BOTS[0];
    battle.playerProjectiles[0].source = 'bot';
    battle.playerProjectiles[0].sourceBotId = bot.id;
    battle.playerProjectiles[0].y = 0.7;
    battle.lastBotAttackAt = { [bot.id]: 0 };
    const next = advanceBattle(battle, {
      difficulty,
      monster,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: disc,
      bots: [{ config: bot, count: 1 }],
      now: bot.attackIntervalMs + 1,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(2);
  });
});
