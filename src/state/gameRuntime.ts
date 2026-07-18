import type { GameState } from '../types/game';
import { gameReducer } from './gameReducer';
import type { GameAction } from './gameReducer';

export interface GameStateReference {
  current: GameState;
}

export type GameDispatch = (action: GameAction) => void;

export type ProjectedGameDispatch = (
  action: GameAction,
  precomputedState?: GameState,
) => boolean;

export function createProjectedGameDispatcher(
  dispatch: GameDispatch,
  stateRef: GameStateReference,
): ProjectedGameDispatch {
  return (action, precomputedState) => {
    const current = stateRef.current;
    const next = precomputedState ?? gameReducer(current, action);
    if (next === current) return false;
    stateRef.current = next;
    dispatch(action);
    return true;
  };
}
