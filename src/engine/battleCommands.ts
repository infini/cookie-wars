import { BATTLE_RULES, GIANT_DISC } from '../config';
import type { ActiveBot } from '../domain/gameSelectors';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingAdd,
} from '../domain/safeNumbers';
import type { DiscLevelConfig } from '../types/game';
import { appendBattleEvent } from './battleEvents';
import {
  calculateCastleDiscDamage,
  calculateGiantDiscDamage,
  closestEnemyWithinRadius,
} from './battleModel';
import { saturatingCombatProduct } from './battleNumbers';
import type { BattleState } from './battleTypes';

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

export function clampBattleDeltaMs(elapsedMs: number): number {
  return clampFiniteNumber(elapsedMs, {
    fallback: 0,
    maximum: BATTLE_RULES.maxDeltaMs,
  });
}

export function createManualProjectileId(
  source: 'castle' | 'giant',
  now: number,
  sequence: number,
): string {
  return `${source}-disc-${now}-${sequence}`;
}

export function tryThrowCastleDisc(
  state: BattleState,
  discAvailable: boolean,
  playerDisc: DiscLevelConfig,
  now: number,
  projectileId: string,
): BattleState {
  if (!canThrowCastleDisc(state, discAvailable, playerDisc, now)) return state;
  const target = closestEnemyWithinRadius(
    state.enemies,
    now,
    BATTLE_RULES.playerStartX,
    BATTLE_RULES.playerStartY,
    BATTLE_RULES.castleAttackRadius,
  );
  if (!target) return state;

  const journal = appendBattleEvent(state, 'disc', now, {
    x: BATTLE_RULES.playerStartX,
    y: BATTLE_RULES.playerStartY,
    attackSource: 'castle',
  });
  return {
    ...state,
    ...journal,
    now,
    lastCastleThrowAt: now,
    playerProjectiles: [...state.playerProjectiles, {
      id: projectileId,
      owner: 'player',
      source: 'castle',
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.playerStartY,
      targetId: target.id,
      level: clampSafeInteger(playerDisc.level),
      damage: calculateCastleDiscDamage(playerDisc),
      size: clampSafeInteger(playerDisc.size),
      speed: clampSafeInteger(playerDisc.speed),
      createdAt: now,
    }],
  };
}

export function tryThrowGiantDisc(
  state: BattleState,
  giantDiscAvailable: boolean,
  playerDisc: DiscLevelConfig,
  bots: ActiveBot[],
  now: number,
  projectileId: string,
): BattleState {
  if (!canThrowGiantDisc(state, giantDiscAvailable, now)) return state;
  const target = closestEnemyWithinRadius(
    state.enemies,
    now,
    BATTLE_RULES.playerStartX,
    BATTLE_RULES.playerStartY,
    GIANT_DISC.attackRadius,
  );
  if (!target) return state;

  const journal = appendBattleEvent(state, 'disc', now, {
    x: BATTLE_RULES.playerStartX,
    y: BATTLE_RULES.playerStartY,
    attackSource: 'giant',
  });
  return {
    ...state,
    ...journal,
    now,
    playerProjectiles: [...state.playerProjectiles, {
      id: projectileId,
      owner: 'player',
      source: 'giant',
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.playerStartY,
      targetId: target.id,
      level: clampSafeInteger(playerDisc.level),
      damage: calculateGiantDiscDamage(playerDisc, bots),
      size: clampSafeInteger(playerDisc.size),
      speed: saturatingCombatProduct([
        playerDisc.speed,
        GIANT_DISC.speedMultiplier,
      ]),
      createdAt: now,
    }],
    notice: '거대 원반!',
    noticeUntil: saturatingAdd(now, GIANT_DISC.launchNoticeMs),
  };
}

export function commitAuthorizedBattleState(
  current: BattleState,
  candidate: BattleState,
  authorize: () => boolean,
): BattleState {
  if (candidate === current) return current;
  return authorize() ? candidate : current;
}
