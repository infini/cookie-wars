import { BATTLE_RULES } from '../config';
import {
  clampSafeInteger,
  saturatingAdd,
} from '../domain/safeNumbers';
import { appendBattleEvent } from './battleEvents';
import {
  moveEnemies,
  moveEnemyProjectiles,
  resolveBossAttacks,
} from './enemyBattleSimulation';
import {
  resolvePlayerHits,
  spawnBotProjectiles,
} from './playerBattleSimulation';
import type {
  AdvanceOptions,
  BattleEnemy,
  BattleFrame,
  BattleState,
  BattleStatus,
} from './battleTypes';

export function resolveBattleOutcome(
  enemies: BattleEnemy[],
  baseHealth: number,
): Extract<BattleStatus, 'victory' | 'defeat'> | null {
  // A final player hit wins ties, even when the castle reaches zero in the same frame.
  if (enemies.length > 0 && enemies.every((enemy) => enemy.hp <= 0)) return 'victory';
  if (baseHealth <= 0) return 'defeat';
  return null;
}

export function resolveBattleResult(
  previousState: BattleState,
  frame: BattleFrame,
  now: number,
): BattleState {
  const outcome = resolveBattleOutcome(frame.enemies, frame.baseHealth);
  if (!outcome) return { ...previousState, ...frame, now };

  const eventJournal = appendBattleEvent(
    frame,
    outcome,
    now,
    outcome === 'victory'
      ? { x: BATTLE_RULES.enemyX, y: BATTLE_RULES.enemyStopY }
      : { x: BATTLE_RULES.playerStartX, y: BATTLE_RULES.playerStartY },
  );
  return {
    ...previousState,
    ...frame,
    ...eventJournal,
    now,
    enemyProjectiles: [],
    playerProjectiles: [],
    baseHealth: outcome === 'defeat' ? 0 : frame.baseHealth,
    notice: outcome === 'victory' ? '승리!' : '패배',
    noticeUntil: saturatingAdd(now, BATTLE_RULES.resultNoticeMs),
    status: outcome,
  };
}

export function advanceBattle(
  state: BattleState,
  options: AdvanceOptions,
): BattleState {
  if (state.status !== 'active') {
    return { ...state, now: clampSafeInteger(options.now) };
  }
  const { difficulty, enemyDisc, playerDisc, bots, now, deltaMs } = options;
  let frame: BattleFrame = {
    eventSequence: state.eventSequence,
    events: state.events,
    pendingEvents: state.pendingEvents,
    enemies: moveEnemies(state.enemies, { difficulty, now, deltaMs }),
    enemyProjectiles: moveEnemyProjectiles(state.enemyProjectiles, deltaMs),
    playerProjectiles: [],
    baseHealth: clampSafeInteger(state.baseHealth),
    killedEnemies: clampSafeInteger(state.killedEnemies),
    lastBotAttackAt: { ...state.lastBotAttackAt },
    notice: now > state.noticeUntil ? null : state.notice,
    noticeUntil: state.noticeUntil,
  };
  frame = resolvePlayerHits(frame, state.playerProjectiles, { now, deltaMs });
  frame = spawnBotProjectiles(frame, {
    bots,
    playerDisc,
    now,
    previousNow: state.now,
  });
  frame = resolveBossAttacks(frame, { difficulty, enemyDisc, now });
  return resolveBattleResult(state, frame, now);
}
