import { DIFFICULTIES } from '../config';
import { completeBattleTransition } from '../domain/battleCompletion';
import {
  getBotOffer,
  getDiscProgress,
  getUpgradeProgress,
} from '../domain/gameSelectors';
import {
  clampSafeInteger,
  saturatingAdd,
  saturatingSubtract,
} from '../domain/safeNumbers';
import { GameState, SoundVolumeLevel } from '../types/game';
import { normalizeSoundVolumeLevel, restoreSavedGame } from './gameSave';

export { initialGameState } from './gameInitialState';
export { mergeSavedGame, prepareSavedGame, restoreSavedGame } from './gameSave';

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

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function consumeGiantDiscInventory(state: GameState): GameState | null {
  const current = clampSafeInteger(state.giantDiscCount);
  if (current <= 0) return null;
  return { ...state, giantDiscCount: saturatingSubtract(current, 1) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return restoreSavedGame(action.payload, action.now);
    case 'GAIN_COOKIES': {
      const amount = clampSafeInteger(action.amount);
      if (amount <= 0) return state;
      const currentCookies = clampSafeInteger(state.cookies);
      const currentLifetimeCookies = Math.max(
        currentCookies,
        clampSafeInteger(state.lifetimeCookies),
      );
      const cookies = saturatingAdd(currentCookies, amount);
      const lifetimeCookies = saturatingAdd(currentLifetimeCookies, amount);
      if (cookies === state.cookies && lifetimeCookies === state.lifetimeCookies) return state;
      return {
        ...state,
        cookies,
        lifetimeCookies,
      };
    }
    case 'BUY_UPGRADE': {
      const progress = getUpgradeProgress(state, action.upgradeId);
      if (!progress?.next || !progress.affordable) return state;
      return {
        ...state,
        cookies: saturatingSubtract(state.cookies, progress.next.cost),
        upgradeLevels: { ...state.upgradeLevels, [action.upgradeId]: progress.next.level },
      };
    }
    case 'BUY_DISC': {
      const progress = getDiscProgress(state, action.discId);
      if (!progress?.purchaseAffordable) return state;
      return {
        ...state,
        cookies: saturatingSubtract(state.cookies, progress.purchaseCost),
        ownedDiscIds: unique([...state.ownedDiscIds, progress.config.id]),
        selectedDiscId: progress.config.id,
      };
    }
    case 'UPGRADE_DISC': {
      const progress = getDiscProgress(state, action.discId);
      if (!progress?.next || !progress.upgradeAffordable) return state;
      return {
        ...state,
        cookies: saturatingSubtract(state.cookies, progress.next.cost),
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
        cookies: saturatingSubtract(state.cookies, offer.price),
        botCounts: {
          ...state.botCounts,
          [action.botId]: saturatingAdd(offer.count, 1),
        },
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
    case 'COMPLETE_BATTLE':
      return completeBattleTransition(state, action.difficultyId).state;
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
