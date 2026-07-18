import {
  BATTLE_RULES,
  BOSS_BALANCE,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
  BOTS,
  DIFFICULTIES,
  DISCS,
  MONSTERS,
  getEnemyDisc,
  getEnemyWave,
} from '../src/config';
import { getBattleDifficulty } from '../src/domain/gameSelectors';
import {
  BattleState,
  advanceBattle,
  calculateBotDiscSize,
  calculateBotArmyDps,
  calculateBossHealth,
  calculateCastleDiscDamage,
  calculateGiantDiscDamage,
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
      x: 0.5,
      y: 0.6,
      spawnAt: 0,
      lastShotAt: 1000,
      lastMeleeAt: 1000,
      lastSpecialAttackAt: 1000,
      enraged: false,
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
  test('모든 전투에는 중앙의 거대 보스 한 마리만 등장한다', () => {
    const difficulty = DIFFICULTIES[0];
    const startedAt = 1000;
    const enemies = createBattleEnemies(difficulty, startedAt);

    expect(enemies).toHaveLength(1);
    expect(enemies[0].spawnAt).toBe(startedAt);
    expect(enemies[0].rank).toBe('보스');
    expect(enemies[0].x).toBe(BATTLE_RULES.enemyX);
    expect(enemies[0].y).toBe(BATTLE_RULES.enemyStartY);
  });

  test('모든 난이도는 같은 보스 한 마리의 능력치만 강화한다', () => {
    DIFFICULTIES.forEach((difficulty) => {
      const enemies = createBattleEnemies(difficulty, 1000);
      const wave = getEnemyWave(difficulty.enemyWaveId);
      expect(enemies).toHaveLength(1);
      expect(enemies[0].monsterId).toBe(wave.bossMonsterId);
      expect(enemies[0].sizeMultiplier).toBeGreaterThan(1);
    });
  });

  test('성 앞에서 멈춘 적도 빠른 상위 원반에 정상적으로 피해를 받는다', () => {
    const difficulty = DIFFICULTIES[0];
    const disc = DISCS[DISCS.length - 1].levels[4];
    let battle = activeBattle();
    battle.now = 1000;
    battle.enemies[0] = {
      ...battle.enemies[0],
      hp: disc.damage * 2,
      maxHp: disc.damage * 2,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.enemyStopY,
    };
    battle.playerProjectiles[0] = {
      ...battle.playerProjectiles[0],
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.playerStartY,
      targetId: battle.enemies[0].id,
      damage: disc.damage,
      speed: disc.speed,
      createdAt: battle.now,
    };

    const frameCount = Math.ceil(
      BATTLE_RULES.playerProjectileMinimumFlightMs / BATTLE_RULES.tickMs,
    );
    for (let frame = 1; frame <= frameCount; frame += 1) {
      battle = advanceBattle(battle, {
        difficulty,
        enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
        playerDisc: disc,
        bots: [],
        now: 1000 + frame * BATTLE_RULES.tickMs,
        deltaMs: BATTLE_RULES.tickMs,
      });
    }

    expect(battle.enemies[0].hp).toBe(disc.damage);
    expect(battle.playerProjectiles).toHaveLength(0);
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

  test('거대 원반은 장착 원반의 정확히 30배 피해다', () => {
    const disc = DISCS[0].levels[0];
    expect(calculateGiantDiscDamage(disc)).toBe(disc.damage * 30);
  });

  test('거대 원반은 현재 최강 쿠키봇 일반 원반의 정확히 30배 피해다', () => {
    const disc = DISCS[0].levels[0];
    const strongestBot = BOTS[BOTS.length - 1];
    const bots = [{ config: strongestBot, count: 3 }];
    expect(calculateGiantDiscDamage(disc, bots)).toBe(
      disc.damage * strongestBot.discDamageMultiplier * 3 * 30,
    );
  });

  test('성장한 쿠키봇 군단도 단일 보스를 한 발에 처치하지 못한다', () => {
    const playerDisc = DISCS[0].levels[0];
    const bots = BOTS.map((config, index) => ({
      config,
      count: [65, 49, 44, 60, 65][index],
    }));
    const difficulty = getBattleDifficulty(DIFFICULTIES[4], 17);
    const boss = MONSTERS.find((monster) => monster.id === 'cookie-tyrant')!;
    const health = calculateBossHealth(boss.baseHp, difficulty, playerDisc, bots);
    const strongestHit = Math.max(...bots.map((activeBot) => (
      playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count
    )));

    expect(calculateBotArmyDps(playerDisc, bots)).toBeGreaterThan(0);
    expect(health).toBeGreaterThanOrEqual(
      strongestHit * BOSS_BALANCE.minimumAutomaticHitsToDefeat,
    );
    expect(health).toBeGreaterThan(Math.round(boss.baseHp * difficulty.hpMultiplier));
    expect(createBattleEnemies(difficulty, 1000, playerDisc, bots)[0].maxHp).toBe(health);
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

  test('보스는 근접 범위에 닿기 전에 원반 테이블 기준 2배 속도로 원거리 공격한다', () => {
    const difficulty = DIFFICULTIES[0];
    const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
    const attackIntervalMs = enemyDisc.cooldownMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier;
    const beforeCooldown = activeBattle();
    beforeCooldown.playerProjectiles = [];
    const before = advanceBattle(beforeCooldown, {
      difficulty,
      enemyDisc,
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: beforeCooldown.enemies[0].lastShotAt + attackIntervalMs - 1,
      deltaMs: 0,
    });
    expect(before.enemyProjectiles).toHaveLength(0);

    const atCooldown = activeBattle();
    atCooldown.playerProjectiles = [];
    atCooldown.enemies[0].y = BATTLE_RULES.enemyMeleeTriggerY - 0.1;
    expect(atCooldown.enemies[0].y).toBeLessThan(BATTLE_RULES.enemyMeleeTriggerY);
    expect(Math.hypot(
      atCooldown.enemies[0].x - BATTLE_RULES.playerStartX,
      atCooldown.enemies[0].y - BATTLE_RULES.playerStartY,
    )).toBeLessThanOrEqual(BATTLE_RULES.enemyAttackRadius);
    const fired = advanceBattle(atCooldown, {
      difficulty,
      enemyDisc,
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: atCooldown.enemies[0].lastShotAt + attackIntervalMs,
      deltaMs: 0,
    });
    expect(fired.enemyProjectiles).toHaveLength(1);
    expect(fired.lastEvent?.kind).toBe('enemyDisc');
  });

  test('보스는 설정 주기마다 기존 원거리 공격 한 발을 강공격으로 연출한다', () => {
    const difficulty = DIFFICULTIES[0];
    const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const fired = advanceBattle(battle, {
      difficulty,
      enemyDisc,
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: battle.enemies[0].lastSpecialAttackAt + BOSS_SPECIAL_ATTACK.intervalMs,
      deltaMs: 0,
    });

    expect(fired.enemyProjectiles).toHaveLength(1);
    expect(fired.enemyProjectiles[0].attackKind).toBe('special');
    expect(fired.enemyProjectiles[0].damage).toBe(
      enemyDisc.damage * battle.enemies[0].discDamageMultiplier,
    );
    expect(fired.lastEvent?.kind).toBe('bossSpecialAttack');
    expect(fired.lastEvent?.sourceEnemyId).toBe(battle.enemies[0].id);
    expect(fired.enemies[0].lastSpecialAttackAt).toBe(fired.now);
  });

  test('강공격 주기 전에는 같은 보스 원반이 일반 공격으로 유지된다', () => {
    const difficulty = DIFFICULTIES[0];
    const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const fired = advanceBattle(battle, {
      difficulty,
      enemyDisc,
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: battle.enemies[0].lastSpecialAttackAt + BOSS_SPECIAL_ATTACK.intervalMs - 1,
      deltaMs: 0,
    });

    expect(fired.enemyProjectiles).toHaveLength(1);
    expect(fired.enemyProjectiles[0].attackKind).toBe('projectile');
    expect(fired.lastEvent?.kind).toBe('enemyDisc');
    expect(fired.enemies[0].lastSpecialAttackAt).toBe(
      battle.enemies[0].lastSpecialAttackAt,
    );
  });

  test('보스는 성 앞에 도착하면 2배 속도로 근접 공격한다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    battle.enemies[0].y = BATTLE_RULES.enemyMeleeTriggerY;
    const meleeIntervalMs = BATTLE_RULES.enemyMeleeIntervalMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier;
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: battle.enemies[0].lastMeleeAt + meleeIntervalMs,
      deltaMs: 0,
    });
    expect(next.baseHealth).toBeLessThan(battle.baseHealth);
    expect(next.lastEvent?.kind).toBe('castleHit');
    expect(next.lastEvent?.attackKind).toBe('melee');
    expect(next.lastEvent?.sourceEnemyId).toBe(battle.enemies[0].id);
  });

  test('보스 이동 속도는 난이도 결과의 80%로 적용된다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const deltaMs = 100;
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: battle.now + deltaMs,
      deltaMs,
    });
    const expectedMovement = difficulty.moveSpeed
      * BOSS_BEHAVIOR.globalMoveSpeedMultiplier
      * battle.enemies[0].moveSpeedMultiplier
      * deltaMs
      / BATTLE_RULES.enemyMoveDivisor;
    expect(next.enemies[0].y).toBeCloseTo(battle.enemies[0].y + expectedMovement);
  });

  test('보스 원반은 기본 2배와 전체 난이도 1.2배 피해를 성에 입힌다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    battle.enemyProjectiles = [{
      id: 'enemy-disc-test',
      owner: 'enemy',
      sourceEnemyId: battle.enemies[0].id,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.coreProjectileHitY,
      level: 1,
      damage: 20,
      size: 20,
      speed: 90,
      createdAt: 0,
    }];
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });
    const expectedDamage = Math.round(
      20
        * difficulty.attackMultiplier
        * BOSS_BEHAVIOR.globalAttackDamageMultiplier
        * BOSS_BEHAVIOR.globalDifficultyMultiplier,
    );
    expect(next.baseHealth).toBe(battle.baseHealth - expectedDamage);
    expect(next.lastEvent?.kind).toBe('castleHit');
    expect(next.lastEvent?.amount).toBe(expectedDamage);
  });

  test('보스 강공격은 추가 피해 없이 기존 원반 피해 공식을 그대로 쓴다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.playerProjectiles = [];
    battle.enemyProjectiles = [{
      id: 'enemy-special-disc-test',
      owner: 'enemy',
      sourceEnemyId: battle.enemies[0].id,
      attackKind: 'special',
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.coreProjectileHitY,
      level: 1,
      damage: 20,
      size: 20,
      speed: 90,
      createdAt: 0,
    }];
    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });
    const expectedDamage = Math.round(
      20
        * difficulty.attackMultiplier
        * BOSS_BEHAVIOR.globalAttackDamageMultiplier
        * BOSS_BEHAVIOR.globalDifficultyMultiplier,
    );

    expect(next.baseHealth).toBe(battle.baseHealth - expectedDamage);
    expect(next.lastEvent?.kind).toBe('castleHit');
    expect(next.lastEvent?.attackKind).toBe('special');
    expect(next.lastEvent?.amount).toBe(expectedDamage);
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
