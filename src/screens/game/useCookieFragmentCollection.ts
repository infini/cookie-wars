import { useCallback, useRef, useState } from 'react';
import type {
  CookieFragmentKind,
  CookieFragmentRewardResult,
} from '../../types/game';

export interface ActiveCookieFragment {
  id: number;
  kind: CookieFragmentKind;
  side: -1 | 1;
}

export function useCookieFragmentCollection({
  claimReward,
  onReward,
}: {
  claimReward: (kind: CookieFragmentKind) => CookieFragmentRewardResult;
  onReward: (reward: CookieFragmentRewardResult) => void;
}) {
  const [activeFragment, setActiveFragment] = useState<ActiveCookieFragment>();
  const activeRef = useRef(activeFragment);
  const nextId = useRef(0);
  const nextSide = useRef<-1 | 1>(1);
  activeRef.current = activeFragment;

  const spawnFragment = useCallback((kind: CookieFragmentKind) => {
    const fragment: ActiveCookieFragment = {
      id: nextId.current++,
      kind,
      side: nextSide.current,
    };
    nextSide.current = nextSide.current === 1 ? -1 : 1;
    activeRef.current = fragment;
    setActiveFragment(fragment);
  }, []);
  const expireFragment = useCallback((id: number) => {
    if (activeRef.current?.id !== id) return;
    activeRef.current = undefined;
    setActiveFragment(undefined);
  }, []);
  const claimFragment = useCallback((id: number, kind: CookieFragmentKind) => {
    if (activeRef.current?.id !== id || activeRef.current.kind !== kind) return;
    activeRef.current = undefined;
    setActiveFragment(undefined);
    onReward(claimReward(kind));
  }, [claimReward, onReward]);

  return { activeFragment, spawnFragment, expireFragment, claimFragment };
}
