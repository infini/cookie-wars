import {
  BATTLE_STAGE_RULES,
  DIFFICULTIES,
  ENEMY_DISCS,
  PROGRESSION,
} from '../../config';
import { DifficultyConfig, GameState } from '../../types/game';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingAdd,
} from '../safeNumbers';

export interface DifficultyProgress {
  wins: number;
  requiredWins: number;
  remainingWins: number;
  completed: boolean;
  currentBattleNumber: number;
}

export function getBattleStageId(difficultyId: string, stageNumber: number): string {
  return `${difficultyId}:${stageNumber}`;
}

export function getDifficultyProgress(
  state: GameState,
  difficultyId: string,
): DifficultyProgress {
  const validDifficulty = DIFFICULTIES.some((difficulty) => difficulty.id === difficultyId);
  const requiredWins = clampSafeInteger(PROGRESSION.winsToUnlockNextDifficulty, {
    fallback: 1,
    minimum: 1,
  });
  const wins = validDifficulty
    ? clampSafeInteger(state.difficultyWinCounts[difficultyId], {
        fallback: 0,
        maximum: requiredWins,
      })
    : 0;
  return {
    wins,
    requiredWins,
    remainingWins: Math.max(0, requiredWins - wins),
    completed: wins >= requiredWins,
    currentBattleNumber: saturatingAdd(wins, 1, requiredWins),
  };
}

export function getBattleDifficulty(
  difficulty: DifficultyConfig,
  completedWins: number,
): DifficultyConfig {
  const maximumStageWins = Math.max(
    0,
    clampSafeInteger(PROGRESSION.winsToUnlockNextDifficulty, { fallback: 1 }) - 1,
  );
  const stageWins = clampSafeInteger(completedWins, {
    fallback: 0,
    maximum: maximumStageWins,
  });
  const extraEnemies = Math.min(
    BATTLE_STAGE_RULES.maximumExtraEnemies,
    Math.floor(stageWins / BATTLE_STAGE_RULES.extraEnemyEveryWins)
      * BATTLE_STAGE_RULES.extraEnemiesPerStep,
  );
  const enemyDiscBonus = Math.floor(
    stageWins / BATTLE_STAGE_RULES.enemyDiscLevelEveryWins,
  );
  const baselineDifficulty = DIFFICULTIES[0];
  return {
    ...difficulty,
    enemyCount: saturatingAdd(difficulty.enemyCount, extraEnemies),
    hpMultiplier: clampFiniteNumber(
      difficulty.hpMultiplier
        + baselineDifficulty.hpMultiplier * stageWins * BATTLE_STAGE_RULES.hpMultiplierPerWin,
    ),
    attackMultiplier: clampFiniteNumber(
      difficulty.attackMultiplier
        + baselineDifficulty.attackMultiplier
          * stageWins
          * BATTLE_STAGE_RULES.attackMultiplierPerWin,
    ),
    moveSpeed: clampFiniteNumber(
      difficulty.moveSpeed
        + baselineDifficulty.moveSpeed
          * stageWins
          * BATTLE_STAGE_RULES.moveSpeedMultiplierPerWin,
    ),
    enemyDiscLevel: Math.min(
      ENEMY_DISCS.length,
      saturatingAdd(difficulty.enemyDiscLevel, enemyDiscBonus),
    ),
  };
}
