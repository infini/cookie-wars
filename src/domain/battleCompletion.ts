import { BATTLE_REWARDS, DIFFICULTIES, PROGRESSION } from '../config';
import { BattleRewardResult, GameState } from '../types/game';
import { getBattleStageId, getDifficultyProgress } from './gameSelectors';
import { clampSafeInteger, saturatingAdd } from './safeNumbers';

export interface BattleCompletionTransition {
  state: GameState;
  result: BattleRewardResult;
}

function appendUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

function unchangedBattleResult(
  state: GameState,
  difficultyId: string,
): BattleCompletionTransition {
  const progress = getDifficultyProgress(state, difficultyId);
  return {
    state,
    result: {
      firstClear: false,
      giantDiscReward: 0,
      battleMedalReward: 0,
      totalBattleMedals: clampSafeInteger(state.battleMedals),
      stageNumber: progress.currentBattleNumber,
      difficultyWins: progress.wins,
      winsRequired: progress.requiredWins,
      unlockedNextDifficulty: false,
    },
  };
}

/**
 * 전투 승리 한 건의 저장 상태와 UI 표시 결과를 함께 계산한다.
 *
 * Context의 즉시 반환 결과와 reducer의 영구 상태가 어긋나지 않도록
 * 전투 보상·진행·해금 규칙은 이 순수 전이에서만 관리한다.
 */
export function completeBattleTransition(
  state: GameState,
  difficultyId: string,
): BattleCompletionTransition {
  const difficultyIndex = DIFFICULTIES.findIndex(
    (difficulty) => difficulty.id === difficultyId,
  );
  if (difficultyIndex < 0 || difficultyIndex > state.highestUnlockedDifficultyIndex) {
    return unchangedBattleResult(state, difficultyId);
  }

  const difficulty = DIFFICULTIES[difficultyIndex];
  const progress = getDifficultyProgress(state, difficulty.id);
  const stageNumber = progress.currentBattleNumber;
  const stageId = getBattleStageId(difficulty.id, stageNumber);
  const difficultyWins = saturatingAdd(
    progress.wins,
    1,
    progress.requiredWins,
  );
  const advancedStage = difficultyWins > progress.wins;
  const firstClear = advancedStage
    && !state.rewardClaimedStageIds.includes(stageId);
  const reachedUnlockRequirement = difficultyWins >= progress.requiredWins;
  const unlockedNextDifficulty = difficultyIndex < DIFFICULTIES.length - 1
    && progress.wins < progress.requiredWins
    && reachedUnlockRequirement;
  const giantDiscReward = firstClear
    ? PROGRESSION.giantDiscRewardPerFirstClear
    : 0;
  const battleMedalReward = advancedStage
    ? BATTLE_REWARDS.battleMedalsPerStageClear
    : 0;
  const totalBattleMedals = saturatingAdd(
    state.battleMedals,
    battleMedalReward,
  );

  return {
    state: {
      ...state,
      giantDiscCount: saturatingAdd(state.giantDiscCount, giantDiscReward),
      battleMedals: totalBattleMedals,
      difficultyWinCounts: {
        ...state.difficultyWinCounts,
        [difficulty.id]: difficultyWins,
      },
      clearedDifficultyIds: appendUnique(state.clearedDifficultyIds, difficulty.id),
      rewardClaimedStageIds: appendUnique(state.rewardClaimedStageIds, stageId),
      highestUnlockedDifficultyIndex: reachedUnlockRequirement
        ? Math.max(
            state.highestUnlockedDifficultyIndex,
            Math.min(DIFFICULTIES.length - 1, difficultyIndex + 1),
          )
        : state.highestUnlockedDifficultyIndex,
    },
    result: {
      firstClear,
      giantDiscReward,
      battleMedalReward,
      totalBattleMedals,
      stageNumber,
      difficultyWins,
      winsRequired: progress.requiredWins,
      unlockedNextDifficulty,
    },
  };
}
