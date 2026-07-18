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
import { MAX_GAME_INTEGER } from '../src/domain/safeNumbers';
import {
  BattleEventJournal,
  BattleState,
  MAX_RETAINED_BATTLE_EVENTS,
  acknowledgeBattleEvents,
  advanceBattle,
  appendBattleEvent,
  calculateBotDiscSize,
  calculateBotArmyDps,
  calculateBossHealth,
  calculateCastleDiscDamage,
  calculateGiantDiscDamage,
  canThrowCastleDisc,
  clampBattleDeltaMs,
  commitAuthorizedBattleState,
  createManualProjectileId,
  createBattleEnemies,
  createBattleSessionState,
  deliverPendingBattleEvents,
  getLatestBattleEvent,
  getLatestBattlePresentationEvent,
  getUndeliveredBattleEvents,
  resolveBattleOutcome,
  tryThrowCastleDisc,
  tryThrowGiantDisc,
} from '../src/engine/useBattleEngine';
import {
  consumeGiantDiscInventory,
  initialGameState,
} from '../src/state/gameReducer';

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
    eventSequence: 0,
    events: [],
    pendingEvents: [],
  };
}

function latestEvent(state: BattleState) {
  return getLatestBattleEvent(state.events);
}

function expectFiniteBoundedNumbers(value: unknown): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true);
    expect(Math.abs(value)).toBeLessThanOrEqual(MAX_GAME_INTEGER);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(expectFiniteBoundedNumbers);
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(expectFiniteBoundedNumbers);
  }
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

  test('모든 난이도는 고유한 보스 한 마리를 사용하며 전투 수치는 동일 공식으로 계산한다', () => {
    const bossIds = new Set<string>();
    DIFFICULTIES.forEach((difficulty) => {
      const enemies = createBattleEnemies(difficulty, 1000);
      const wave = getEnemyWave(difficulty.enemyWaveId);
      expect(enemies).toHaveLength(1);
      expect(enemies[0].monsterId).toBe(wave.bossMonsterId);
      expect(enemies[0].sizeMultiplier).toBeGreaterThan(1);
      bossIds.add(enemies[0].monsterId);
    });
    expect(bossIds.size).toBe(DIFFICULTIES.length);
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

  test('마지막 타격과 승리가 같은 틱에 나와도 두 이벤트를 순서대로 한 번씩 소비한다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.enemies[0] = { ...battle.enemies[0], hp: 3 };

    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });

    expect(next.status).toBe('victory');
    expect(next.events.map((event) => event.kind)).toEqual([
      'enemyDefeated',
      'victory',
    ]);
    expect(next.events.map((event) => event.id)).toEqual([1, 2]);
    expect(next.eventSequence).toBe(2);
    expect(getLatestBattlePresentationEvent(next.events)).toMatchObject({
      kind: 'enemyDefeated',
      amount: 3,
      x: battle.enemies[0].x,
      y: battle.enemies[0].y,
    });

    const deliveredKinds: string[] = [];
    let deliveredThroughId = 0;
    const deliverPendingEvents = () => {
      const pending = getUndeliveredBattleEvents(
        next.pendingEvents,
        deliveredThroughId,
      );
      pending.forEach((event) => deliveredKinds.push(event.kind));
      deliveredThroughId = pending[pending.length - 1]?.id ?? deliveredThroughId;
    };
    deliverPendingEvents();
    deliverPendingEvents();

    expect(deliveredKinds).toEqual(['enemyDefeated', 'victory']);
    expect(deliveredThroughId).toBe(2);
  });

  test('보스와 성이 같은 틱에 사망하면 마지막 아군 타격의 승리를 우선한다', () => {
    const difficulty = DIFFICULTIES[0];
    const battle = activeBattle();
    battle.enemies[0] = { ...battle.enemies[0], hp: 3 };
    battle.baseHealth = 1;
    battle.enemyProjectiles = [{
      id: 'simultaneous-castle-hit',
      owner: 'enemy',
      sourceEnemyId: battle.enemies[0].id,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.coreProjectileHitY,
      level: 1,
      damage: 100,
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

    expect(next.baseHealth).toBe(0);
    expect(next.status).toBe('victory');
    expect(resolveBattleOutcome(next.enemies, next.baseHealth)).toBe('victory');
    expect(next.events.map((event) => event.kind)).toEqual([
      'enemyDefeated',
      'castleHit',
      'victory',
    ]);
    expect(next.events.some((event) => event.kind === 'defeat')).toBe(false);
  });

  test('연출 저널은 최근 상한만 보존하고 pending은 ID를 역행·유실하지 않는다', () => {
    let journal: BattleEventJournal = {
      eventSequence: 0,
      events: [],
      pendingEvents: [],
    };
    const emittedCount = MAX_RETAINED_BATTLE_EVENTS + 3;
    for (let index = 0; index < emittedCount; index += 1) {
      journal = appendBattleEvent(journal, 'disc', 1000 + index);
    }

    expect(journal.events).toHaveLength(MAX_RETAINED_BATTLE_EVENTS);
    expect(journal.events[0].id).toBe(4);
    expect(journal.events[journal.events.length - 1].id).toBe(emittedCount);
    expect(journal.pendingEvents.map((event) => event.id)).toEqual(
      Array.from({ length: emittedCount }, (_, index) => index + 1),
    );
    expect(journal.eventSequence).toBe(emittedCount);
  });

  test('단일 advance에서 표시 상한을 넘은 이벤트도 콜백으로 순서대로 정확히 한 번 전달한다', () => {
    const difficulty = DIFFICULTIES[0];
    const emittedCount = MAX_RETAINED_BATTLE_EVENTS + 3;
    const battle = activeBattle();
    battle.enemies[0] = {
      ...battle.enemies[0],
      hp: emittedCount * 10,
      maxHp: emittedCount * 10,
    };
    battle.playerProjectiles = Array.from({ length: emittedCount }, (_, index) => ({
      ...battle.playerProjectiles[0],
      id: `burst-disc-${index}`,
      damage: 1,
    }));

    const next = advanceBattle(battle, {
      difficulty,
      enemyDisc: getEnemyDisc(difficulty.enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });
    const allIds = Array.from({ length: emittedCount }, (_, index) => index + 1);

    expect(next.status).toBe('active');
    expect(next.events).toHaveLength(MAX_RETAINED_BATTLE_EVENTS);
    expect(next.events.map((event) => event.id)).toEqual(allIds.slice(3));
    expect(next.pendingEvents.map((event) => event.id)).toEqual(allIds);

    const firstCallback = jest.fn<void, [BattleEventJournal['events'][number]]>();
    const changedCallback = jest.fn<void, [BattleEventJournal['events'][number]]>();
    let deliveredThroughId = deliverPendingBattleEvents(
      next.pendingEvents,
      0,
      firstCallback,
    );
    deliveredThroughId = deliverPendingBattleEvents(
      next.pendingEvents,
      deliveredThroughId,
      changedCallback,
    );
    const acknowledged = acknowledgeBattleEvents(next, deliveredThroughId);

    expect(firstCallback.mock.calls.map(([event]) => event.id)).toEqual(allIds);
    expect(changedCallback).not.toHaveBeenCalled();
    expect(deliveredThroughId).toBe(emittedCount);
    expect(acknowledged.pendingEvents).toEqual([]);
    expect(acknowledged.events).toEqual(next.events);
  });

  test('전투 reset·start 경계도 미전달 이벤트와 단조 ID를 승계한다', () => {
    const first = appendBattleEvent(activeBattle(), 'disc', 1100);
    const beforeReset = { ...activeBattle(), ...first };
    const resetState = createBattleSessionState(beforeReset, 2000);
    const second = appendBattleEvent(resetState, 'enemyHit', 2100);
    const beforeStart = { ...resetState, ...second };
    const startedState = createBattleSessionState(beforeStart, 3000);
    const third = appendBattleEvent(startedState, 'disc', 3100);

    expect(resetState.eventSequence).toBe(1);
    expect(resetState.events).toEqual([]);
    expect(resetState.pendingEvents.map((event) => event.id)).toEqual([1]);
    expect(startedState.eventSequence).toBe(2);
    expect(startedState.events).toEqual([]);
    expect(startedState.pendingEvents.map((event) => event.id)).toEqual([1, 2]);
    expect(third.eventSequence).toBe(3);
    expect(third.pendingEvents.map((event) => event.id)).toEqual([1, 2, 3]);
  });

  test('런타임에서 콜백이 없던 기간의 이벤트는 명시적으로 버리고 새 이벤트만 전달한다', () => {
    const withoutCallback = appendBattleEvent(activeBattle(), 'disc', 1100);
    const dropped = acknowledgeBattleEvents(
      { ...activeBattle(), ...withoutCallback },
      withoutCallback.eventSequence,
    );
    const afterCallbackAppears = appendBattleEvent(dropped, 'enemyHit', 1200);
    const callback = jest.fn<void, [BattleEventJournal['events'][number]]>();

    const deliveredThroughId = deliverPendingBattleEvents(
      afterCallbackAppears.pendingEvents,
      0,
      callback,
    );

    expect(dropped.pendingEvents).toEqual([]);
    expect(callback.mock.calls.map(([event]) => event.id)).toEqual([2]);
    expect(deliveredThroughId).toBe(2);
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

  test('최대 원반·쿠키봇 수치의 전투 계산은 안전 정수 상한에서 포화된다', () => {
    const extremeDisc = {
      ...DISCS[0].levels[0],
      level: MAX_GAME_INTEGER,
      damage: MAX_GAME_INTEGER,
      size: MAX_GAME_INTEGER,
      speed: MAX_GAME_INTEGER,
      cooldownMs: 1,
      cost: MAX_GAME_INTEGER,
    };
    const extremeBot = {
      config: {
        ...BOTS[0],
        discDamageMultiplier: MAX_GAME_INTEGER,
        attackIntervalMs: 1,
      },
      count: MAX_GAME_INTEGER,
    };
    const extremeDifficulty = {
      ...DIFFICULTIES[0],
      hpMultiplier: MAX_GAME_INTEGER,
      attackMultiplier: MAX_GAME_INTEGER,
      moveSpeed: MAX_GAME_INTEGER,
    };

    expect(calculateCastleDiscDamage(extremeDisc)).toBe(MAX_GAME_INTEGER);
    expect(calculateGiantDiscDamage(extremeDisc, [extremeBot]))
      .toBe(MAX_GAME_INTEGER);
    expect(calculateBotArmyDps(extremeDisc, [extremeBot]))
      .toBe(MAX_GAME_INTEGER);
    expect(calculateBossHealth(
      MAX_GAME_INTEGER,
      extremeDifficulty,
      extremeDisc,
      [extremeBot],
    )).toBe(MAX_GAME_INTEGER);
    expect(Number.isSafeInteger(calculateBotDiscSize(extremeDisc))).toBe(true);
    const generatedEnemy = createBattleEnemies(
      extremeDifficulty,
      1000,
      extremeDisc,
      [extremeBot],
    )[0];
    expect(generatedEnemy.hp).toBe(MAX_GAME_INTEGER);
    expect(generatedEnemy.maxHp).toBe(MAX_GAME_INTEGER);
    expectFiniteBoundedNumbers(generatedEnemy);
  });

  test('최대 전투 수치로 생성·공격해도 투사체와 상태에 Infinity가 남지 않는다', () => {
    const extremeDisc = {
      ...DISCS[0].levels[0],
      level: MAX_GAME_INTEGER,
      damage: MAX_GAME_INTEGER,
      size: MAX_GAME_INTEGER,
      speed: MAX_GAME_INTEGER,
      cooldownMs: 1,
      cost: MAX_GAME_INTEGER,
    };
    const extremeBot = {
      config: {
        ...BOTS[0],
        discDamageMultiplier: MAX_GAME_INTEGER,
        attackIntervalMs: 1,
      },
      count: MAX_GAME_INTEGER,
    };
    const extremeDifficulty = {
      ...DIFFICULTIES[0],
      hpMultiplier: MAX_GAME_INTEGER,
      attackMultiplier: MAX_GAME_INTEGER,
      moveSpeed: MAX_GAME_INTEGER,
    };
    const extremeEnemyDisc = {
      ...getEnemyDisc(DIFFICULTIES[0].enemyDiscLevel),
      level: MAX_GAME_INTEGER,
      damage: MAX_GAME_INTEGER,
      size: MAX_GAME_INTEGER,
      speed: MAX_GAME_INTEGER,
      cooldownMs: 1,
    };
    const battle = activeBattle();
    battle.now = 1000;
    battle.baseHealth = MAX_GAME_INTEGER;
    battle.baseMaxHealth = MAX_GAME_INTEGER;
    battle.playerProjectiles = [];
    battle.enemyProjectiles = [];
    battle.lastBotAttackAt = { [extremeBot.config.id]: 0 };
    battle.enemies[0] = {
      ...battle.enemies[0],
      hp: MAX_GAME_INTEGER,
      maxHp: MAX_GAME_INTEGER,
      attack: MAX_GAME_INTEGER,
      discDamageMultiplier: MAX_GAME_INTEGER,
      y: 0.6,
      lastShotAt: 0,
      lastSpecialAttackAt: 0,
      enraged: true,
    };

    const castleLaunch = tryThrowCastleDisc(
      battle,
      true,
      extremeDisc,
      10_000,
      'extreme-castle-disc',
    );
    const giantLaunch = tryThrowGiantDisc(
      castleLaunch,
      true,
      extremeDisc,
      [extremeBot],
      10_000,
      'extreme-giant-disc',
    );
    expect(giantLaunch.playerProjectiles).toHaveLength(2);
    expectFiniteBoundedNumbers(giantLaunch);

    const next = advanceBattle(battle, {
      difficulty: extremeDifficulty,
      enemyDisc: extremeEnemyDisc,
      playerDisc: extremeDisc,
      bots: [extremeBot],
      now: 10_000,
      deltaMs: Number.MAX_SAFE_INTEGER,
    });

    expect(next.status).toBe('active');
    expect(next.playerProjectiles).toHaveLength(1);
    expect(next.enemyProjectiles).toHaveLength(1);
    for (const projectile of [
      ...next.playerProjectiles,
      ...next.enemyProjectiles,
    ]) {
      expect(Number.isSafeInteger(projectile.damage)).toBe(true);
      expect(Number.isSafeInteger(projectile.size)).toBe(true);
      expect(Number.isSafeInteger(projectile.speed)).toBe(true);
    }
    expectFiniteBoundedNumbers(next);
  });

  test('최대 피해의 합산·체력 차감도 포화되어 성과 보스 체력이 안전하게 0이 된다', () => {
    const extremeDifficulty = {
      ...DIFFICULTIES[0],
      hpMultiplier: MAX_GAME_INTEGER,
      attackMultiplier: MAX_GAME_INTEGER,
      moveSpeed: MAX_GAME_INTEGER,
    };
    const castleBattle = activeBattle();
    castleBattle.baseHealth = MAX_GAME_INTEGER;
    castleBattle.baseMaxHealth = MAX_GAME_INTEGER;
    castleBattle.playerProjectiles = [];
    castleBattle.enemies[0] = { ...castleBattle.enemies[0], y: 0.2 };
    castleBattle.enemyProjectiles = [1, 2].map((index) => ({
      id: `extreme-enemy-disc-${index}`,
      owner: 'enemy' as const,
      sourceEnemyId: castleBattle.enemies[0].id,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.coreProjectileHitY,
      level: MAX_GAME_INTEGER,
      damage: MAX_GAME_INTEGER,
      size: MAX_GAME_INTEGER,
      speed: MAX_GAME_INTEGER,
      createdAt: 0,
    }));
    const defeated = advanceBattle(castleBattle, {
      difficulty: extremeDifficulty,
      enemyDisc: getEnemyDisc(DIFFICULTIES[0].enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });

    const bossBattle = activeBattle();
    bossBattle.baseHealth = MAX_GAME_INTEGER;
    bossBattle.baseMaxHealth = MAX_GAME_INTEGER;
    bossBattle.enemies[0] = {
      ...bossBattle.enemies[0],
      hp: MAX_GAME_INTEGER,
      maxHp: MAX_GAME_INTEGER,
    };
    bossBattle.playerProjectiles[0] = {
      ...bossBattle.playerProjectiles[0],
      damage: MAX_GAME_INTEGER,
    };
    const victorious = advanceBattle(bossBattle, {
      difficulty: DIFFICULTIES[0],
      enemyDisc: getEnemyDisc(DIFFICULTIES[0].enemyDiscLevel),
      playerDisc: DISCS[0].levels[0],
      bots: [],
      now: 1050,
      deltaMs: 0,
    });

    expect(defeated.status).toBe('defeat');
    expect(defeated.baseHealth).toBe(0);
    expect(defeated.events.find((event) => event.kind === 'castleHit')?.amount)
      .toBe(MAX_GAME_INTEGER);
    expect(victorious.status).toBe('victory');
    expect(victorious.enemies[0].hp).toBe(0);
    expect(victorious.events.find((event) => event.kind === 'enemyDefeated')?.amount)
      .toBe(MAX_GAME_INTEGER);
    expectFiniteBoundedNumbers(defeated);
    expectFiniteBoundedNumbers(victorious);
  });

  test('성장한 쿠키봇 군단도 단일 보스를 한 발에 처치하지 못한다', () => {
    const playerDisc = DISCS[0].levels[0];
    const bots = BOTS.map((config, index) => ({
      config,
      count: [65, 49, 44, 60, 65][index],
    }));
    const difficulty = getBattleDifficulty(DIFFICULTIES[4], 17);
    const bossId = getEnemyWave(difficulty.enemyWaveId).bossMonsterId;
    const boss = MONSTERS.find((monster) => monster.id === bossId)!;
    const health = calculateBossHealth(boss.baseHp, difficulty, playerDisc, bots);
    const strongestHit = Math.max(...bots.map((activeBot) => (
      playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count
    )));

    const expectedArmyDps = bots.reduce((total, activeBot) => (
      total + playerDisc.damage
        * activeBot.config.discDamageMultiplier
        * activeBot.count
        / (activeBot.config.attackIntervalMs / 1000)
    ), 0);
    expect(calculateBotArmyDps(playerDisc, bots)).toBe(expectedArmyDps);
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
    expect(latestEvent(fired)?.kind).toBe('enemyDisc');
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
    expect(latestEvent(fired)?.kind).toBe('bossSpecialAttack');
    expect(latestEvent(fired)?.sourceEnemyId).toBe(battle.enemies[0].id);
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
    expect(latestEvent(fired)?.kind).toBe('enemyDisc');
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
    expect(latestEvent(next)?.kind).toBe('castleHit');
    expect(latestEvent(next)?.attackKind).toBe('melee');
    expect(latestEvent(next)?.sourceEnemyId).toBe(battle.enemies[0].id);
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
    expect(latestEvent(next)?.kind).toBe('castleHit');
    expect(latestEvent(next)?.amount).toBe(expectedDamage);
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
    expect(latestEvent(next)?.kind).toBe('castleHit');
    expect(latestEvent(next)?.attackKind).toBe('special');
    expect(latestEvent(next)?.amount).toBe(expectedDamage);
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

  test('화면 탭 성 공격도 진행 중·쿨타임 종료·사거리 조건을 모두 지켜야 한다', () => {
    const battle = activeBattle();
    const disc = DISCS[0].levels[0];
    const beforeCooldown = battle.lastCastleThrowAt + disc.cooldownMs - 1;
    const afterCooldown = battle.lastCastleThrowAt + disc.cooldownMs;

    expect(canThrowCastleDisc(battle, true, disc, beforeCooldown)).toBe(false);
    expect(canThrowCastleDisc(battle, true, disc, afterCooldown)).toBe(true);
    expect(canThrowCastleDisc({ ...battle, status: 'idle' }, true, disc, afterCooldown))
      .toBe(false);
    expect(canThrowCastleDisc({ ...battle, status: 'victory' }, true, disc, afterCooldown))
      .toBe(false);
    expect(canThrowCastleDisc(battle, false, disc, afterCooldown)).toBe(false);
  });

  test('빠른 연속 탭은 함수형 상태의 최신 쿨타임을 재검증해 성 원반을 중복 추가하지 않는다', () => {
    const battle = activeBattle();
    const disc = DISCS[0].levels[0];
    const now = battle.lastCastleThrowAt + disc.cooldownMs;
    const first = tryThrowCastleDisc(
      battle,
      true,
      disc,
      now,
      `castle-disc-${now}-1`,
    );
    const second = tryThrowCastleDisc(
      first,
      true,
      disc,
      now,
      `castle-disc-${now}-2`,
    );

    expect(first.playerProjectiles).toHaveLength(battle.playerProjectiles.length + 1);
    expect(second).toBe(first);
    expect(second.playerProjectiles.filter((projectile) => (
      projectile.id.startsWith(`castle-disc-${now}`)
    ))).toHaveLength(1);
  });

  test('같은 밀리초에 연속 발사된 거대 원반도 증가 순번이 다르면 ID가 충돌하지 않는다', () => {
    const battle = activeBattle();
    battle.playerProjectiles = [];
    const disc = DISCS[0].levels[0];
    const now = battle.now;
    const firstId = createManualProjectileId('giant', now, 1);
    const secondId = createManualProjectileId('giant', now, 2);
    const first = tryThrowGiantDisc(
      battle,
      true,
      disc,
      [],
      now,
      firstId,
    );
    const second = tryThrowGiantDisc(
      first,
      true,
      disc,
      [],
      now,
      secondId,
    );

    expect(firstId).not.toBe(secondId);
    expect(second.playerProjectiles).toHaveLength(2);
    expect(new Set(second.playerProjectiles.map((projectile) => projectile.id)).size).toBe(2);
  });

  test('재고 한 개로 빠르게 두 번 요청해도 거대 원반은 정확히 한 발만 커밋한다', () => {
    let inventory = { ...initialGameState, giantDiscCount: 1 };
    let battle: BattleState = { ...activeBattle(), playerProjectiles: [] };
    const disc = DISCS[0].levels[0];
    const consume = () => {
      const next = consumeGiantDiscInventory(inventory);
      if (!next) return false;
      inventory = next;
      return true;
    };
    const launch = (sequence: number) => {
      const current = battle;
      const candidate = tryThrowGiantDisc(
        current,
        true,
        disc,
        [],
        current.now,
        createManualProjectileId('giant', current.now, sequence),
      );
      battle = commitAuthorizedBattleState(current, candidate, consume);
      return battle !== current;
    };

    expect(launch(1)).toBe(true);
    expect(launch(2)).toBe(false);
    expect(inventory.giantDiscCount).toBe(0);
    expect(battle.playerProjectiles).toHaveLength(1);
  });

  test('발사 불가 상태에서는 재고 승인을 호출하지 않고, 재고가 없으면 무료 발사하지 않는다', () => {
    const disc = DISCS[0].levels[0];
    const victory = { ...activeBattle(), status: 'victory' as const, playerProjectiles: [] };
    const authorizeVictory = jest.fn(() => true);
    const invalidCandidate = tryThrowGiantDisc(
      victory,
      true,
      disc,
      [],
      victory.now,
      'giant-victory',
    );
    const rejectedVictory = commitAuthorizedBattleState(
      victory,
      invalidCandidate,
      authorizeVictory,
    );

    expect(rejectedVictory).toBe(victory);
    expect(authorizeVictory).not.toHaveBeenCalled();

    const active = { ...activeBattle(), playerProjectiles: [] };
    const validCandidate = tryThrowGiantDisc(
      active,
      true,
      disc,
      [],
      active.now,
      'giant-no-inventory',
    );
    const rejectedInventory = commitAuthorizedBattleState(active, validCandidate, () => false);

    expect(rejectedInventory).toBe(active);
    expect(rejectedInventory.playerProjectiles).toHaveLength(0);
  });

  test('시스템 시계가 뒤로 가도 프레임 경과 시간은 음수가 되지 않는다', () => {
    expect(clampBattleDeltaMs(-1)).toBe(0);
    expect(clampBattleDeltaMs(BATTLE_RULES.tickMs)).toBe(BATTLE_RULES.tickMs);
    expect(clampBattleDeltaMs(BATTLE_RULES.maxDeltaMs + 1))
      .toBe(BATTLE_RULES.maxDeltaMs);
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
