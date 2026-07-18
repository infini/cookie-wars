import { useCallback, useEffect, useMemo, useState } from 'react';
import { PRIMARY_BOT, PRIMARY_MONSTER, getEnemyDisc } from '../config';
import {
  BotConfig,
  DifficultyConfig,
  DiscLevelConfig,
  EnemyDiscConfig,
} from '../types/game';

export type BattleStatus = 'idle' | 'active' | 'victory' | 'defeat';
export type BattleEventKind =
  | 'hit'
  | 'laser'
  | 'disc'
  | 'enemyDisc'
  | 'enemyDefeated'
  | 'victory'
  | 'defeat'
  | 'dodge';

export interface BattleEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
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
  playerProjectile: BattleProjectile | null;
  baseHealth: number;
  baseMaxHealth: number;
  killedEnemies: number;
  lastPlayerThrowAt: number;
  lastBotAttackAt: number;
  notice: string | null;
  noticeUntil: number;
  lastEvent: BattleEvent | null;
}

const initialState: BattleState = {
  status: 'idle',
  now: Date.now(),
  enemies: [],
  enemyProjectiles: [],
  playerProjectile: null,
  baseHealth: 0,
  baseMaxHealth: 0,
  killedEnemies: 0,
  lastPlayerThrowAt: 0,
  lastBotAttackAt: 0,
  notice: null,
  noticeUntil: 0,
  lastEvent: null,
};

interface EngineOptions {
  difficulty: DifficultyConfig;
  playerDisc: DiscLevelConfig;
  discOwned: boolean;
  botCount: number;
  maxHealth: number;
  onEvent?: (kind: BattleEventKind) => void;
  random?: () => number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function makeEnemies(difficulty: DifficultyConfig, now: number): BattleEnemy[] {
  const maxHp = Math.max(1, Math.round(PRIMARY_MONSTER.baseHp * difficulty.hpMultiplier));
  return Array.from({ length: difficulty.enemyCount }, (_, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const disc = getEnemyDisc(difficulty.enemyDiscLevel);
    return {
      id: `enemy-${now}-${index}`,
      name: difficulty.enemyCount > 1 ? `${PRIMARY_MONSTER.name} ${index + 1}` : PRIMARY_MONSTER.name,
      hp: maxHp,
      maxHp,
      x: 0.13 + column * 0.245,
      y: 0.08 + row * 0.055,
      lastShotAt: now - disc.cooldownMs + 900 + index * 170,
      lastMeleeAt: now,
    };
  });
}

function nextEvent(state: BattleState, kind: BattleEventKind): BattleEvent {
  return { id: (state.lastEvent?.id ?? 0) + 1, kind };
}

interface AdvanceOptions {
  difficulty: DifficultyConfig;
  enemyDisc: EnemyDiscConfig;
  playerDisc: DiscLevelConfig;
  botCount: number;
  bot: BotConfig;
  now: number;
  deltaMs: number;
  random: () => number;
}

export function advanceBattle(state: BattleState, options: AdvanceOptions): BattleState {
  if (state.status !== 'active') return { ...state, now: options.now };
  const { difficulty, enemyDisc, playerDisc, botCount, bot, now, deltaMs, random } = options;
  let enemies = state.enemies.map((enemy, index) => {
    if (enemy.hp <= 0) return enemy;
    const approach = enemy.y < 0.69 ? difficulty.moveSpeed * deltaMs / 100_000 : 0;
    const intelligence = difficulty.dodgeChance;
    const sway = intelligence > 0.08
      ? Math.sin(now / Math.max(220, difficulty.reactionMs) + index * 1.7) * intelligence * 0.006
      : 0;
    return { ...enemy, y: Math.min(0.69, enemy.y + approach), x: clamp(enemy.x + sway, 0.09, 0.91) };
  });
  let enemyProjectiles = state.enemyProjectiles.map((projectile) => ({
    ...projectile,
    y: projectile.y + projectile.speed * deltaMs / 500_000,
  }));
  let playerProjectile = state.playerProjectile;
  let baseHealth = state.baseHealth;
  let killedEnemies = state.killedEnemies;
  let lastBotAttackAt = state.lastBotAttackAt;
  let notice = now > state.noticeUntil ? null : state.notice;
  let noticeUntil = state.noticeUntil;
  let lastEvent = state.lastEvent;

  if (playerProjectile) {
    const target = playerProjectile.targetId
      ? enemies.find((enemy) => enemy.id === playerProjectile?.targetId && enemy.hp > 0)
      : undefined;
    const nextX = target
      ? playerProjectile.x + (target.x - playerProjectile.x) * Math.min(1, deltaMs / 180)
      : playerProjectile.x;
    playerProjectile = {
      ...playerProjectile,
      x: nextX,
      y: playerProjectile.y - playerProjectile.speed * deltaMs / 600_000,
    };
    if (target && Math.abs(playerProjectile.y - target.y) < 0.075 && Math.abs(playerProjectile.x - target.x) < 0.13) {
      if (random() < difficulty.dodgeChance) {
        const direction = target.x > 0.5 ? -1 : 1;
        enemies = enemies.map((enemy) => enemy.id === target.id
          ? { ...enemy, x: clamp(enemy.x + direction * (0.16 + difficulty.dodgeChance * 0.08), 0.09, 0.91) }
          : enemy);
        playerProjectile = { ...playerProjectile, targetId: undefined };
        notice = '회피!';
        noticeUntil = now + 700;
        lastEvent = nextEvent(state, 'dodge');
      } else {
        const remainingHp = Math.max(0, target.hp - playerDisc.damage);
        enemies = enemies.map((enemy) => enemy.id === target.id ? { ...enemy, hp: remainingHp } : enemy);
        playerProjectile = null;
        if (remainingHp === 0) {
          killedEnemies += 1;
          lastEvent = nextEvent(state, 'enemyDefeated');
        } else {
          lastEvent = nextEvent(state, 'hit');
        }
      }
    } else if (playerProjectile.y < -0.12) {
      playerProjectile = null;
    }
  }

  const aliveBeforeBot = enemies.filter((enemy) => enemy.hp > 0);
  if (botCount > 0 && aliveBeforeBot.length > 0 && now - lastBotAttackAt >= bot.attackIntervalMs) {
    const target = [...aliveBeforeBot].sort((a, b) => b.y - a.y)[0];
    const remainingHp = Math.max(0, target.hp - bot.damage * botCount);
    enemies = enemies.map((enemy) => enemy.id === target.id ? { ...enemy, hp: remainingHp } : enemy);
    lastBotAttackAt = now;
    if (remainingHp === 0) killedEnemies += 1;
    lastEvent = nextEvent(state, remainingHp === 0 ? 'enemyDefeated' : 'laser');
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const alreadyFlying = enemyProjectiles.some((projectile) => projectile.sourceEnemyId === enemy.id);
    if (!alreadyFlying && now - enemy.lastShotAt >= enemyDisc.cooldownMs) {
      enemyProjectiles.push({
        id: `enemy-disc-${enemy.id}-${now}`,
        owner: 'enemy',
        sourceEnemyId: enemy.id,
        x: enemy.x,
        y: enemy.y + 0.075,
        level: enemyDisc.level,
        damage: enemyDisc.damage,
        size: enemyDisc.size,
        speed: enemyDisc.speed,
      });
      enemies = enemies.map((item) => item.id === enemy.id ? { ...item, lastShotAt: now } : item);
      lastEvent = nextEvent(state, 'enemyDisc');
    }
  }

  const reachedCore = enemyProjectiles.filter((projectile) => projectile.y >= 0.82);
  if (reachedCore.length > 0) {
    const projectileDamage = reachedCore.reduce((sum, projectile) => sum + projectile.damage, 0);
    baseHealth = Math.max(0, baseHealth - Math.round(projectileDamage * difficulty.attackMultiplier));
    enemyProjectiles = enemyProjectiles.filter((projectile) => projectile.y < 0.82);
    lastEvent = nextEvent(state, 'hit');
  }

  for (const enemy of enemies) {
    if (enemy.hp > 0 && enemy.y >= 0.685 && now - enemy.lastMeleeAt >= 1800) {
      baseHealth = Math.max(0, baseHealth - Math.max(1, Math.round(PRIMARY_MONSTER.baseAttack * difficulty.attackMultiplier)));
      enemies = enemies.map((item) => item.id === enemy.id ? { ...item, lastMeleeAt: now } : item);
      lastEvent = nextEvent(state, 'hit');
    }
  }

  const allDefeated = enemies.length > 0 && enemies.every((enemy) => enemy.hp <= 0);
  if (allDefeated) {
    return {
      ...state, now, enemies, enemyProjectiles: [], playerProjectile: null, baseHealth,
      killedEnemies, lastBotAttackAt, notice: '승리!', noticeUntil: now + 2000,
      status: 'victory', lastEvent: nextEvent(state, 'victory'),
    };
  }
  if (baseHealth <= 0) {
    return {
      ...state, now, enemies, enemyProjectiles: [], playerProjectile: null, baseHealth: 0,
      killedEnemies, lastBotAttackAt, notice: '패배', noticeUntil: now + 2000,
      status: 'defeat', lastEvent: nextEvent(state, 'defeat'),
    };
  }

  return {
    ...state,
    now,
    enemies,
    enemyProjectiles,
    playerProjectile,
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
  discOwned,
  botCount,
  maxHealth,
  onEvent,
  random = Math.random,
}: EngineOptions) {
  const [state, setState] = useState<BattleState>(initialState);
  const enemyDisc = useMemo(() => getEnemyDisc(difficulty.enemyDiscLevel), [difficulty.enemyDiscLevel]);

  useEffect(() => {
    if (state.status !== 'active') return;
    let previous = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const deltaMs = Math.min(100, now - previous);
      previous = now;
      setState((current) => advanceBattle(current, {
        difficulty, enemyDisc, playerDisc, botCount, bot: PRIMARY_BOT, now, deltaMs, random,
      }));
    }, 50);
    return () => clearInterval(timer);
  }, [state.status, difficulty, enemyDisc, playerDisc, botCount, random]);

  useEffect(() => {
    if (state.lastEvent) onEvent?.(state.lastEvent.kind);
  }, [state.lastEvent, onEvent]);

  const start = useCallback(() => {
    const now = Date.now();
    setState({
      ...initialState,
      status: 'active',
      now,
      enemies: makeEnemies(difficulty, now),
      baseHealth: maxHealth,
      baseMaxHealth: maxHealth,
      lastBotAttackAt: now,
    });
  }, [difficulty, maxHealth]);

  const throwDisc = useCallback((): boolean => {
    const now = Date.now();
    if (
      state.status !== 'active' ||
      !discOwned ||
      state.playerProjectile ||
      now - state.lastPlayerThrowAt < playerDisc.cooldownMs
    ) return false;
    const target = [...state.enemies].filter((enemy) => enemy.hp > 0).sort((a, b) => b.y - a.y)[0];
    if (!target) return false;
    setState((current) => ({
        ...current,
        now,
        lastPlayerThrowAt: now,
        playerProjectile: {
          id: `player-disc-${now}`,
          owner: 'player',
          x: 0.5,
          y: 0.78,
          targetId: target.id,
          level: playerDisc.level,
          damage: playerDisc.damage,
          size: playerDisc.size,
          speed: playerDisc.speed,
        },
        lastEvent: nextEvent(current, 'disc'),
      }));
    return true;
  }, [discOwned, playerDisc, state]);

  const reset = useCallback(() => setState({ ...initialState, now: Date.now() }), []);
  const canThrow = state.status === 'active'
    && discOwned
    && !state.playerProjectile
    && state.now - state.lastPlayerThrowAt >= playerDisc.cooldownMs;
  const cooldownRemainingMs = Math.max(0, playerDisc.cooldownMs - (state.now - state.lastPlayerThrowAt));

  return { state, start, throwDisc, reset, canThrow, cooldownRemainingMs, enemyDisc };
}
