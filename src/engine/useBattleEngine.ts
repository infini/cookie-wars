import { useCallback, useEffect, useMemo, useState } from 'react';
import { BATTLE_RULES, getEnemyDisc } from '../config';
import { ActiveBot } from '../domain/gameSelectors';
import {
  DifficultyConfig,
  DiscLevelConfig,
  EnemyDiscConfig,
  MonsterConfig,
} from '../types/game';

export type BattleStatus = 'idle' | 'active' | 'victory' | 'defeat';
export type BattleEventKind =
  | 'hit'
  | 'disc'
  | 'enemyDisc'
  | 'enemyDefeated'
  | 'victory'
  | 'defeat';

export interface BattleEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  spawnAt: number;
  lastShotAt: number;
  lastMeleeAt: number;
}

export interface BattleProjectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  targetId?: string;
  sourceEnemyId?: string;
  sourceBotId?: string;
  source?: 'castle' | 'bot';
  level: number;
  damage: number;
  size: number;
  speed: number;
}

interface BattleEvent {
  id: number;
  kind: BattleEventKind;
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
  monster: MonsterConfig;
  playerDisc: DiscLevelConfig;
  discAvailable: boolean;
  bots: ActiveBot[];
  maxHealth: number;
  onEvent?: (kind: BattleEventKind) => void;
}

export interface AdvanceOptions {
  difficulty: DifficultyConfig;
  monster: MonsterConfig;
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

export function calculateCastleDiscDamage(playerDisc: DiscLevelConfig): number {
  return Math.round(playerDisc.damage * BATTLE_RULES.castleDiscDamageMultiplier);
}

export function canThrowCastleDisc(
  state: BattleState,
  discAvailable: boolean,
  playerDisc: DiscLevelConfig,
  now: number,
): boolean {
  return state.status === 'active'
    && discAvailable
    && now - state.lastCastleThrowAt >= playerDisc.cooldownMs;
}

export function createBattleEnemies(
  difficulty: DifficultyConfig,
  monster: MonsterConfig,
  now: number,
): BattleEnemy[] {
  const rules = BATTLE_RULES;
  const maxHp = Math.max(1, Math.round(monster.baseHp * difficulty.hpMultiplier));
  const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
  return Array.from({ length: difficulty.enemyCount }, (_, index) => {
    const column = index % rules.enemyColumns;
    const spawnStep = Math.max(0, index - rules.initialEnemySpawnCount + 1);
    const spawnAt = now + spawnStep * rules.enemySpawnIntervalMs;
    return {
      id: `enemy-${now}-${index}`,
      name: difficulty.enemyCount > 1 ? `${monster.name} ${index + 1}` : monster.name,
      hp: maxHp,
      maxHp,
      x: rules.enemyStartX + column * rules.enemyColumnGap,
      y: rules.enemyStartY,
      spawnAt,
      lastShotAt: spawnAt
        - enemyDisc.cooldownMs
        + rules.enemyFirstShotDelayMs
        + column * rules.enemyShotStaggerMs,
      lastMeleeAt: spawnAt,
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
      ? difficulty.moveSpeed * deltaMs / rules.enemyMoveDivisor
      : 0;
    return {
      ...enemy,
      y: Math.min(rules.enemyStopY, enemy.y + approach),
    };
  });
}

export function advanceBattle(state: BattleState, options: AdvanceOptions): BattleState {
  if (state.status !== 'active') return { ...state, now: options.now };
  const rules = BATTLE_RULES;
  const { difficulty, monster, enemyDisc, playerDisc, bots, now, deltaMs } = options;
  let eventId = state.lastEvent?.id ?? 0;
  const event = (kind: BattleEventKind): BattleEvent => ({ id: ++eventId, kind });
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
    const projectile = {
      ...originalProjectile,
      targetId: target?.id,
      x: target
        ? originalProjectile.x
          + (target.x - originalProjectile.x) * Math.min(1, deltaMs / rules.playerHomingMs)
        : originalProjectile.x,
      y: originalProjectile.y
        - originalProjectile.speed * deltaMs / rules.playerProjectileMoveDivisor,
    };
    const hitTarget = target
      && Math.abs(projectile.y - target.y) < rules.playerHitToleranceY
      && Math.abs(projectile.x - target.x) < rules.playerHitToleranceX;
    if (hitTarget) {
      const remainingHp = Math.max(0, target.hp - projectile.damage);
      enemies = enemies.map((enemy) => enemy.id === target.id
        ? { ...enemy, hp: remainingHp }
        : enemy);
      if (remainingHp === 0) killedEnemies += 1;
      lastEvent = event(remainingHp === 0 ? 'enemyDefeated' : 'hit');
    } else if (projectile.y >= rules.playerProjectileEndY) {
      playerProjectiles.push(projectile);
    }
  }

  for (const activeBot of bots) {
    const botId = activeBot.config.id;
    const lastAttackAt = lastBotAttackAt[botId] ?? state.now;
    const target = closestEnemy(enemies, now);
    if (
      !target
      || now - lastAttackAt < activeBot.config.attackIntervalMs
    ) continue;
    playerProjectiles.push({
      id: `bot-disc-${botId}-${now}`,
      owner: 'player',
      source: 'bot',
      sourceBotId: botId,
      x: rules.playerStartX,
      y: rules.playerStartY,
      targetId: target.id,
      level: playerDisc.level,
      damage: Math.round(
        playerDisc.damage * activeBot.config.discDamageMultiplier * activeBot.count,
      ),
      size: playerDisc.size,
      speed: playerDisc.speed,
    });
    lastBotAttackAt[botId] = now;
    lastEvent = event('disc');
  }

  for (const enemy of aliveEnemies(enemies, now)) {
    const alreadyFlying = enemyProjectiles.some(
      (projectile) => projectile.sourceEnemyId === enemy.id,
    );
    if (alreadyFlying || now - enemy.lastShotAt < enemyDisc.cooldownMs) continue;
    enemyProjectiles.push({
      id: `enemy-disc-${enemy.id}-${now}`,
      owner: 'enemy',
      sourceEnemyId: enemy.id,
      x: enemy.x,
      y: enemy.y + rules.enemyProjectileStartOffsetY,
      level: enemyDisc.level,
      damage: enemyDisc.damage,
      size: enemyDisc.size,
      speed: enemyDisc.speed,
    });
    enemies = enemies.map((item) => item.id === enemy.id
      ? { ...item, lastShotAt: now }
      : item);
    lastEvent = event('enemyDisc');
  }

  const coreHits = enemyProjectiles.filter(
    (projectile) => projectile.y >= rules.coreProjectileHitY,
  );
  if (coreHits.length > 0) {
    const damage = coreHits.reduce((sum, projectile) => sum + projectile.damage, 0);
    baseHealth = Math.max(0, baseHealth - Math.round(damage * difficulty.attackMultiplier));
    enemyProjectiles = enemyProjectiles.filter(
      (projectile) => projectile.y < rules.coreProjectileHitY,
    );
    lastEvent = event('hit');
  }

  for (const enemy of aliveEnemies(enemies, now)) {
    if (
      enemy.y < rules.enemyMeleeTriggerY
      || now - enemy.lastMeleeAt < rules.enemyMeleeIntervalMs
    ) continue;
    const damage = Math.max(1, Math.round(monster.baseAttack * difficulty.attackMultiplier));
    baseHealth = Math.max(0, baseHealth - damage);
    enemies = enemies.map((item) => item.id === enemy.id
      ? { ...item, lastMeleeAt: now }
      : item);
    lastEvent = event('hit');
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
      lastEvent: event('victory'),
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
      lastEvent: event('defeat'),
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
  monster,
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
        monster,
        enemyDisc,
        playerDisc,
        bots,
        now,
        deltaMs,
      }));
    }, BATTLE_RULES.tickMs);
    return () => clearInterval(timer);
  }, [state.status, difficulty, monster, enemyDisc, playerDisc, bots]);

  useEffect(() => {
    if (state.lastEvent) onEvent?.(state.lastEvent.kind);
  }, [state.lastEvent, onEvent]);

  const start = useCallback(() => {
    const now = Date.now();
    setState({
      ...initialState,
      status: 'active',
      now,
      enemies: createBattleEnemies(difficulty, monster, now),
      baseHealth: maxHealth,
      baseMaxHealth: maxHealth,
      lastBotAttackAt: Object.fromEntries(bots.map((bot) => [bot.config.id, now])),
    });
  }, [difficulty, monster, bots, maxHealth]);

  const throwCastleDisc = useCallback((): boolean => {
    const now = Date.now();
    if (!canThrowCastleDisc(state, discAvailable, playerDisc, now)) return false;
    const target = closestEnemy(state.enemies, now);
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
      }],
      lastEvent: {
        id: (current.lastEvent?.id ?? 0) + 1,
        kind: 'disc',
      },
    }));
    return true;
  }, [discAvailable, playerDisc, state]);

  const reset = useCallback(() => setState({ ...initialState, now: Date.now() }), []);
  const canCastleThrow = canThrowCastleDisc(
    state,
    discAvailable,
    playerDisc,
    state.now,
  );
  const cooldownRemainingMs = Math.max(
    0,
    playerDisc.cooldownMs - (state.now - state.lastCastleThrowAt),
  );

  return {
    state,
    start,
    throwCastleDisc,
    reset,
    canCastleThrow,
    cooldownRemainingMs,
    enemyDisc,
  };
}
