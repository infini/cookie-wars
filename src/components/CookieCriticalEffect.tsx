import React from 'react';
import type { CookieFeedbackTier } from '../types/game';
import { CookieAnimatedSpecialEffect } from './cookieFeedback/CookieAnimatedSpecialEffect';

type CriticalEffectMode = Extract<
  CookieFeedbackTier,
  'criticalFull' | 'criticalCompact'
>;

export const CookieCriticalEffect = React.memo(
  function CookieCriticalEffect({ mode }: { mode: CriticalEffectMode }) {
    return (
      <CookieAnimatedSpecialEffect
        kind="critical"
        compact={mode === 'criticalCompact'}
      />
    );
  },
);
