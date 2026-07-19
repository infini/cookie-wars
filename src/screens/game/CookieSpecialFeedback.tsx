import React, { useEffect } from 'react';
import { CookieCriticalEffect } from '../../components/CookieCriticalEffect';
import { CookieFragmentClaimEffect } from '../../components/CookieFragmentClaimEffect';
import { CookieSuperCriticalEffect } from '../../components/CookieSuperCriticalEffect';
import { COOKIE_FEEDBACK, COOKIE_FRAGMENTS } from '../../config';
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
  if (item.kind === 'magma') return COOKIE_FRAGMENTS.claimEffect.magmaDurationMs;
  if (item.kind === 'electric') return COOKIE_FRAGMENTS.claimEffect.electricDurationMs;
  if (item.kind === 'critical') {
    return item.feedbackTier === 'criticalCompact'
      ? COOKIE_FEEDBACK.criticalEffect.compactDurationMs
      : COOKIE_FEEDBACK.criticalEffect.durationMs;
  }
  return item.feedbackTier === 'superCriticalCompact'
    ? COOKIE_FEEDBACK.superCriticalEffect.compactDurationMs
    : COOKIE_FEEDBACK.superCriticalEffect.durationMs;
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
        mode={item.feedbackTier === 'criticalCompact' ? 'criticalCompact' : 'criticalFull'}
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
