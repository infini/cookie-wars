import { normalizeBattleSpeedMultiplier } from '../domain/battleSpeedSettings';
import type { DifficultyConfig, DiscLevelConfig, EnemyDiscConfig } from '../types/game';
import type { ActiveBot } from '../domain/gameSelectors';
import { advanceBattle } from './battleSimulation';
import type { BattleState } from './battleTypes';

interface AdvanceBattleAtSpeedOptions {
  difficulty: DifficultyConfig;
  enemyDisc: EnemyDiscConfig;
  playerDisc: DiscLevelConfig;
  bots: ActiveBot[];
  deltaMs: number;
  speedMultiplier: number;
}

export function advanceBattleAtSpeed(
  state: BattleState,
  options: AdvanceBattleAtSpeedOptions,
): BattleState {
  const speedMultiplier = normalizeBattleSpeedMultiplier(options.speedMultiplier);
  let next = state;
  for (let step = 0; step < speedMultiplier && next.status === 'active'; step += 1) {
    next = advanceBattle(next, {
      difficulty: options.difficulty,
      enemyDisc: options.enemyDisc,
      playerDisc: options.playerDisc,
      bots: options.bots,
      now: next.now + options.deltaMs,
      deltaMs: options.deltaMs,
    });
  }
  return next;
}
