import {
  AUDIO_SETTINGS,
  BOTS,
  COOKIE_UPGRADE_RULES,
  COOKIE_UPGRADES,
  DIFFICULTIES,
  DISCS,
  MONSTERS,
  PROGRESSION,
  SAVE_MIGRATIONS,
} from '../config';
import { getBattleStageId } from '../domain/gameSelectors';
import { normalizeBattleSpeedMultiplier } from '../domain/battleSpeedSettings';
import { settleOfflineProduction } from '../domain/offlineProduction';
import {
  clampSafeInteger,
  MAX_GAME_INTEGER,
  saturatingAdd,
} from '../domain/safeNumbers';
import { GameState, SoundVolumeLevel } from '../types/game';
import { initialGameState } from './gameInitialState';
import { resolveCookieEvolutionBonusLevels } from './saveMigrations/cookieEvolutionMigration';
import { resolveBattleMedals } from './saveMigrations/battleMedalMigration';
import { isFutureSaveVersion } from './saveMigrations/saveVersion';

interface LegacyDiscSave {
  discOwned?: boolean;
  discLevel?: number;
  rewardClaimedDifficultyIds?: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function storedStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

interface StoredIntegerPolicy {
  fallback: number;
  minimum?: number;
  maximum?: number;
}

function normalizeStoredInteger(
  value: unknown,
  {
    fallback,
    minimum = 0,
    maximum = MAX_GAME_INTEGER,
  }: StoredIntegerPolicy,
): number {
  return clampSafeInteger(value, { fallback, minimum, maximum });
}

function normalizeStoredBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeSoundVolumeLevel(level?: number): SoundVolumeLevel {
  const requested = normalizeStoredInteger(level, {
    fallback: AUDIO_SETTINGS.defaultLevel,
    minimum: 1,
    maximum: 5,
  });
  return AUDIO_SETTINGS.levels.find((item) => item.level === requested)?.level
    ?? AUDIO_SETTINGS.defaultLevel;
}

function normalizeDifficultyWins(saved: Partial<GameState>): Record<string, number> {
  const counts = Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty.id, 0]));
  const legacyClearedIds = storedStringArray(saved.clearedDifficultyIds);
  for (const difficulty of DIFFICULTIES) {
    const savedCount = saved.difficultyWinCounts?.[difficulty.id];
    const migratedCount = legacyClearedIds.includes(difficulty.id) ? 1 : 0;
    counts[difficulty.id] = normalizeStoredInteger(savedCount, {
      fallback: migratedCount,
      maximum: PROGRESSION.winsToUnlockNextDifficulty,
    });
  }
  return counts;
}

function normalizeUpgradeLevels(savedLevels?: Record<string, number>): Record<string, number> {
  return Object.fromEntries(COOKIE_UPGRADES.map((upgrade) => {
    const initialLevel = upgrade.levels[0].level;
    const savedLevel = normalizeStoredInteger(savedLevels?.[upgrade.id], {
      fallback: initialLevel,
      minimum: initialLevel,
    });
    const valid = COOKIE_UPGRADE_RULES[upgrade.id] !== undefined
      || upgrade.levels.some((level) => level.level === savedLevel);
    return [upgrade.id, valid ? savedLevel : initialLevel];
  }));
}

function normalizeBotCounts(savedCounts?: Record<string, number>): Record<string, number> {
  const counts = Object.fromEntries(BOTS.map((bot) => [
    bot.id,
    normalizeStoredInteger(savedCounts?.[bot.id], { fallback: 0 }),
  ]));
  for (const [legacyId, currentId] of Object.entries(SAVE_MIGRATIONS.botIdAliases)) {
    if (counts[currentId] === undefined) continue;
    const legacyCount = normalizeStoredInteger(savedCounts?.[legacyId], { fallback: 0 });
    counts[currentId] = saturatingAdd(counts[currentId], legacyCount);
  }
  return counts;
}

function normalizeMonsterIds(savedIds?: string[]): string[] {
  const knownIds = new Set(MONSTERS.map((monster) => monster.id));
  return unique(storedStringArray(savedIds).flatMap((id) => {
    const currentId = SAVE_MIGRATIONS.monsterIdAliases[id] ?? id;
    return knownIds.has(currentId) ? [currentId] : [];
  }));
}

function normalizeRewardStageIds(
  savedStageIds: string[] | undefined,
  legacyDifficultyIds: string[] | undefined,
): string[] {
  const validDifficultyIds = new Set(DIFFICULTIES.map((difficulty) => difficulty.id));
  const migratedLegacyIds = storedStringArray(legacyDifficultyIds)
    .filter((difficultyId) => validDifficultyIds.has(difficultyId))
    .map((difficultyId) => getBattleStageId(difficultyId, 1));
  return unique([...storedStringArray(savedStageIds), ...migratedLegacyIds]).filter((stageId) => {
    const separatorIndex = stageId.lastIndexOf(':');
    const difficultyId = stageId.slice(0, separatorIndex);
    const stageNumber = Number(stageId.slice(separatorIndex + 1));
    return validDifficultyIds.has(difficultyId)
      && Number.isInteger(stageNumber)
      && stageNumber >= 1
      && stageNumber <= PROGRESSION.winsToUnlockNextDifficulty;
  });
}

function normalizeDiscLevels(
  savedLevels: Record<string, number> | undefined,
  legacyDiscLevel: number | undefined,
): Record<string, number> {
  const levels = Object.fromEntries(DISCS.map((disc) => [disc.id, disc.levels[0].level]));
  for (const [savedId, savedLevel] of Object.entries(savedLevels ?? {})) {
    const currentId = SAVE_MIGRATIONS.discIdAliases[savedId] ?? savedId;
    if (levels[currentId] === undefined) continue;
    const normalizedLevel = normalizeStoredInteger(savedLevel, {
      fallback: levels[currentId],
      minimum: levels[currentId],
    });
    levels[currentId] = Math.max(levels[currentId], normalizedLevel);
  }
  if (legacyDiscLevel !== undefined) {
    const firstDiscId = DISCS[0].id;
    const normalizedLegacyLevel = normalizeStoredInteger(legacyDiscLevel, {
      fallback: levels[firstDiscId],
      minimum: levels[firstDiscId],
    });
    levels[firstDiscId] = Math.max(levels[firstDiscId], normalizedLegacyLevel);
  }
  return levels;
}

function unlockedDifficultyIndex(winCounts: Record<string, number>): number {
  let unlockedIndex = 0;
  for (let index = 0; index < DIFFICULTIES.length - 1; index += 1) {
    if ((winCounts[DIFFICULTIES[index].id] ?? 0) < PROGRESSION.winsToUnlockNextDifficulty) {
      break;
    }
    unlockedIndex = index + 1;
  }
  return unlockedIndex;
}

export function mergeSavedGame(saved: Partial<GameState> & LegacyDiscSave): GameState {
  const {
    discOwned: _legacyDiscOwned,
    discLevel: _legacyDiscLevel,
    rewardClaimedDifficultyIds: legacyRewardClaimedDifficultyIds,
    ...currentSaved
  } = saved;
  const difficultyWinCounts = normalizeDifficultyWins(saved);
  const battleMedals = resolveBattleMedals({
    savedVersion: saved.saveVersion,
    savedBattleMedals: saved.battleMedals,
    normalizedDifficultyWinCounts: difficultyWinCounts,
  });
  const highestUnlockedDifficultyIndex = unlockedDifficultyIndex(difficultyWinCounts);
  const selectedIndex = DIFFICULTIES.findIndex(
    (difficulty) => difficulty.id === saved.selectedDifficultyId,
  );
  const selectedDifficultyId = selectedIndex >= 0 && selectedIndex <= highestUnlockedDifficultyIndex
    ? DIFFICULTIES[selectedIndex].id
    : DIFFICULTIES[highestUnlockedDifficultyIndex].id;
  const knownDiscIds = new Set(DISCS.map((disc) => disc.id));
  const ownedDiscIds = unique(
    storedStringArray(saved.ownedDiscIds).map((id) => SAVE_MIGRATIONS.discIdAliases[id] ?? id)
      .filter((id) => knownDiscIds.has(id))
      .concat(saved.ownedDiscIds === undefined && saved.discOwned ? [DISCS[0].id] : []),
  );
  const discLevels = normalizeDiscLevels(saved.discLevels, saved.discLevel);
  const migratedSelectedDiscId = saved.selectedDiscId
    ? SAVE_MIGRATIONS.discIdAliases[saved.selectedDiscId] ?? saved.selectedDiscId
    : undefined;
  const selectedDiscId = migratedSelectedDiscId
    && ownedDiscIds.includes(migratedSelectedDiscId)
    ? migratedSelectedDiscId
    : ownedDiscIds[0] ?? DISCS[0].id;
  const discoveredMonsterIds = normalizeMonsterIds(saved.discoveredMonsterIds);
  const newMonsterIds = normalizeMonsterIds(saved.newMonsterIds).filter((id) => (
    discoveredMonsterIds.includes(id)
  ));
  const rewardClaimedStageIds = normalizeRewardStageIds(
    saved.rewardClaimedStageIds,
    legacyRewardClaimedDifficultyIds,
  );
  const upgradeLevels = normalizeUpgradeLevels(saved.upgradeLevels);
  const legacyCookieEvolutionBonusLevels = resolveCookieEvolutionBonusLevels({
    savedVersion: saved.saveVersion,
    savedBonusLevels: saved.legacyCookieEvolutionBonusLevels,
    savedUpgradeLevels: saved.upgradeLevels,
  });
  const cookies = normalizeStoredInteger(saved.cookies, {
    fallback: initialGameState.cookies,
  });
  const lifetimeCookies = Math.max(
    cookies,
    normalizeStoredInteger(saved.lifetimeCookies, {
      fallback: initialGameState.lifetimeCookies,
    }),
  );
  const clearedDifficultyIds = DIFFICULTIES
    .filter((difficulty) => difficultyWinCounts[difficulty.id] > 0)
    .map((difficulty) => difficulty.id);

  return {
    ...initialGameState,
    ...currentSaved,
    saveVersion: initialGameState.saveVersion,
    cookies,
    lifetimeCookies,
    upgradeLevels,
    legacyCookieEvolutionBonusLevels,
    botCounts: normalizeBotCounts(saved.botCounts),
    ownedDiscIds,
    discLevels,
    selectedDiscId,
    selectedDifficultyId,
    highestUnlockedDifficultyIndex,
    difficultyWinCounts,
    clearedDifficultyIds,
    rewardClaimedStageIds,
    giantDiscCount: normalizeStoredInteger(saved.giantDiscCount, { fallback: 0 }),
    battleMedals,
    discoveredMonsterIds,
    newMonsterIds,
    soundEnabled: normalizeStoredBoolean(saved.soundEnabled, initialGameState.soundEnabled),
    soundVolumeLevel: normalizeSoundVolumeLevel(saved.soundVolumeLevel),
    vibrationEnabled: normalizeStoredBoolean(
      saved.vibrationEnabled,
      initialGameState.vibrationEnabled,
    ),
    battleSpeedMultiplier: normalizeBattleSpeedMultiplier(saved.battleSpeedMultiplier),
    autoBattleEnabled: normalizeStoredBoolean(
      saved.autoBattleEnabled,
      initialGameState.autoBattleEnabled,
    ),
    lastSavedAt: normalizeStoredInteger(saved.lastSavedAt, { fallback: 0 }),
  };
}

export function restoreSavedGame(saved: Partial<GameState>, now: number): GameState {
  return settleOfflineProduction(mergeSavedGame(saved), now);
}

export interface PreparedSavedGame {
  state: GameState;
  persistenceWritable: boolean;
}

/**
 * 더 최신 앱이 만든 저장은 현재 스키마로 덮어쓰지 않는다.
 *
 * 알려진 필드는 메모리에서만 정규화해 실행할 수 있게 하되 오프라인 생산을
 * 정산하거나 저장하지 않아, 사용자가 최신 앱으로 돌아왔을 때 원본을 보존한다.
 */
export function prepareSavedGame(
  saved: Partial<GameState>,
  now: number,
): PreparedSavedGame {
  const futureSaveVersion = isFutureSaveVersion(
    saved.saveVersion,
    initialGameState.saveVersion,
  );
  return futureSaveVersion
    ? { state: mergeSavedGame(saved), persistenceWritable: false }
    : { state: restoreSavedGame(saved, now), persistenceWritable: true };
}
