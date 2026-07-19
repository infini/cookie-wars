import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import type { BattleStatus } from '../../engine/useBattleEngine';

const BATTLE_KEEP_AWAKE_TAG = 'cookie-wars-active-battle';

export function shouldKeepBattleScreenAwake(status: BattleStatus): boolean {
  return status === 'active';
}

export function useBattleKeepAwake(status: BattleStatus): void {
  const active = shouldKeepBattleScreenAwake(status);

  useEffect(() => {
    if (!active) {
      void deactivateKeepAwake(BATTLE_KEEP_AWAKE_TAG).catch(() => undefined);
      return undefined;
    }

    let released = false;
    void activateKeepAwakeAsync(BATTLE_KEEP_AWAKE_TAG)
      .then(() => {
        if (released) {
          return deactivateKeepAwake(BATTLE_KEEP_AWAKE_TAG);
        }
        return undefined;
      })
      .catch(() => undefined);

    return () => {
      released = true;
      void deactivateKeepAwake(BATTLE_KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [active]);
}
