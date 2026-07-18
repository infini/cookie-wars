import { BATTLE_RULES } from '../config';
import { clampSafeInteger } from './safeNumbers';

export function normalizeBattleSpeedMultiplier(speed: unknown): number {
  const requested = clampSafeInteger(speed, {
    fallback: BATTLE_RULES.defaultBattleSpeedMultiplier,
  });
  return BATTLE_RULES.battleSpeedMultipliers.includes(requested)
    ? requested
    : BATTLE_RULES.defaultBattleSpeedMultiplier;
}

export function getNextBattleSpeedMultiplier(speed: unknown): number {
  const current = normalizeBattleSpeedMultiplier(speed);
  const currentIndex = BATTLE_RULES.battleSpeedMultipliers.indexOf(current);
  return BATTLE_RULES.battleSpeedMultipliers[
    (currentIndex + 1) % BATTLE_RULES.battleSpeedMultipliers.length
  ];
}
