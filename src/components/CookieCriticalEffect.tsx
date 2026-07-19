import React from 'react';
import type { CookieFeedbackTier } from '../types/game';
import { CookieLineBurstEffect } from './cookieFeedback/CookieLineBurstEffect';

type CriticalEffectMode = Extract<
  CookieFeedbackTier,
  'criticalFull' | 'criticalCompact'
>;

export const CookieCriticalEffect = React.memo(
  function CookieCriticalEffect({ mode }: { mode: CriticalEffectMode }) {
    return (
      <CookieLineBurstEffect
        kind="critical"
        compact={mode === 'criticalCompact'}
      />
    );
  },
);
