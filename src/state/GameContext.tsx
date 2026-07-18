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
import {
  COOKIE_UPGRADES,
  DIFFICULTIES,
  DISC,
  getDifficulty,
  PRIMARY_BOT,
} from '../config';
import { loadGame, saveGame } from '../services/storage';
import { BattleRewardResult, CookieStats, GameState } from '../types/game';
import { gameReducer, initialGameState } from './gameReducer';

interface GameContextValue {
  state: GameState;
  hydrated: boolean;
  stats: CookieStats;
  clickCookie: () => number;
  buyUpgrade: (upgradeId: string) => boolean;
  buyDisc: () => boolean;
  upgradeDisc: () => boolean;
  buyBot: () => boolean;
  getBotCost: () => number;
  setDifficulty: (difficultyId: string) => boolean;
  discoverMonster: (monsterId: string) => void;
  acknowledgeMonsters: () => void;
  completeBattle: (difficultyId: string) => BattleRewardResult;
  toggleSound: () => void;
  toggleVibration: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function getUpgradeValue(state: GameState, id: string): number {
  const upgrade = COOKIE_UPGRADES.find((item) => item.id === id);
  if (!upgrade) return 0;
  const level = state.upgradeLevels[id] ?? upgrade.levels[0].level;
  return upgrade.levels.find((item) => item.level === level)?.value ?? upgrade.levels[0].value;
}

export function calculateCookieStats(state: GameState): CookieStats {
  return {
    clickPower: getUpgradeValue(state, 'clickPower'),
    sizePercent: getUpgradeValue(state, 'cookieSize'),
    autoProduction: getUpgradeValue(state, 'autoProduction'),
    maxHealth: getUpgradeValue(state, 'cookieHealth'),
    cookieLevel: state.upgradeLevels.clickPower ?? 1,
  };
}

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
    const timer = setTimeout(() => saveGame(state), 250);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const stats = useMemo(() => calculateCookieStats(state), [state]);

  useEffect(() => {
    if (!hydrated || stats.autoProduction <= 0) return;
    const timer = setInterval(() => {
      dispatch({ type: 'GAIN_COOKIES', amount: stats.autoProduction });
    }, 1000);
    return () => clearInterval(timer);
  }, [hydrated, stats.autoProduction]);

  const clickCookie = useCallback(() => {
    const amount = calculateCookieStats(stateRef.current).clickPower;
    dispatch({ type: 'GAIN_COOKIES', amount });
    return amount;
  }, []);

  const buyUpgrade = useCallback((upgradeId: string) => {
    const current = stateRef.current;
    const upgrade = COOKIE_UPGRADES.find((item) => item.id === upgradeId);
    if (!upgrade) return false;
    const level = current.upgradeLevels[upgradeId] ?? upgrade.levels[0].level;
    const next = upgrade.levels.find((item) => item.level === level + 1);
    if (!next || current.cookies < next.cost) return false;
    dispatch({ type: 'BUY_UPGRADE', upgradeId, cost: next.cost, nextLevel: next.level });
    return true;
  }, []);

  const buyDisc = useCallback(() => {
    const current = stateRef.current;
    if (current.discOwned || current.cookies < DISC.purchaseCost) return false;
    dispatch({ type: 'BUY_DISC' });
    return true;
  }, []);

  const upgradeDisc = useCallback(() => {
    const current = stateRef.current;
    const next = DISC.levels.find((level) => level.level === current.discLevel + 1);
    if (!current.discOwned || !next || current.cookies < next.cost) return false;
    dispatch({ type: 'UPGRADE_DISC', cost: next.cost, nextLevel: next.level });
    return true;
  }, []);

  const getBotCost = useCallback(() => {
    const count = stateRef.current.botCounts[PRIMARY_BOT.id] ?? 0;
    return Math.floor(PRIMARY_BOT.baseCost * PRIMARY_BOT.costMultiplier ** count);
  }, []);

  const buyBot = useCallback(() => {
    const cost = getBotCost();
    if (stateRef.current.cookies < cost) return false;
    dispatch({ type: 'BUY_BOT', botId: PRIMARY_BOT.id, cost });
    return true;
  }, [getBotCost]);

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
    const firstClear = !current.rewardClaimedDifficultyIds.includes(difficultyId);
    const reward = firstClear ? getDifficulty(difficultyId).reward : 0;
    dispatch({
      type: 'COMPLETE_BATTLE',
      difficultyId,
      reward: getDifficulty(difficultyId).reward,
    });
    return { firstClear, reward };
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
      buyBot,
      getBotCost,
      setDifficulty,
      discoverMonster,
      acknowledgeMonsters,
      completeBattle,
      toggleSound: () => dispatch({ type: 'TOGGLE_SOUND' }),
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
      buyBot,
      getBotCost,
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
