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

export type CookieLineBurstKind = 'critical' | 'superCritical';

export interface CookieLineBurstEffectConfig {
  id: CookieLineBurstKind;
  mainLineCount: number;
  compactMainLineCount: number;
  radialLineCount: number;
  compactRadialLineCount: number;
  mainLineLengthRatio: number;
  mainLineWidthPixels: number;
  mainAngleOffsetDegrees: number;
  mainAngleStepDegrees: number;
  radialLineLengthRatio: number;
  radialLineWidthPixels: number;
  radialStartDistanceRatio: number;
  radialAngleOffsetDegrees: number;
  radialRevealProgress: number;
  radialStaggerProgress: number;
  radialFadeStartProgress: number;
  flashMaximumOpacity: number;
  compactFlashMaximumOpacity: number;
  flashStartScale: number;
  flashEndScale: number;
  impactPeakProgress: number;
  fadeStartProgress: number;
  compactScale: number;
  ghostOffsetPixels: number;
  flashColor: string;
  mainGradientColors: string[];
  ghostColors: string[];
  radialColors: string[];
}

export interface CookieSpecialEffectsConfig {
  effects: CookieSpecialEffectConfig[];
  lineBursts: CookieLineBurstEffectConfig[];
  fragmentReward: CookieFragmentRewardEffectConfig;
}
