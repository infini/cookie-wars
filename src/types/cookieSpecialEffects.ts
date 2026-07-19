export type CookieSpecialEffectKind =
  | 'critical'
  | 'magma'
  | 'superCritical'
  | 'electric';

export interface CookieSpecialEffectConfig {
  id: CookieSpecialEffectKind;
  durationMs: number;
  compactDurationMs: number;
  minimumSizePixels: number;
  screenWidthRatio: number;
  screenHeightRatio: number;
  offsetXScreenRatio: number;
  offsetYScreenRatio: number;
  zIndex: number;
  sourceFrameCount: number;
}

export interface CookieFragmentRewardEffectConfig {
  fontSize: number;
  topRatio: number;
  shadowRadius: number;
  shadowColor: string;
  peakProgress: number;
  magmaFadeStartProgress: number;
  electricFadeStartProgress: number;
  startScale: number;
  peakScale: number;
  endScale: number;
  magmaShakeDistancePixels: number;
  electricShakeDistancePixels: number;
}

export interface CookieSpecialEffectsConfig {
  effects: CookieSpecialEffectConfig[];
  fragmentReward: CookieFragmentRewardEffectConfig;
}
