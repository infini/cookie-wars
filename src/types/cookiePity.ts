import type { CookieFragmentKind } from './cookieFragments';

export type CriticalPityKind = 'critical' | 'superCritical';
export type CookiePityKind = CriticalPityKind | CookieFragmentKind;

export interface CookiePityConfig {
  enabled: boolean;
  criticalPriority: CriticalPityKind[];
  fragmentPriority: CookieFragmentKind[];
}

export type CookiePityMisses = Record<CookiePityKind, number>;
export type CookiePityChanceUnits = Record<CookiePityKind, number>;
