import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { DIFFICULTIES, PROGRESSION, getDifficulty } from '../config';
import {
  calculateCookieStats,
  getBotOffer,
  getDifficultyProgress,
  getDiscProgress,
  getUpgradeProgress,
} from '../domain/gameSelectors';
import { loadGame, saveGame } from '../services/storage';
import {
  BattleRewardResult,
  CookieStats,
  GameState,
  SoundVolumeLevel,
} from '../types/game';
import { gameReducer, initialGameState } from './gameReducer';

interface GameContextValue {
  state: GameState;
  hydrated: boolean;
  stats: CookieStats;
  clickCookie: () => number;
  buyUpgrade: (upgradeId: string) => boolean;
  buyDisc: (discId: string) => boolean;
  upgradeDisc: (discId: string) => boolean;
  equipDisc: (discId: string) => boolean;
  buyBot: (botId: string) => boolean;
  setDifficulty: (difficultyId: string) => boolean;
  discoverMonster: (monsterId: string) => void;
  acknowledgeMonsters: () => void;
  completeBattle: (difficultyId: string) => BattleRewardResult;
  toggleSound: () => void;
  setSoundVolume: (level: SoundVolumeLevel) => void;
  toggleVibration: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let mounted = true;
    loadGame().then((saved) => {
      if (!mounted) return;
      if (saved) dispatch({ type: 'HYDRATE', payload: saved });
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => saveGame(state), PROGRESSION.saveDebounceMs);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const stats = useMemo(() => calculateCookieStats(state), [state]);

  useEffect(() => {
    if (!hydrated || stats.autoProduction <= 0) return;
    const timer = setInterval(() => {
      dispatch({ type: 'GAIN_COOKIES', amount: stats.autoProduction });
    }, PROGRESSION.autoProductionIntervalMs);
    return () => clearInterval(timer);
  }, [hydrated, stats.autoProduction]);

  const clickCookie = useCallback(() => {
    const amount = calculateCookieStats(stateRef.current).clickPower;
    dispatch({ type: 'GAIN_COOKIES', amount });
    return amount;
  }, []);

  const buyUpgrade = useCallback((upgradeId: string) => {
    const progress = getUpgradeProgress(stateRef.current, upgradeId);
    if (!progress?.affordable) return false;
    dispatch({ type: 'BUY_UPGRADE', upgradeId });
    return true;
  }, []);

  const buyDisc = useCallback((discId: string) => {
    if (!getDiscProgress(stateRef.current, discId).purchaseAffordable) return false;
    dispatch({ type: 'BUY_DISC', discId });
    return true;
  }, []);

  const upgradeDisc = useCallback((discId: string) => {
    if (!getDiscProgress(stateRef.current, discId).upgradeAffordable) return false;
    dispatch({ type: 'UPGRADE_DISC', discId });
    return true;
  }, []);

  const equipDisc = useCallback((discId: string) => {
    if (!stateRef.current.ownedDiscIds.includes(discId)) return false;
    dispatch({ type: 'EQUIP_DISC', discId });
    return true;
  }, []);

  const buyBot = useCallback((botId: string) => {
    if (!getBotOffer(stateRef.current, botId)?.affordable) return false;
    dispatch({ type: 'BUY_BOT', botId });
    return true;
  }, []);

  const setDifficulty = useCallback((difficultyId: string) => {
    const index = DIFFICULTIES.findIndex((difficulty) => difficulty.id === difficultyId);
    if (index < 0 || index > stateRef.current.highestUnlockedDifficultyIndex) return false;
    dispatch({ type: 'SET_DIFFICULTY', difficultyId });
    return true;
  }, []);

  const discoverMonster = useCallback((monsterId: string) => {
    dispatch({ type: 'DISCOVER_MONSTER', monsterId });
  }, []);

  const acknowledgeMonsters = useCallback(() => {
    dispatch({ type: 'ACKNOWLEDGE_MONSTERS' });
  }, []);

  const completeBattle = useCallback((difficultyId: string): BattleRewardResult => {
    const current = stateRef.current;
    const difficulty = getDifficulty(difficultyId);
    const difficultyIndex = DIFFICULTIES.findIndex((item) => item.id === difficultyId);
    const progress = getDifficultyProgress(current, difficultyId);
    const firstClear = !current.rewardClaimedDifficultyIds.includes(difficultyId);
    const difficultyWins = progress.wins + 1;
    const unlockedNextDifficulty = difficultyIndex < DIFFICULTIES.length - 1
      && progress.wins < progress.requiredWins
      && difficultyWins >= progress.requiredWins;
    dispatch({ type: 'COMPLETE_BATTLE', difficultyId });
    return {
      firstClear,
      reward: firstClear ? difficulty.reward : 0,
      difficultyWins,
      winsRequired: progress.requiredWins,
      unlockedNextDifficulty,
    };
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hydrated,
      stats,
      clickCookie,
      buyUpgrade,
      buyDisc,
      upgradeDisc,
      equipDisc,
      buyBot,
      setDifficulty,
      discoverMonster,
      acknowledgeMonsters,
      completeBattle,
      toggleSound: () => dispatch({ type: 'TOGGLE_SOUND' }),
      setSoundVolume: (level) => dispatch({ type: 'SET_SOUND_VOLUME', level }),
      toggleVibration: () => dispatch({ type: 'TOGGLE_VIBRATION' }),
    }),
    [
      state,
      hydrated,
      stats,
      clickCookie,
      buyUpgrade,
      buyDisc,
      upgradeDisc,
      equipDisc,
      buyBot,
      setDifficulty,
      discoverMonster,
      acknowledgeMonsters,
      completeBattle,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame은 GameProvider 안에서 사용해야 합니다.');
  return context;
}
