import { PROGRESSION } from '../config';
import { calculateCookieStats } from './gameSelectors';
import { GameState } from '../types/game';

export interface OfflineProductionResult {
  elapsedMs: number;
  completedIntervals: number;
  cookiesEarned: number;
}

const EMPTY_OFFLINE_PRODUCTION: OfflineProductionResult = {
  elapsedMs: 0,
  completedIntervals: 0,
  cookiesEarned: 0,
};

export function calculateProductionForElapsedTime(
  autoProduction: number,
  elapsedMs: number,
): OfflineProductionResult {
  if (
    !Number.isFinite(autoProduction)
    || autoProduction <= 0
    || !Number.isFinite(elapsedMs)
    || elapsedMs <= 0
    || PROGRESSION.autoProductionIntervalMs <= 0
  ) return EMPTY_OFFLINE_PRODUCTION;
  const completedIntervals = Math.floor(
    elapsedMs / PROGRESSION.autoProductionIntervalMs,
  );
  const calculatedCookies = Math.floor(autoProduction * completedIntervals);
  return {
    elapsedMs,
    completedIntervals,
    cookiesEarned: Number.isFinite(calculatedCookies)
      ? Math.min(Number.MAX_SAFE_INTEGER, calculatedCookies)
      : Number.MAX_SAFE_INTEGER,
  };
}

export function calculateOfflineProduction(
  state: GameState,
  now: number,
): OfflineProductionResult {
  if (
    !Number.isFinite(now)
    || !Number.isFinite(state.lastSavedAt)
    || state.lastSavedAt <= 0
    || now <= state.lastSavedAt
  ) return EMPTY_OFFLINE_PRODUCTION;
  return calculateProductionForElapsedTime(
    calculateCookieStats(state).autoProduction,
    now - state.lastSavedAt,
  );
}

export function settleOfflineProduction(state: GameState, now: number): GameState {
  const settlement = calculateOfflineProduction(state, now);
  const nextSavedAt = Number.isFinite(now)
    ? Math.max(state.lastSavedAt, Math.max(0, Math.floor(now)))
    : state.lastSavedAt;
  return {
    ...state,
    cookies: Math.min(Number.MAX_SAFE_INTEGER, state.cookies + settlement.cookiesEarned),
    lifetimeCookies: Math.min(
      Number.MAX_SAFE_INTEGER,
      state.lifetimeCookies + settlement.cookiesEarned,
    ),
    lastSavedAt: nextSavedAt,
  };
}
