import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { PROGRESSION } from '../config';
import { loadGame, saveGame } from '../services/storage';
import type { GameState } from '../types/game';
import { prepareSavedGame } from './gameReducer';
import type { GameDispatch, GameStateReference } from './gameRuntime';

interface GamePersistenceOptions {
  state: GameState;
  stateRef: GameStateReference;
  dispatch: GameDispatch;
}

export function useGamePersistence({
  state,
  stateRef,
  dispatch,
}: GamePersistenceOptions): boolean {
  const [hydrated, setHydrated] = useState(false);
  const [persistenceWritable, setPersistenceWritable] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadGame().then(async (saved) => {
      if (!mounted) return;
      if (saved) {
        const prepared = prepareSavedGame(saved, Date.now());
        if (prepared.persistenceWritable) {
          await saveGame(prepared.state, prepared.state.lastSavedAt);
        }
        if (!mounted) return;
        setPersistenceWritable(prepared.persistenceWritable);
        dispatch({
          type: 'HYDRATE',
          payload: prepared.state,
          now: prepared.state.lastSavedAt,
        });
      }
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated || !persistenceWritable) return undefined;
    const timer = setTimeout(() => {
      void saveGame(state);
    }, PROGRESSION.saveDebounceMs);
    return () => clearTimeout(timer);
  }, [hydrated, persistenceWritable, state]);

  useEffect(() => {
    if (!hydrated || !persistenceWritable) return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') void saveGame(stateRef.current);
    });
    return () => subscription.remove();
  }, [hydrated, persistenceWritable, stateRef]);

  return hydrated;
}
