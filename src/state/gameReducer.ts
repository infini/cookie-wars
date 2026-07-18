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
import {
  getBotOffer,
  getBattleStageId,
  getDiscProgress,
  getUpgradeProgress,
  makeInitialBotCounts,
  makeInitialDiscLevels,
  makeInitialUpgradeLevels,
} from '../domain/gameSelectors';
import { settleOfflineProduction } from '../domain/offlineProduction';
import { GameState, SoundVolumeLevel } from '../types/game';

export type GameAction =
  | { type: 'HYDRATE'; payload: Partial<GameState>; now: number }
  | { type: 'GAIN_COOKIES'; amount: number }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'BUY_DISC'; discId: string }
  | { type: 'UPGRADE_DISC'; discId: string }
  | { type: 'EQUIP_DISC'; discId: string }
  | { type: 'BUY_BOT'; botId: string }
  | { type: 'SET_DIFFICULTY'; difficultyId: string }
  | { type: 'DISCOVER_MONSTER'; monsterId: string }
  | { type: 'ACKNOWLEDGE_MONSTERS' }
  | { type: 'COMPLETE_BATTLE'; difficultyId: string }
  | { type: 'USE_GIANT_DISC' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SET_SOUND_VOLUME'; level: SoundVolumeLevel }
  | { type: 'TOGGLE_VIBRATION' };

const initialUpgradeLevels = makeInitialUpgradeLevels();
const initialBotCounts = makeInitialBotCounts();
const initialDiscLevels = makeInitialDiscLevels();
const initialDifficultyWinCounts = Object.fromEntries(
  DIFFICULTIES.map((difficulty) => [difficulty.id, 0]),
);

export const initialGameState: GameState = {
  saveVersion: 7,
  cookies: 0,
  lifetimeCookies: 0,
  upgradeLevels: initialUpgradeLevels,
  ownedDiscIds: [],
  discLevels: initialDiscLevels,
  selectedDiscId: DISCS[0].id,
  botCounts: initialBotCounts,
  selectedDifficultyId: DIFFICULTIES[0].id,
  highestUnlockedDifficultyIndex: 0,
  difficultyWinCounts: initialDifficultyWinCounts,
  clearedDifficultyIds: [],
  rewardClaimedStageIds: [],
  giantDiscCount: 0,
  discoveredMonsterIds: [],
  newMonsterIds: [],
  soundEnabled: true,
  soundVolumeLevel: AUDIO_SETTINGS.defaultLevel,
  vibrationEnabled: true,
  lastSavedAt: 0,
};

interface LegacyDiscSave {
  discOwned?: boolean;
  discLevel?: number;
  autoBattleEnabled?: boolean;
  rewardClaimedDifficultyIds?: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeSoundVolumeLevel(level?: number): SoundVolumeLevel {
  const requested = Math.round(level ?? AUDIO_SETTINGS.defaultLevel);
  return AUDIO_SETTINGS.levels.find((item) => item.level === requested)?.level
    ?? AUDIO_SETTINGS.defaultLevel;
}

function normalizeDifficultyWins(saved: Partial<GameState>): Record<string, number> {
  const counts = { ...initialDifficultyWinCounts };
  for (const difficulty of DIFFICULTIES) {
    const savedCount = saved.difficultyWinCounts?.[difficulty.id];
    const migratedCount = saved.clearedDifficultyIds?.includes(difficulty.id) ? 1 : 0;
    counts[difficulty.id] = Math.max(0, Math.floor(savedCount ?? migratedCount));
  }
  return counts;
}

function normalizeUpgradeLevels(savedLevels?: Record<string, number>): Record<string, number> {
  return Object.fromEntries(COOKIE_UPGRADES.map((upgrade) => {
    const savedLevel = savedLevels?.[upgrade.id];
    const valid = upgrade.levels.some((level) => level.level === savedLevel)
      || (
        COOKIE_UPGRADE_RULES[upgrade.id] !== undefined
        && savedLevel !== undefined
        && savedLevel >= upgrade.levels[0].level
      );
    return [upgrade.id, valid ? savedLevel ?? upgrade.levels[0].level : upgrade.levels[0].level];
  }));
}

function normalizeBotCounts(savedCounts?: Record<string, number>): Record<string, number> {
  const counts = Object.fromEntries(BOTS.map((bot) => [
    bot.id,
    Math.max(0, Math.floor(savedCounts?.[bot.id] ?? 0)),
  ]));
  for (const [legacyId, currentId] of Object.entries(SAVE_MIGRATIONS.botIdAliases)) {
    if (counts[currentId] === undefined) continue;
    counts[currentId] += Math.max(0, Math.floor(savedCounts?.[legacyId] ?? 0));
  }
  return counts;
}

function normalizeMonsterIds(savedIds?: string[]): string[] {
  const knownIds = new Set(MONSTERS.map((monster) => monster.id));
  return unique((savedIds ?? []).flatMap((id) => {
    const currentId = SAVE_MIGRATIONS.monsterIdAliases[id] ?? id;
    return knownIds.has(currentId) ? [currentId] : [];
  }));
}

function normalizeRewardStageIds(
  savedStageIds: string[] | undefined,
  legacyDifficultyIds: string[] | undefined,
): string[] {
  const validDifficultyIds = new Set(DIFFICULTIES.map((difficulty) => difficulty.id));
  const migratedLegacyIds = (legacyDifficultyIds ?? [])
    .filter((difficultyId) => validDifficultyIds.has(difficultyId))
    .map((difficultyId) => getBattleStageId(difficultyId, 1));
  return unique([...(savedStageIds ?? []), ...migratedLegacyIds]).filter((stageId) => {
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
    if (levels[currentId] === undefined || !Number.isFinite(savedLevel)) continue;
    levels[currentId] = Math.max(levels[currentId], Math.floor(savedLevel));
  }
  if (legacyDiscLevel !== undefined && Number.isFinite(legacyDiscLevel)) {
    const firstDiscId = DISCS[0].id;
    levels[firstDiscId] = Math.max(levels[firstDiscId], Math.floor(legacyDiscLevel));
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
    autoBattleEnabled: _legacyAutoBattle,
    rewardClaimedDifficultyIds: legacyRewardClaimedDifficultyIds,
    ...currentSaved
  } = saved;
  const difficultyWinCounts = normalizeDifficultyWins(saved);
  const highestUnlockedDifficultyIndex = unlockedDifficultyIndex(difficultyWinCounts);
  const selectedIndex = DIFFICULTIES.findIndex(
    (difficulty) => difficulty.id === saved.selectedDifficultyId,
  );
  const selectedDifficultyId = selectedIndex >= 0 && selectedIndex <= highestUnlockedDifficultyIndex
    ? DIFFICULTIES[selectedIndex].id
    : DIFFICULTIES[highestUnlockedDifficultyIndex].id;
  const knownDiscIds = new Set(DISCS.map((disc) => disc.id));
  const ownedDiscIds = unique(
    saved.ownedDiscIds?.map((id) => SAVE_MIGRATIONS.discIdAliases[id] ?? id)
      .filter((id) => knownDiscIds.has(id))
      ?? (saved.discOwned ? [DISCS[0].id] : []),
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

  return {
    ...initialGameState,
    ...currentSaved,
    saveVersion: initialGameState.saveVersion,
    cookies: Math.max(0, Math.floor(saved.cookies ?? initialGameState.cookies)),
    lifetimeCookies: Math.max(
      0,
      Math.floor(saved.lifetimeCookies ?? initialGameState.lifetimeCookies),
    ),
    upgradeLevels: normalizeUpgradeLevels(saved.upgradeLevels),
    botCounts: normalizeBotCounts(saved.botCounts),
    ownedDiscIds,
    discLevels,
    selectedDiscId,
    selectedDifficultyId,
    highestUnlockedDifficultyIndex,
    difficultyWinCounts,
    clearedDifficultyIds: unique(saved.clearedDifficultyIds ?? []),
    rewardClaimedStageIds,
    giantDiscCount: Math.max(0, Math.floor(saved.giantDiscCount ?? 0)),
    discoveredMonsterIds,
    newMonsterIds,
    soundVolumeLevel: normalizeSoundVolumeLevel(saved.soundVolumeLevel),
    lastSavedAt: Number.isFinite(saved.lastSavedAt)
      ? Math.max(0, Math.floor(saved.lastSavedAt ?? 0))
      : 0,
  };
}

export function restoreSavedGame(saved: Partial<GameState>, now: number): GameState {
  return settleOfflineProduction(mergeSavedGame(saved), now);
}

export function consumeGiantDiscInventory(state: GameState): GameState | null {
  if (state.giantDiscCount <= 0) return null;
  return { ...state, giantDiscCount: state.giantDiscCount - 1 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return restoreSavedGame(action.payload, action.now);
    case 'GAIN_COOKIES':
      return {
        ...state,
        cookies: state.cookies + action.amount,
        lifetimeCookies: state.lifetimeCookies + action.amount,
      };
    case 'BUY_UPGRADE': {
      const progress = getUpgradeProgress(state, action.upgradeId);
      if (!progress?.next || !progress.affordable) return state;
      return {
        ...state,
        cookies: state.cookies - progress.next.cost,
        upgradeLevels: { ...state.upgradeLevels, [action.upgradeId]: progress.next.level },
      };
    }
    case 'BUY_DISC': {
      const progress = getDiscProgress(state, action.discId);
      if (!progress.purchaseAffordable) return state;
      return {
        ...state,
        cookies: state.cookies - progress.purchaseCost,
        ownedDiscIds: unique([...state.ownedDiscIds, progress.config.id]),
        selectedDiscId: progress.config.id,
      };
    }
    case 'UPGRADE_DISC': {
      const progress = getDiscProgress(state, action.discId);
      if (!progress.upgradeAffordable) return state;
      return {
        ...state,
        cookies: state.cookies - progress.next.cost,
        discLevels: { ...state.discLevels, [progress.config.id]: progress.next.level },
      };
    }
    case 'EQUIP_DISC':
      if (!state.ownedDiscIds.includes(action.discId)) return state;
      return { ...state, selectedDiscId: action.discId };
    case 'BUY_BOT': {
      const offer = getBotOffer(state, action.botId);
      if (!offer?.affordable) return state;
      return {
        ...state,
        cookies: state.cookies - offer.price,
        botCounts: { ...state.botCounts, [action.botId]: offer.count + 1 },
      };
    }
    case 'SET_DIFFICULTY': {
      const index = DIFFICULTIES.findIndex((difficulty) => difficulty.id === action.difficultyId);
      if (index < 0 || index > state.highestUnlockedDifficultyIndex) return state;
      return { ...state, selectedDifficultyId: action.difficultyId };
    }
    case 'DISCOVER_MONSTER':
      if (state.discoveredMonsterIds.includes(action.monsterId)) return state;
      return {
        ...state,
        discoveredMonsterIds: [...state.discoveredMonsterIds, action.monsterId],
        newMonsterIds: [...state.newMonsterIds, action.monsterId],
      };
    case 'ACKNOWLEDGE_MONSTERS':
      return { ...state, newMonsterIds: [] };
    case 'COMPLETE_BATTLE': {
      const difficultyIndex = DIFFICULTIES.findIndex(
        (difficulty) => difficulty.id === action.difficultyId,
      );
      if (difficultyIndex < 0 || difficultyIndex > state.highestUnlockedDifficultyIndex) return state;
      const difficulty = DIFFICULTIES[difficultyIndex];
      const previousWins = Math.min(
        PROGRESSION.winsToUnlockNextDifficulty,
        state.difficultyWinCounts[difficulty.id] ?? 0,
      );
      const stageNumber = Math.min(
        previousWins + 1,
        PROGRESSION.winsToUnlockNextDifficulty,
      );
      const stageId = getBattleStageId(difficulty.id, stageNumber);
      const firstReward = !state.rewardClaimedStageIds.includes(stageId);
      const wins = Math.min(
        PROGRESSION.winsToUnlockNextDifficulty,
        previousWins + 1,
      );
      const unlockNext = wins >= PROGRESSION.winsToUnlockNextDifficulty;
      return {
        ...state,
        giantDiscCount: state.giantDiscCount
          + (firstReward ? PROGRESSION.giantDiscRewardPerFirstClear : 0),
        difficultyWinCounts: { ...state.difficultyWinCounts, [difficulty.id]: wins },
        clearedDifficultyIds: unique([...state.clearedDifficultyIds, difficulty.id]),
        rewardClaimedStageIds: unique([...state.rewardClaimedStageIds, stageId]),
        highestUnlockedDifficultyIndex: unlockNext
          ? Math.max(
              state.highestUnlockedDifficultyIndex,
              Math.min(DIFFICULTIES.length - 1, difficultyIndex + 1),
            )
          : state.highestUnlockedDifficultyIndex,
      };
    }
    case 'USE_GIANT_DISC':
      return consumeGiantDiscInventory(state) ?? state;
    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };
    case 'SET_SOUND_VOLUME':
      return { ...state, soundVolumeLevel: normalizeSoundVolumeLevel(action.level) };
    case 'TOGGLE_VIBRATION':
      return { ...state, vibrationEnabled: !state.vibrationEnabled };
    default:
      return state;
  }
}
