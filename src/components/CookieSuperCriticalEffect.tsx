import React from 'react';
import type { CookieFeedbackTier } from '../types/game';
import { CookieAnimatedSpecialEffect } from './cookieFeedback/CookieAnimatedSpecialEffect';

type SuperCriticalEffectMode = Extract<
  CookieFeedbackTier,
  'superCriticalFull' | 'superCriticalCompact'
>;

export const CookieSuperCriticalEffect = React.memo(
  function CookieSuperCriticalEffect({ mode }: { mode: SuperCriticalEffectMode }) {
    return (
      <CookieAnimatedSpecialEffect
        kind="superCritical"
        compact={mode === 'superCriticalCompact'}
      />
    );
  },
);
