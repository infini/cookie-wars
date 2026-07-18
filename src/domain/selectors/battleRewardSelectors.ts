import { BATTLE_REWARDS } from '../../config';
import { GameState } from '../../types/game';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingProductInteger,
} from '../safeNumbers';

export interface BattleMedalBonusPercents {
  battleMedals: number;
  clickPowerBonusPercent: number;
  autoProductionBonusPercent: number;
  castleHealthBonusPercent: number;
}

export interface BattleMedalBonuses extends BattleMedalBonusPercents {
  clickPowerMultiplier: number;
  autoProductionMultiplier: number;
  castleHealthMultiplier: number;
}

function bonusPercent(medals: number, percentPerMedal: number): number {
  return saturatingProductInteger(medals, percentPerMedal);
}

function percentMultiplier(percent: number): number {
  return clampFiniteNumber(1 + percent / 100, { minimum: 1 });
}

export function calculateBattleMedalBonusPercents(
  medalCount: unknown,
): BattleMedalBonusPercents {
  const battleMedals = clampSafeInteger(medalCount);
  const clickPowerBonusPercent = bonusPercent(
    battleMedals,
    BATTLE_REWARDS.clickPowerBonusPercentPerMedal,
  );
  const autoProductionBonusPercent = bonusPercent(
    battleMedals,
    BATTLE_REWARDS.autoProductionBonusPercentPerMedal,
  );
  const castleHealthBonusPercent = bonusPercent(
    battleMedals,
    BATTLE_REWARDS.castleHealthBonusPercentPerMedal,
  );
  return {
    battleMedals,
    clickPowerBonusPercent,
    autoProductionBonusPercent,
    castleHealthBonusPercent,
  };
}

export function getBattleMedalBonuses(state: GameState): BattleMedalBonuses {
  const percentages = calculateBattleMedalBonusPercents(state.battleMedals);
  return {
    ...percentages,
    clickPowerMultiplier: percentMultiplier(percentages.clickPowerBonusPercent),
    autoProductionMultiplier: percentMultiplier(percentages.autoProductionBonusPercent),
    castleHealthMultiplier: percentMultiplier(percentages.castleHealthBonusPercent),
  };
}
