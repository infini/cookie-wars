import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BATTLE_RULES,
  BOSS_BALANCE,
  BOSS_BEHAVIOR,
  GIANT_DISC,
  getEnemyDisc,
  getEnemyWave,
  getMonster,
} from '../config';
import { ActiveBot } from '../domain/gameSelectors';
import {
  DifficultyConfig,
  DiscLevelConfig,
  EnemyDiscConfig,
} from '../types/game';

export type BattleStatus = 'idle' | 'active' | 'victory' | 'defeat';
export type BattleEventKind =
  | 'enemyHit'
  | 'castleHit'
  | 'disc'
  | 'enemyDisc'
  | 'bossEnraged'
  | 'enemyDefeated'
  | 'victory'
  | 'defeat';

export interface BattleEnemy {
  id: string;
  monsterId: string;
  imageKey: string;
  name: string;
  rank: string;
  hp: number;
  maxHp: number;
  attack: number;
  moveSpeedMultiplier: number;
  discDamageMultiplier: number;
  sizeMultiplier: number;
  x: number;
  y: number;
  spawnAt: number;
  lastShotAt: number;
  lastMeleeAt: number;
  enraged: boolean;
}

export interface BattleProjectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  targetId?: string;
  sourceEnemyId?: string;
  sourceBotId?: string;
  source?: 'castle' | 'bot' | 'giant';
  level: number;
  damage: number;
  size: number;
  speed: number;
  createdAt: number;
}

export interface BattleEvent {
  id: number;
  kind: BattleEventKind;
  at: number;
  amount?: number;
  x?: number;
  y?: number;
  sourceEnemyId?: string;
  attackKind?: 'projectile' | 'melee';
  attackSource?: 'castle' | 'bot' | 'giant';
}

export interface BattleState {
  status: BattleStatus;
  now: number;
  enemies: BattleEnemy[];
  enemyProjectiles: BattleProjectile[];
  playerProjectiles: BattleProjectile[];
  baseHealth: number;
  baseMaxHealth: number;
  killedEnemies: number;
  lastCastleThrowAt: number;
  lastBotAttackAt: Record<string, number>;
  notice: string | null;
  noticeUntil: number;
  lastEvent: BattleEvent | null;
}

const initialState: BattleState = {
  status: 'idle',
  now: Date.now(),
  enemies: [],
  enemyProjectiles: [],
  playerProjectiles: [],
  baseHealth: 0,
  baseMaxHealth: 0,
  killedEnemies: 0,
  lastCastleThrowAt: 0,
  lastBotAttackAt: {},
  notice: null,
  noticeUntil: 0,
  lastEvent: null,
};

interface EngineOptions {
  difficulty: DifficultyConfig;
  playerDisc: DiscLevelConfig;
  discAvailable: boolean;
  bots: ActiveBot[];
  maxHealth: number;
  onEvent?: (event: BattleEvent) => void;
}

export interface AdvanceOptions {
  difficulty: DifficultyConfig;
  enemyDisc: EnemyDiscConfig;
  playerDisc: DiscLevelConfig;
  bots: ActiveBot[];
  now: number;
  deltaMs: number;
}

function aliveEnemies(enemies: BattleEnemy[], now: number): BattleEnemy[] {
  return enemies.filter((enemy) => enemy.hp > 0 && enemy.spawnAt <= now);
}

function closestEnemy(enemies: BattleEnemy[], now: number): BattleEnemy | undefined {
  return [...aliveEnemies(enemies, now)].sort((a, b) => b.y - a.y)[0];
}

export function closestEnemyWithinRadius(
  enemies: BattleEnemy[],
  now: number,
  originX: number,
  originY: number,
  radius: number,
): BattleEnemy | undefined {
  return aliveEnemies(enemies, now)
    .filter((enemy) => Math.hypot(enemy.x - originX, enemy.y - originY) <= radius)
    .sort((a, b) => b.y - a.y)[0];
}

export function calculateCastleDiscDamage(playerDisc: DiscLevelConfig): number {
  return Math.round(playerDisc.damage * BATTLE_RULES.castleDiscDamageMultiplier);
}

export function calculateBotDiscSize(playerDisc: DiscLevelConfig): number {
  return Math.round(playerDisc.size * BATTLE_RULES.botDiscSizeMultiplier);
}

export function calculateGiantDiscDamage(
  playerDisc: DiscLevelConfig,
  bots: ActiveBot[] = [],
): number {
  const strongestNormalDiscDamage = bots.reduce((strongest, activeBot) => Math.max(
    strongest,
    playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count,
  ), playerDisc.damage);
  return Math.round(strongestNormalDiscDamage * GIANT_DISC.damageMultiplier);
}

export function calculateBotArmyDps(
  playerDisc: DiscLevelConfig,
  bots: ActiveBot[],
): number {
  return bots.reduce((total, activeBot) => (
    total + playerDisc.damage
      * activeBot.config.discDamageMultiplier
      * activeBot.count
      / (activeBot.config.attackIntervalMs / 1000)
  ), 0);
}

export function calculateBossHealth(
  baseHp: number,
  difficulty: DifficultyConfig,
  playerDisc?: DiscLevelConfig,
  bots: ActiveBot[] = [],
): number {
  const tableHealth = Math.max(1, Math.round(baseHp * difficulty.hpMultiplier));
  if (!playerDisc || bots.length === 0) {
    return Math.ceil(tableHealth * BOSS_BEHAVIOR.globalDifficultyMultiplier);
  }

  const survivalSeconds = Math.min(
    BOSS_BALANCE.maximumPowerScaledSurvivalSeconds,
    BOSS_BALANCE.playerPowerBaseSurvivalSeconds * Math.pow(
      Math.max(1, difficulty.hpMultiplier / BOSS_BALANCE.hpMultiplierReference),
      BOSS_BALANCE.hpScalingExponent,
    ),
  );
  const armyDps = calculateBotArmyDps(playerDisc, bots);
  const powerScaledHealth = Math.ceil(armyDps * survivalSeconds);
  const strongestAutomaticHit = bots.reduce((strongest, activeBot) => Math.max(
    strongest,
    playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count,
  ), 0);
  const antiOneShotHealth = Math.ceil(
    strongestAutomaticHit * BOSS_BALANCE.minimumAutomaticHitsToDefeat,
  );
  return Math.ceil(
    Math.max(tableHealth, powerScaledHealth, antiOneShotHealth)
    * BOSS_BEHAVIOR.globalDifficultyMultiplier,
  );
}

export function canThrowCastleDisc(
  state: BattleState,
  discAvailable: boolean,
  playerDisc: DiscLevelConfig,
  now: number,
): boolean {
  return state.status === 'active'
    && discAvailable
    && now - state.lastCastleThrowAt >= playerDisc.cooldownMs
    && Boolean(closestEnemyWithinRadius(
      state.enemies,
      now,
      BATTLE_RULES.playerStartX,
      BATTLE_RULES.playerStartY,
      BATTLE_RULES.castleAttackRadius,
    ));
}

export function canThrowGiantDisc(
  state: BattleState,
  giantDiscAvailable: boolean,
  now: number,
): boolean {
  return state.status === 'active'
    && giantDiscAvailable
    && Boolean(closestEnemyWithinRadius(
      state.enemies,
      now,
      BATTLE_RULES.playerStartX,
      BATTLE_RULES.playerStartY,
      GIANT_DISC.attackRadius,
    ));
}

export function createBattleEnemies(
  difficulty: DifficultyConfig,
  now: number,
  playerDisc?: DiscLevelConfig,
  bots: ActiveBot[] = [],
): BattleEnemy[] {
  const rules = BATTLE_RULES;
  const wave = getEnemyWave(difficulty.enemyWaveId);
  const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
  return Array.from({ length: difficulty.enemyCount }, (_, index) => {
    const sequenceNumber = index + 1;
    const monsterId = wave.bossEveryEnemies > 0
      && sequenceNumber % wave.bossEveryEnemies === 0
      ? wave.bossMonsterId
      : wave.monsterPatternIds[index % wave.monsterPatternIds.length];
    const monster = getMonster(monsterId);
    const maxHp = calculateBossHealth(monster.baseHp, difficulty, playerDisc, bots);
    const spawnAt = now;
    return {
      id: `enemy-${now}-${index}`,
      monsterId: monster.id,
      imageKey: monster.imageKey,
      name: monster.name,
      rank: monster.rank,
      hp: maxHp,
      maxHp,
      attack: monster.baseAttack,
      moveSpeedMultiplier: monster.moveSpeedMultiplier,
      discDamageMultiplier: monster.discDamageMultiplier,
      sizeMultiplier: monster.sizeMultiplier,
      x: rules.enemyX,
      y: rules.enemyStartY,
      spawnAt,
      lastShotAt: spawnAt
        - enemyDisc.cooldownMs * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
        + rules.enemyFirstShotDelayMs,
      lastMeleeAt: spawnAt,
      enraged: false,
    };
  });
}

function moveEnemies(
  enemies: BattleEnemy[],
  difficulty: DifficultyConfig,
  now: number,
  deltaMs: number,
): BattleEnemy[] {
  const rules = BATTLE_RULES;
  return enemies.map((enemy) => {
    if (enemy.hp <= 0 || enemy.spawnAt > now) return enemy;
    const approach = enemy.y < rules.enemyStopY
      ? difficulty.moveSpeed
        * BOSS_BEHAVIOR.globalMoveSpeedMultiplier
        * enemy.moveSpeedMultiplier
        * deltaMs
        / rules.enemyMoveDivisor
      : 0;
    const nextY = Math.min(rules.enemyStopY, enemy.y + approach);
    const distanceBeforeMove = Math.hypot(
      enemy.x - rules.playerStartX,
      enemy.y - rules.playerStartY,
    );
    const distanceAfterMove = Math.hypot(
      enemy.x - rules.playerStartX,
      nextY - rules.playerStartY,
    );
    const enteredAttackRange = distanceBeforeMove > rules.enemyAttackRadius
      && distanceAfterMove <= rules.enemyAttackRadius;
    const enteredMeleeRange = enemy.y < rules.enemyMeleeTriggerY
      && nextY >= rules.enemyMeleeTriggerY;
    return {
      ...enemy,
      y: nextY,
      lastShotAt: enteredAttackRange ? now : enemy.lastShotAt,
      lastMeleeAt: enteredMeleeRange ? now : enemy.lastMeleeAt,
    };
  });
}

export function advanceBattle(state: BattleState, options: AdvanceOptions): BattleState {
  if (state.status !== 'active') return { ...state, now: options.now };
  const rules = BATTLE_RULES;
  const { difficulty, enemyDisc, playerDisc, bots, now, deltaMs } = options;
  let eventId = state.lastEvent?.id ?? 0;
  let frameEvent: BattleEvent | null = null;
  const eventPriority = (kind: BattleEventKind): number => {
    if (kind === 'victory' || kind === 'defeat' || kind === 'enemyDefeated') return 4;
    if (kind === 'bossEnraged' || kind === 'enemyHit' || kind === 'castleHit') return 3;
    if (kind === 'enemyDisc') return 2;
    return 1;
  };
  const event = (
    kind: BattleEventKind,
    details: Omit<BattleEvent, 'id' | 'kind' | 'at'> & { at?: number } = {},
  ): BattleEvent => {
    if (!frameEvent || eventPriority(kind) >= eventPriority(frameEvent.kind)) {
      frameEvent = { id: ++eventId, kind, at: details.at ?? now, ...details };
    }
    return frameEvent;
  };
  let enemies = moveEnemies(state.enemies, difficulty, now, deltaMs);
  let enemyProjectiles = state.enemyProjectiles.map((projectile) => ({
    ...projectile,
    y: projectile.y + projectile.speed * deltaMs / rules.enemyProjectileMoveDivisor,
  }));
  let playerProjectiles: BattleProjectile[] = [];
  let baseHealth = state.baseHealth;
  let killedEnemies = state.killedEnemies;
  let lastBotAttackAt = { ...state.lastBotAttackAt };
  let notice = now > state.noticeUntil ? null : state.notice;
  let noticeUntil = state.noticeUntil;
  let lastEvent = state.lastEvent;

  for (const originalProjectile of state.playerProjectiles) {
    const target = originalProjectile.targetId
      ? enemies.find((enemy) => (
        enemy.id === originalProjectile.targetId && enemy.hp > 0 && enemy.spawnAt <= now
      ))
      : closestEnemy(enemies, now);
    const targetDistanceY = target ? target.y - originalProjectile.y : 0;
    const physicalTravelY = originalProjectile.speed
      * deltaMs
      / rules.playerProjectileMoveDivisor;
    const ageAtFrameStart = Math.max(0, now - deltaMs - originalProjectile.createdAt);
    const minimumFlightRemainingAtFrameStart = Math.max(
      deltaMs,
      rules.playerProjectileMinimumFlightMs - ageAtFrameStart,
    );
    const timedTravelY = Math.abs(targetDistanceY)
      * Math.min(1, deltaMs / minimumFlightRemainingAtFrameStart);
    const travelY = ageAtFrameStart < rules.playerProjectileMinimumFlightMs
      ? Math.min(physicalTravelY, timedTravelY)
      : physicalTravelY;
    const projectile = {
      ...originalProjectile,
      targetId: target?.id,
      x: target
        ? originalProjectile.x
          + (target.x - originalProjectile.x) * Math.min(1, deltaMs / rules.playerHomingMs)
        : originalProjectile.x,
      y: target
        ? originalProjectile.y + Math.sign(targetDistanceY) * Math.min(
          Math.abs(targetDistanceY),
          travelY,
        )
        : originalProjectile.y - physicalTravelY,
    };
    const hitTarget = target
      && now - projectile.createdAt >= rules.playerProjectileMinimumFlightMs
      && Math.abs(projectile.y - target.y) < rules.playerHitToleranceY
      && Math.abs(projectile.x - target.x) < rules.playerHitToleranceX;
    if (hitTarget) {
      const remainingHp = Math.max(0, target.hp - projectile.damage);
      const becameEnraged = remainingHp > 0
        && !target.enraged
        && remainingHp / target.maxHp <= BOSS_BEHAVIOR.enrageHealthRatio;
      enemies = enemies.map((enemy) => enemy.id === target.id
        ? { ...enemy, hp: remainingHp, enraged: enemy.enraged || becameEnraged }
        : enemy);
      if (remainingHp === 0) killedEnemies += 1;
      if (becameEnraged) {
        notice = '보스 분노!';
        noticeUntil = now + BOSS_BEHAVIOR.enrageAnnouncementMs;
      }
      lastEvent = event(
        remainingHp === 0
          ? 'enemyDefeated'
          : becameEnraged ? 'bossEnraged' : 'enemyHit',
        {
          amount: Math.min(target.hp, projectile.damage),
          x: target.x,
          y: target.y,
          attackSource: projectile.source,
        },
      );
    } else if (projectile.y >= rules.playerProjectileEndY) {
      playerProjectiles.push(projectile);
    }
  }

  for (const [botIndex, activeBot] of bots.entries()) {
    const botId = activeBot.config.id;
    const botSlot = rules.botFormationSlots[botIndex % rules.botFormationSlots.length];
    const lastAttackAt = lastBotAttackAt[botId] ?? state.now;
    const target = closestEnemyWithinRadius(
      enemies,
      now,
      botSlot.x,
      botSlot.y,
      rules.botAttackRadius,
    );
    if (
      !target
      || now - lastAttackAt < activeBot.config.attackIntervalMs
    ) continue;
    playerProjectiles.push({
      id: `bot-disc-${botId}-${now}`,
      owner: 'player',
      source: 'bot',
      sourceBotId: botId,
      x: botSlot.x,
      y: botSlot.y,
      targetId: target.id,
      level: playerDisc.level,
      damage: Math.round(
        playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count,
      ),
      size: calculateBotDiscSize(playerDisc),
      speed: playerDisc.speed,
      createdAt: now,
    });
    lastBotAttackAt[botId] = now;
    lastEvent = event('disc', {
      x: botSlot.x,
      y: botSlot.y,
      attackSource: 'bot',
    });
  }

  for (const enemy of aliveEnemies(enemies, now)) {
    if (enemyProjectiles.length >= rules.maximumSimultaneousEnemyProjectiles) break;
    const inAttackRange = Math.hypot(
      enemy.x - rules.playerStartX,
      enemy.y - rules.playerStartY,
    ) <= rules.enemyAttackRadius;
    if (!inAttackRange) continue;
    const alreadyFlying = enemyProjectiles.some(
      (projectile) => projectile.sourceEnemyId === enemy.id,
    );
    const attackCooldownMs = enemyDisc.cooldownMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier * (
      enemy.enraged ? BOSS_BEHAVIOR.enrageAttackCooldownMultiplier : 1
    );
    if (alreadyFlying || now - enemy.lastShotAt < attackCooldownMs) continue;
    enemyProjectiles.push({
      id: `enemy-disc-${enemy.id}-${now}`,
      owner: 'enemy',
      sourceEnemyId: enemy.id,
      x: enemy.x,
      y: enemy.y + rules.enemyProjectileStartOffsetY,
      level: enemyDisc.level,
      damage: enemyDisc.damage
        * enemy.discDamageMultiplier
        * (enemy.enraged ? BOSS_BEHAVIOR.enrageProjectileDamageMultiplier : 1),
      size: enemyDisc.size,
      speed: enemyDisc.speed,
      createdAt: now,
    });
    enemies = enemies.map((item) => item.id === enemy.id
      ? { ...item, lastShotAt: now }
      : item);
    lastEvent = event('enemyDisc', { x: enemy.x, y: enemy.y });
  }

  const coreHits = enemyProjectiles.filter(
    (projectile) => projectile.y >= rules.coreProjectileHitY,
  );
  if (coreHits.length > 0) {
    const damage = coreHits.reduce((sum, projectile) => sum + projectile.damage, 0);
    const appliedDamage = Math.round(
      damage
        * difficulty.attackMultiplier
        * BOSS_BEHAVIOR.globalAttackDamageMultiplier
        * BOSS_BEHAVIOR.globalDifficultyMultiplier,
    );
    baseHealth = Math.max(0, baseHealth - appliedDamage);
    enemyProjectiles = enemyProjectiles.filter(
      (projectile) => projectile.y < rules.coreProjectileHitY,
    );
    lastEvent = event('castleHit', {
      amount: appliedDamage,
      x: rules.playerStartX,
      y: rules.playerStartY,
      sourceEnemyId: coreHits[0].sourceEnemyId,
      attackKind: 'projectile',
    });
  }

  for (const enemy of aliveEnemies(enemies, now)) {
    const meleeIntervalMs = rules.enemyMeleeIntervalMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
      * (enemy.enraged ? BOSS_BEHAVIOR.enrageAttackCooldownMultiplier : 1);
    if (
      enemy.y < rules.enemyMeleeTriggerY
      || now - enemy.lastMeleeAt < meleeIntervalMs
    ) continue;
    const damage = Math.max(1, Math.round(
      enemy.attack
      * difficulty.attackMultiplier
      * BOSS_BEHAVIOR.globalAttackDamageMultiplier
      * BOSS_BEHAVIOR.globalDifficultyMultiplier
      * (enemy.enraged ? BOSS_BEHAVIOR.enrageMeleeDamageMultiplier : 1),
    ));
    baseHealth = Math.max(0, baseHealth - damage);
    enemies = enemies.map((item) => item.id === enemy.id
      ? { ...item, lastMeleeAt: now }
      : item);
    lastEvent = event('castleHit', {
      amount: damage,
      x: rules.playerStartX,
      y: rules.playerStartY,
      sourceEnemyId: enemy.id,
      attackKind: 'melee',
    });
  }

  if (enemies.length > 0 && enemies.every((enemy) => enemy.hp <= 0)) {
    return {
      ...state,
      now,
      enemies,
      enemyProjectiles: [],
      playerProjectiles: [],
      baseHealth,
      killedEnemies,
      lastBotAttackAt,
      notice: '승리!',
      noticeUntil: now + rules.resultNoticeMs,
      status: 'victory',
      lastEvent: event('victory', { x: rules.enemyX, y: rules.enemyStopY }),
    };
  }
  if (baseHealth <= 0) {
    return {
      ...state,
      now,
      enemies,
      enemyProjectiles: [],
      playerProjectiles: [],
      baseHealth: 0,
      killedEnemies,
      lastBotAttackAt,
      notice: '패배',
      noticeUntil: now + rules.resultNoticeMs,
      status: 'defeat',
      lastEvent: event('defeat', { x: rules.playerStartX, y: rules.playerStartY }),
    };
  }

  return {
    ...state,
    now,
    enemies,
    enemyProjectiles,
    playerProjectiles,
    baseHealth,
    killedEnemies,
    lastBotAttackAt,
    notice,
    noticeUntil,
    lastEvent,
  };
}

export function useBattleEngine({
  difficulty,
  playerDisc,
  discAvailable,
  bots,
  maxHealth,
  onEvent,
}: EngineOptions) {
  const [state, setState] = useState<BattleState>(initialState);
  const enemyDisc = useMemo(
    () => getEnemyDisc(difficulty.enemyDiscLevel),
    [difficulty.enemyDiscLevel],
  );

  useEffect(() => {
    if (state.status !== 'active') return;
    let previous = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const deltaMs = Math.min(BATTLE_RULES.maxDeltaMs, now - previous);
      previous = now;
      setState((current) => advanceBattle(current, {
        difficulty,
        enemyDisc,
        playerDisc,
        bots,
        now,
        deltaMs,
      }));
    }, BATTLE_RULES.tickMs);
    return () => clearInterval(timer);
  }, [state.status, difficulty, enemyDisc, playerDisc, bots]);

  useEffect(() => {
    if (state.lastEvent) onEvent?.(state.lastEvent);
  }, [state.lastEvent, onEvent]);

  const start = useCallback(() => {
    const now = Date.now();
    setState({
      ...initialState,
      status: 'active',
      now,
      enemies: createBattleEnemies(difficulty, now, playerDisc, bots),
      baseHealth: maxHealth,
      baseMaxHealth: maxHealth,
      lastBotAttackAt: Object.fromEntries(bots.map((bot) => [bot.config.id, now])),
    });
  }, [difficulty, playerDisc, bots, maxHealth]);

  const throwCastleDisc = useCallback((): boolean => {
    const now = Date.now();
    if (!canThrowCastleDisc(state, discAvailable, playerDisc, now)) return false;
    const target = closestEnemyWithinRadius(
      state.enemies,
      now,
      BATTLE_RULES.playerStartX,
      BATTLE_RULES.playerStartY,
      BATTLE_RULES.castleAttackRadius,
    );
    if (!target) return false;
    setState((current) => ({
      ...current,
      now,
      lastCastleThrowAt: now,
      playerProjectiles: [...current.playerProjectiles, {
        id: `castle-disc-${now}`,
        owner: 'player',
        source: 'castle',
        x: BATTLE_RULES.playerStartX,
        y: BATTLE_RULES.playerStartY,
        targetId: target.id,
        level: playerDisc.level,
        damage: calculateCastleDiscDamage(playerDisc),
        size: playerDisc.size,
        speed: playerDisc.speed,
        createdAt: now,
      }],
      lastEvent: {
        id: (current.lastEvent?.id ?? 0) + 1,
        kind: 'disc',
        at: now,
        x: BATTLE_RULES.playerStartX,
        y: BATTLE_RULES.playerStartY,
        attackSource: 'castle',
      },
    }));
    return true;
  }, [discAvailable, playerDisc, state]);

  const throwGiantDisc = useCallback((): boolean => {
    const now = Date.now();
    if (!canThrowGiantDisc(state, true, now)) return false;
    const target = closestEnemyWithinRadius(
      state.enemies,
      now,
      BATTLE_RULES.playerStartX,
      BATTLE_RULES.playerStartY,
      GIANT_DISC.attackRadius,
    );
    if (!target) return false;
    setState((current) => ({
      ...current,
      now,
      playerProjectiles: [...current.playerProjectiles, {
        id: `giant-disc-${now}`,
        owner: 'player',
        source: 'giant',
        x: BATTLE_RULES.playerStartX,
        y: BATTLE_RULES.playerStartY,
        targetId: target.id,
        level: playerDisc.level,
        damage: calculateGiantDiscDamage(playerDisc, bots),
        size: playerDisc.size,
        speed: playerDisc.speed * GIANT_DISC.speedMultiplier,
        createdAt: now,
      }],
      notice: '거대 원반!',
      noticeUntil: now + GIANT_DISC.launchNoticeMs,
      lastEvent: {
        id: (current.lastEvent?.id ?? 0) + 1,
        kind: 'disc',
        at: now,
        x: BATTLE_RULES.playerStartX,
        y: BATTLE_RULES.playerStartY,
        attackSource: 'giant',
      },
    }));
    return true;
  }, [playerDisc, bots, state]);

  const reset = useCallback(() => setState({ ...initialState, now: Date.now() }), []);
  const canCastleThrow = canThrowCastleDisc(
    state,
    discAvailable,
    playerDisc,
    state.now,
  );
  const canGiantThrow = canThrowGiantDisc(state, true, state.now);
  const cooldownRemainingMs = Math.max(
    0,
    playerDisc.cooldownMs - (state.now - state.lastCastleThrowAt),
  );

  return {
    state,
    start,
    throwCastleDisc,
    throwGiantDisc,
    reset,
    canCastleThrow,
    canGiantThrow,
    cooldownRemainingMs,
    enemyDisc,
  };
}
