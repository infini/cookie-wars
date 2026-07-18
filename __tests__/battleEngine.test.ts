import { BATTLE_RULES, BOTS, DIFFICULTIES, DISCS, getEnemyDisc } from '../src/config';
import {
  BattleState,
  advanceBattle,
  calculateBotDiscSize,
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
      monsterId: 'crumb-minion',
      imageKey: 'crumb-minion',
      name: '테스트 적',
      rank: '졸개',
      hp: 10,
      maxHp: 10,
      attack: 3,
      moveSpeedMultiplier: 1,
      discDamageMultiplier: 1,
      sizeMultiplier: 1,
      pathIndex: 1,
      x: 0.5,
      y: 0.6,
      spawnAt: 0,
      lastShotAt: 1000,
      lastMeleeAt: 1000,
    }],
    enemyProjectiles: [],
    playerProjectiles: [{
      id: 'disc-1',
      owner: 'player',
      x: 0.5,
      y: 0.605,
      targetId: 'enemy-1',
      level: 1,
      damage: 3,
      size: 44,
      speed: 280,
      source: 'castle',
      createdAt: 0,
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
  test('적은 중앙 진입로의 행군 줄을 따라 촘촘한 무리로 등장한다', () => {
    const difficulty = { ...DIFFICULTIES[0], enemyCount: BATTLE_RULES.enemyPaths.length + 2 };
    const startedAt = 1000;
    const enemies = createBattleEnemies(difficulty, startedAt);

    expect(enemies[0].spawnAt).toBe(startedAt);
    expect(enemies[1].spawnAt).toBe(startedAt);
    expect(enemies[2].spawnAt).toBe(startedAt);
    expect(enemies[3].spawnAt).toBe(startedAt + BATTLE_RULES.enemySpawnIntervalMs);
    expect(new Set(enemies.map((enemy) => enemy.pathIndex)).size).toBe(BATTLE_RULES.enemyPaths.length);
    enemies.forEach((enemy) => {
      expect(enemy.x).toBe(BATTLE_RULES.enemyPaths[enemy.pathIndex].waypoints[0].x);
    });
  });

  test('같은 행군 줄의 적은 앞 적과 최소 간격을 유지한다', () => {
    const difficulty = { ...DIFFICULTIES[0], enemyCount: 12, moveSpeed: 30 };
    const startedAt = 1000;
    const enemies = createBattleEnemies(difficulty, startedAt).map((enemy) => ({
      ...enemy,
      spawnAt: startedAt,
    }));
    const battle = activeBattle();
    battle.enemies = enemies;
    battle.playerProjectiles = [];
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: startedAt + 500,
      deltaMs: 100,
    });
    BATTLE_RULES.enemyPaths.forEach((_, pathIndex) => {
      const lane = next.enemies
        .filter((enemy) => enemy.pathIndex === pathIndex)
        .sort((a, b) => b.y - a.y);
      lane.slice(1).forEach((enemy, index) => {
        expect(lane[index].y - enemy.y).toBeGreaterThanOrEqual(
          BATTLE_RULES.enemyMinimumLaneSpacingY - 0.000001,
        );
      });
    });
  });

  test('일반 적 사이에 서로 다른 등급과 보스가 테이블 순서대로 등장한다', () => {
    const enemies = createBattleEnemies(DIFFICULTIES[0], 1000);
    expect(new Set(enemies.map((enemy) => enemy.monsterId)).size).toBeGreaterThanOrEqual(4);
    expect(enemies[14].rank).toBe('보스');
    expect(enemies[14].sizeMultiplier).toBeGreaterThan(1);
  });

  test('easy 적은 원반을 피하지 못하고 피해를 받는다', () => {
    const difficulty = DIFFICULTIES[0];
    const next = advanceBattle(activeBattle(), {
      difficulty,
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
    const before = activeBattle();
    const next = advanceBattle(before, {
      difficulty,
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
    expect(disc.size).toBe(DISCS[0].levels[0].size);
  });

  test('쿠키봇은 공격 간격이 지나면 장착 원반을 자동 발사한다', () => {
    const difficulty = DIFFICULTIES[0];
    const bot = BOTS[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    battle.lastBotAttackAt = { [bot.id]: 0 };
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [{ config: bot, count: 1 }],
      now: bot.attackIntervalMs + 1,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(1);
    expect(next.playerProjectiles[0].source).toBe('bot');
    expect(next.playerProjectiles[0].damage).toBe(DISCS[0].levels[0].damage);
    expect(next.playerProjectiles[0].x).toBeCloseTo(BATTLE_RULES.botFormationSlots[0].x);
    expect(next.playerProjectiles[0].x).not.toBe(BATTLE_RULES.playerStartX);
    expect(next.playerProjectiles[0].y).toBe(BATTLE_RULES.botFormationSlots[0].y);
    expect(next.playerProjectiles[0].y).not.toBe(BATTLE_RULES.playerStartY);
    expect(next.playerProjectiles[0].size).toBe(calculateBotDiscSize(DISCS[0].levels[0]));
    expect(next.playerProjectiles[0].size).toBeLessThan(DISCS[0].levels[0].size);
  });

  test('공격 반경 밖의 먼 적에게는 성과 쿠키봇 모두 원반을 던지지 않는다', () => {
    const difficulty = DIFFICULTIES[0];
    const bot = BOTS[0];
    const battle = activeBattle();
    battle.enemies[0] = { ...battle.enemies[0], y: 0.2 };
    battle.playerProjectiles = [];
    battle.lastBotAttackAt = { [bot.id]: 0 };

    expect(canThrowCastleDisc(
      battle,
      true,
      DISCS[0].levels[0],
      1000 + DISCS[0].levels[0].cooldownMs,
    )).toBe(false);

    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [{ config: bot, count: 1 }],
      now: bot.attackIntervalMs + 1,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(0);
  });

  test('쿠키봇이 없으면 전투 시간이 지나도 쿠키 성은 자동 공격하지 않는다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const next = advanceBattle(battle, {
      difficulty,
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
    const bot = BOTS[0];
    battle.playerProjectiles[0].source = 'bot';
    battle.playerProjectiles[0].sourceBotId = bot.id;
    battle.playerProjectiles[0].y = 0.7;
    battle.lastBotAttackAt = { [bot.id]: 0 };
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: disc,
      bots: [{ config: bot, count: 1 }],
      now: bot.attackIntervalMs + 1,
      deltaMs: 0,
    });
    expect(next.playerProjectiles).toHaveLength(2);
  });
});
