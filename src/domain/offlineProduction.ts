import { PROGRESSION } from '../config';
import { calculateCookieStats } from './gameSelectors';
import type { GameState } from '../types/game';
import {
  clampFiniteNumber,
  clampSafeInteger,
  MAX_GAME_INTEGER,
  saturatingProductInteger,
} from './safeNumbers';
import {
  addCookieAmounts,
  maxCookieAmount,
  normalizeCookieAmount,
} from './cookieAmounts';

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
  const safeCompletedIntervals = clampSafeInteger(completedIntervals);
  return {
    elapsedMs: clampFiniteNumber(elapsedMs),
    completedIntervals: safeCompletedIntervals,
    cookiesEarned: saturatingProductInteger(
      autoProduction,
      safeCompletedIntervals,
      'floor',
    ),
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
  const savedAt = clampSafeInteger(state.lastSavedAt);
  const validNow = Number.isFinite(now) && now >= 0
    ? clampSafeInteger(now)
    : undefined;
  const saturatedFutureCheckpoint = savedAt === MAX_GAME_INTEGER
    && validNow !== undefined
    && validNow < savedAt;
  const nextSavedAt = validNow === undefined
    ? savedAt
    : saturatedFutureCheckpoint
      ? validNow
      : Math.max(savedAt, validNow);
  const currentCookies = normalizeCookieAmount(state.cookies);
  const currentLifetimeCookies = maxCookieAmount(
    currentCookies,
    state.lifetimeCookies,
  );
  return {
    ...state,
    cookies: addCookieAmounts(currentCookies, settlement.cookiesEarned),
    lifetimeCookies: addCookieAmounts(currentLifetimeCookies, settlement.cookiesEarned),
    lastSavedAt: nextSavedAt,
  };
}
