import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BATTLE_RULES, getEnemyDisc } from '../config';
import type { ActiveBot } from '../domain/gameSelectors';
import { clampSafeInteger } from '../domain/safeNumbers';
import type { DifficultyConfig, DiscLevelConfig } from '../types/game';
import {
  canThrowCastleDisc,
  canThrowGiantDisc,
  clampBattleDeltaMs,
  commitAuthorizedBattleState,
  createManualProjectileId,
  tryThrowCastleDisc,
  tryThrowGiantDisc,
} from './battleCommands';
import {
  acknowledgeBattleEvents,
  deliverPendingBattleEvents,
  getLatestBattlePresentationEvent,
} from './battleEvents';
import { createBattleEnemies } from './battleModel';
import { advanceBattleAtSpeed } from './battleSpeed';
import {
  type BattleEvent,
  type BattleState,
  createInitialBattleState,
  createBattleSessionState,
} from './battleTypes';

export * from './battleCommands';
export * from './battleEvents';
export * from './battleModel';
export * from './battleNumbers';
export * from './battleSimulation';
export * from './battleSpeed';
export * from './battleTypes';
export * from './enemyBattleSimulation';
export * from './enemyCombatSelector';
export * from './playerBattleSimulation';

interface EngineOptions {
  difficulty: DifficultyConfig;
  playerDisc: DiscLevelConfig;
  discAvailable: boolean;
  bots: ActiveBot[];
  maxHealth: number;
  consumeGiantDisc: () => boolean;
  onEvent: (event: BattleEvent) => void;
  speedMultiplier: number;
}

const INITIAL_BATTLE_STATE = createInitialBattleState(Date.now());

export function useBattleEngine({
  difficulty,
  playerDisc,
  discAvailable,
  bots,
  maxHealth,
  consumeGiantDisc,
  onEvent,
  speedMultiplier,
}: EngineOptions) {
  const [state, setState] = useState<BattleState>(INITIAL_BATTLE_STATE);
  const stateRef = useRef<BattleState>(INITIAL_BATTLE_STATE);
  const deliveredEventIdRef = useRef(0);
  const manualProjectileSequenceRef = useRef(0);
  const enemyDisc = useMemo(
    () => getEnemyDisc(difficulty.enemyDiscLevel),
    [difficulty.enemyDiscLevel],
  );
  const updateBattleState = useCallback((
    transition: (current: BattleState) => BattleState,
    authorize?: () => boolean,
  ): boolean => {
    // Timer and tap transitions are serialized before React flushes batched updates.
    const current = stateRef.current;
    const candidate = transition(current);
    const next = authorize
      ? commitAuthorizedBattleState(current, candidate, authorize)
      : candidate;
    if (next === current) return false;
    stateRef.current = next;
    setState(next);
    return true;
  }, []);

  useEffect(() => {
    if (state.status !== 'active') return;
    let previous = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const deltaMs = clampBattleDeltaMs(now - previous);
      previous = now;
      updateBattleState((current) => advanceBattleAtSpeed(current, {
        difficulty,
        enemyDisc,
        playerDisc,
        bots,
        deltaMs,
        speedMultiplier,
      }));
    }, BATTLE_RULES.tickMs);
    return () => clearInterval(timer);
  }, [
    state.status,
    difficulty,
    enemyDisc,
    playerDisc,
    bots,
    speedMultiplier,
    updateBattleState,
  ]);

  useEffect(() => {
    if (!onEvent) {
      updateBattleState((current) => acknowledgeBattleEvents(
        current,
        current.eventSequence,
      ));
      return;
    }
    deliverPendingBattleEvents(
      state.pendingEvents,
      deliveredEventIdRef.current,
      (event) => {
        onEvent(event);
        deliveredEventIdRef.current = event.id;
      },
    );
    updateBattleState((current) => acknowledgeBattleEvents(
      current,
      deliveredEventIdRef.current,
    ));
  }, [state.pendingEvents, onEvent, updateBattleState]);

  const start = useCallback(() => {
    const now = Date.now();
    const safeMaxHealth = clampSafeInteger(maxHealth);
    updateBattleState((current) => ({
      ...createBattleSessionState(current, now),
      status: 'active',
      enemies: createBattleEnemies(difficulty, now, playerDisc, bots),
      baseHealth: safeMaxHealth,
      baseMaxHealth: safeMaxHealth,
      lastBotAttackAt: Object.fromEntries(bots.map((bot) => [bot.config.id, now])),
      lastBotAttackPerformedAt: {},
    }));
  }, [difficulty, playerDisc, bots, maxHealth, updateBattleState]);

  const throwCastleDisc = useCallback((): boolean => {
    const now = stateRef.current.now;
    if (!canThrowCastleDisc(stateRef.current, discAvailable, playerDisc, now)) return false;
    manualProjectileSequenceRef.current += 1;
    return updateBattleState((current) => tryThrowCastleDisc(
      current,
      discAvailable,
      playerDisc,
      now,
      createManualProjectileId('castle', now, manualProjectileSequenceRef.current),
    ));
  }, [discAvailable, playerDisc, updateBattleState]);

  const throwGiantDisc = useCallback((): boolean => {
    const now = stateRef.current.now;
    const sequence = manualProjectileSequenceRef.current + 1;
    const launched = updateBattleState(
      (current) => tryThrowGiantDisc(
        current,
        true,
        playerDisc,
        bots,
        now,
        createManualProjectileId('giant', now, sequence),
      ),
      consumeGiantDisc,
    );
    if (launched) manualProjectileSequenceRef.current = sequence;
    return launched;
  }, [playerDisc, bots, consumeGiantDisc, updateBattleState]);

  const reset = useCallback(() => {
    const now = Date.now();
    updateBattleState((current) => createBattleSessionState(current, now));
  }, [updateBattleState]);
  const canCastleThrow = canThrowCastleDisc(
    state,
    discAvailable,
    playerDisc,
    state.now,
  );
  const canGiantThrow = canThrowGiantDisc(state, true, state.now);
  const cooldownRemainingMs = clampSafeInteger(
    playerDisc.cooldownMs - (state.now - state.lastCastleThrowAt),
  );
  const viewState = useMemo(() => ({
    ...state,
    presentationEvent: getLatestBattlePresentationEvent(state.events),
  }), [state]);

  return {
    state: viewState,
    start,
    throwCastleDisc,
    throwGiantDisc,
    reset,
    canCastleThrow,
    canGiantThrow,
    cooldownRemainingMs,
    enemyDisc,
  };
}
