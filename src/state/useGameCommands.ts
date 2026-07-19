import { useMemo } from 'react';
import { completeBattleTransition } from '../domain/battleCompletion';
import { calculateCookieClickTransition } from '../domain/cookieClick';
import { calculateCookieFragmentReward } from '../domain/cookieFragments';
import type {
  BattleRewardResult,
  CookieClickResult,
  CookieFragmentKind,
  CookieFragmentRewardResult,
  SoundVolumeLevel,
} from '../types/game';
import type { GameStateReference, ProjectedGameDispatch } from './gameRuntime';

export interface GameCommands {
  clickCookie: () => CookieClickResult;
  claimCookieFragment: (kind: CookieFragmentKind) => CookieFragmentRewardResult;
  buyUpgrade: (upgradeId: string) => boolean;
  buyDisc: (discId: string) => boolean;
  upgradeDisc: (discId: string) => boolean;
  resetDisc: (discId: string) => boolean;
  equipDisc: (discId: string) => boolean;
  buyBot: (botId: string) => boolean;
  setDifficulty: (difficultyId: string) => boolean;
  discoverMonster: (monsterId: string) => void;
  acknowledgeMonsters: () => void;
  completeBattle: (difficultyId: string) => BattleRewardResult;
  consumeGiantDisc: () => boolean;
  toggleSound: () => void;
  setSoundVolume: (level: SoundVolumeLevel) => void;
  toggleVibration: () => void;
  cycleBattleSpeed: () => void;
  toggleAutoBattle: () => void;
}

export function createGameCommands(
  dispatchProjectedAction: ProjectedGameDispatch,
  stateRef: GameStateReference,
  randomSource: () => number = Math.random,
): GameCommands {
  return {
    clickCookie: () => {
      const transition = calculateCookieClickTransition(
        stateRef.current,
        randomSource(),
        randomSource(),
      );
      dispatchProjectedAction({
        type: 'CLICK_COOKIE',
        result: transition.result,
        pityMisses: transition.pityMisses,
      });
      return transition.result;
    },
    claimCookieFragment: (kind) => {
      const result = calculateCookieFragmentReward(stateRef.current, kind);
      dispatchProjectedAction({ type: 'GAIN_COOKIES', amount: result.amount });
      return result;
    },
    buyUpgrade: (upgradeId) => dispatchProjectedAction({ type: 'BUY_UPGRADE', upgradeId }),
    buyDisc: (discId) => dispatchProjectedAction({ type: 'BUY_DISC', discId }),
    upgradeDisc: (discId) => dispatchProjectedAction({ type: 'UPGRADE_DISC', discId }),
    resetDisc: (discId) => dispatchProjectedAction({ type: 'RESET_DISC', discId }),
    equipDisc: (discId) => dispatchProjectedAction({ type: 'EQUIP_DISC', discId }),
    buyBot: (botId) => dispatchProjectedAction({ type: 'BUY_BOT', botId }),
    setDifficulty: (difficultyId) => dispatchProjectedAction({
      type: 'SET_DIFFICULTY',
      difficultyId,
    }),
    discoverMonster: (monsterId) => {
      dispatchProjectedAction({ type: 'DISCOVER_MONSTER', monsterId });
    },
    acknowledgeMonsters: () => {
      dispatchProjectedAction({ type: 'ACKNOWLEDGE_MONSTERS' });
    },
    completeBattle: (difficultyId) => {
      const transition = completeBattleTransition(stateRef.current, difficultyId);
      dispatchProjectedAction(
        { type: 'COMPLETE_BATTLE', difficultyId },
        transition.state,
      );
      return transition.result;
    },
    consumeGiantDisc: () => dispatchProjectedAction({ type: 'USE_GIANT_DISC' }),
    toggleSound: () => {
      dispatchProjectedAction({ type: 'TOGGLE_SOUND' });
    },
    setSoundVolume: (level) => {
      dispatchProjectedAction({ type: 'SET_SOUND_VOLUME', level });
    },
    toggleVibration: () => {
      dispatchProjectedAction({ type: 'TOGGLE_VIBRATION' });
    },
    cycleBattleSpeed: () => {
      dispatchProjectedAction({ type: 'CYCLE_BATTLE_SPEED' });
    },
    toggleAutoBattle: () => {
      dispatchProjectedAction({ type: 'TOGGLE_AUTO_BATTLE' });
    },
  };
}

export function useGameCommands(
  dispatchProjectedAction: ProjectedGameDispatch,
  stateRef: GameStateReference,
): GameCommands {
  return useMemo(
    () => createGameCommands(dispatchProjectedAction, stateRef),
    [dispatchProjectedAction, stateRef],
  );
}
