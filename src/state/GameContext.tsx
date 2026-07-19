import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { calculateCookieStats } from '../domain/gameSelectors';
import {
  ClickerRobotRareEvent,
  ClickerRobotRareEventEnvelope,
  CookieStats,
  GameState,
} from '../types/game';
import {
  gameReducer,
  initialGameState,
} from './gameReducer';
import { createProjectedGameDispatcher } from './gameRuntime';
import { useAutoProduction } from './useAutoProduction';
import { useClickerRobotProduction } from './useClickerRobotProduction';
import { GameCommands, useGameCommands } from './useGameCommands';
import { useGamePersistence } from './useGamePersistence';

interface GameContextValue extends GameCommands {
  state: GameState;
  hydrated: boolean;
  stats: CookieStats;
  clickerRobotRareEvent?: ClickerRobotRareEventEnvelope;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [clickerRobotRareEvent, setClickerRobotRareEvent] = useState<
    ClickerRobotRareEventEnvelope | undefined
  >();
  const nextClickerRobotRareEventId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const dispatchProjectedAction = useMemo(
    () => createProjectedGameDispatcher(dispatch, stateRef),
    [dispatch, stateRef],
  );
  const hydrated = useGamePersistence({ state, stateRef, dispatch });
  const stats = useMemo(() => calculateCookieStats(state), [state]);
  const handleClickerRobotRareJudgement = useCallback(
    (event: ClickerRobotRareEvent) => {
      setClickerRobotRareEvent({
        ...event,
        id: nextClickerRobotRareEventId.current++,
      });
    },
    [],
  );
  useAutoProduction({
    hydrated,
    autoProduction: stats.autoProduction,
    dispatchProjectedAction,
  });
  useClickerRobotProduction({
    hydrated,
    cookiesPerSecond: stats.clickerRobotCookiesPerSecond,
    dispatchProjectedAction,
    stateRef,
    onRareJudgement: handleClickerRobotRareJudgement,
  });
  const commands = useGameCommands(dispatchProjectedAction, stateRef);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hydrated,
      stats,
      clickerRobotRareEvent,
      ...commands,
    }),
    [state, hydrated, stats, clickerRobotRareEvent, commands],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame은 GameProvider 안에서 사용해야 합니다.');
  return context;
}
