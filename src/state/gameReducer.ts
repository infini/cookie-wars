import { COOKIE_UPGRADES, DIFFICULTIES, DISC, PRIMARY_BOT } from '../config';
import { GameState } from '../types/game';

export type GameAction =
  | { type: 'HYDRATE'; payload: Partial<GameState> }
  | { type: 'GAIN_COOKIES'; amount: number }
  | { type: 'BUY_UPGRADE'; upgradeId: string; cost: number; nextLevel: number }
  | { type: 'BUY_DISC' }
  | { type: 'UPGRADE_DISC'; cost: number; nextLevel: number }
  | { type: 'BUY_BOT'; botId: string; cost: number }
  | { type: 'SET_DIFFICULTY'; difficultyId: string }
  | { type: 'DISCOVER_MONSTER'; monsterId: string }
  | { type: 'ACKNOWLEDGE_MONSTERS' }
  | { type: 'COMPLETE_BATTLE'; difficultyId: string; reward: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_VIBRATION' };

const initialUpgradeLevels = Object.fromEntries(
  COOKIE_UPGRADES.map((upgrade) => [upgrade.id, upgrade.levels[0].level]),
);

export const initialGameState: GameState = {
  saveVersion: 1,
  cookies: 0,
  lifetimeCookies: 0,
  upgradeLevels: initialUpgradeLevels,
  discOwned: false,
  discLevel: DISC.levels[0].level,
  botCounts: { [PRIMARY_BOT.id]: 0 },
  selectedDifficultyId: DIFFICULTIES[0].id,
  highestUnlockedDifficultyIndex: 0,
  clearedDifficultyIds: [],
  rewardClaimedDifficultyIds: [],
  discoveredMonsterIds: [],
  newMonsterIds: [],
  soundEnabled: true,
  vibrationEnabled: true,
  lastSavedAt: 0,
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function mergeSavedGame(saved: Partial<GameState>): GameState {
  return {
    ...initialGameState,
    ...saved,
    cookies: Math.max(0, Math.floor(saved.cookies ?? initialGameState.cookies)),
    upgradeLevels: { ...initialUpgradeLevels, ...(saved.upgradeLevels ?? {}) },
    botCounts: { ...initialGameState.botCounts, ...(saved.botCounts ?? {}) },
    clearedDifficultyIds: unique(saved.clearedDifficultyIds ?? []),
    rewardClaimedDifficultyIds: unique(saved.rewardClaimedDifficultyIds ?? []),
    discoveredMonsterIds: unique(saved.discoveredMonsterIds ?? []),
    newMonsterIds: unique(saved.newMonsterIds ?? []),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return mergeSavedGame(action.payload);
    case 'GAIN_COOKIES':
      return {
        ...state,
        cookies: state.cookies + action.amount,
        lifetimeCookies: state.lifetimeCookies + action.amount,
      };
    case 'BUY_UPGRADE':
      if (state.cookies < action.cost) return state;
      return {
        ...state,
        cookies: state.cookies - action.cost,
        upgradeLevels: {
          ...state.upgradeLevels,
          [action.upgradeId]: action.nextLevel,
        },
      };
    case 'BUY_DISC':
      if (state.discOwned || state.cookies < DISC.purchaseCost) return state;
      return { ...state, cookies: state.cookies - DISC.purchaseCost, discOwned: true };
    case 'UPGRADE_DISC':
      if (!state.discOwned || state.cookies < action.cost) return state;
      return {
        ...state,
        cookies: state.cookies - action.cost,
        discLevel: action.nextLevel,
      };
    case 'BUY_BOT':
      if (state.cookies < action.cost) return state;
      return {
        ...state,
        cookies: state.cookies - action.cost,
        botCounts: {
          ...state.botCounts,
          [action.botId]: (state.botCounts[action.botId] ?? 0) + 1,
        },
      };
    case 'SET_DIFFICULTY':
      return { ...state, selectedDifficultyId: action.difficultyId };
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
      const firstReward = !state.rewardClaimedDifficultyIds.includes(action.difficultyId);
      return {
        ...state,
        cookies: state.cookies + (firstReward ? action.reward : 0),
        lifetimeCookies: state.lifetimeCookies + (firstReward ? action.reward : 0),
        clearedDifficultyIds: unique([...state.clearedDifficultyIds, action.difficultyId]),
        rewardClaimedDifficultyIds: unique([
          ...state.rewardClaimedDifficultyIds,
          action.difficultyId,
        ]),
        highestUnlockedDifficultyIndex: Math.max(
          state.highestUnlockedDifficultyIndex,
          Math.min(DIFFICULTIES.length - 1, difficultyIndex + 1),
        ),
      };
    }
    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };
    case 'TOGGLE_VIBRATION':
      return { ...state, vibrationEnabled: !state.vibrationEnabled };
    default:
      return state;
  }
}
