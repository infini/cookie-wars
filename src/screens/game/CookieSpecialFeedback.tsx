import React, { useEffect } from 'react';
import { CookieFragmentClaimEffect } from '../../components/CookieFragmentClaimEffect';
import { CookieCriticalEffect } from '../../components/CookieCriticalEffect';
import { CookieSuperCriticalEffect } from '../../components/CookieSuperCriticalEffect';
import { getCookieSpecialEffect } from '../../config';
import type {
  CookieClickKind,
  CookieFeedbackTier,
  CookieFragmentKind,
} from '../../types/game';

export type CookieSpecialFeedbackKind = Exclude<CookieClickKind, 'normal'>
  | CookieFragmentKind;

export interface CookieSpecialFeedbackItem {
  id: number;
  kind: CookieSpecialFeedbackKind;
  amount: number;
  multiplier?: number;
  feedbackTier?: CookieFeedbackTier;
}

function getDuration(item: CookieSpecialFeedbackItem): number {
  const effect = getCookieSpecialEffect(item.kind);
  return item.feedbackTier?.endsWith('Compact')
    ? effect.compactDurationMs
    : effect.durationMs;
}

function CookieSpecialFeedbackEntry({
  item,
  onDone,
}: {
  item: CookieSpecialFeedbackItem;
  onDone: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onDone(item.id), getDuration(item));
    return () => clearTimeout(timeout);
  }, [item, onDone]);
  if (item.kind === 'magma' || item.kind === 'electric') {
    return (
      <CookieFragmentClaimEffect
        key={item.id}
        kind={item.kind}
        amount={item.amount}
        multiplier={item.multiplier ?? 1}
      />
    );
  }
  if (item.kind === 'critical') {
    return (
      <CookieCriticalEffect
        key={item.id}
        mode={item.feedbackTier === 'criticalCompact'
          ? 'criticalCompact'
          : 'criticalFull'}
      />
    );
  }
  return (
    <CookieSuperCriticalEffect
      key={item.id}
      mode={item.feedbackTier === 'superCriticalCompact'
        ? 'superCriticalCompact'
        : 'superCriticalFull'}
    />
  );
}

export function CookieSpecialFeedback({
  items,
  onDone,
}: {
  items: CookieSpecialFeedbackItem[];
  onDone: (id: number) => void;
}) {
  return items.map((item) => (
    <CookieSpecialFeedbackEntry key={item.id} item={item} onDone={onDone} />
  ));
}
