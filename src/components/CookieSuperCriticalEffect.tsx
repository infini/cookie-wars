import React from 'react';
import type { CookieFeedbackTier } from '../types/game';
import { CookieLineBurstEffect } from './cookieFeedback/CookieLineBurstEffect';

type SuperCriticalEffectMode = Extract<
  CookieFeedbackTier,
  'superCriticalFull' | 'superCriticalCompact'
>;

export const CookieSuperCriticalEffect = React.memo(
  function CookieSuperCriticalEffect({ mode }: { mode: SuperCriticalEffectMode }) {
    return (
      <CookieLineBurstEffect
        kind="superCritical"
        compact={mode === 'superCriticalCompact'}
      />
    );
  },
);
