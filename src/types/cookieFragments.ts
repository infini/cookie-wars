export type CookieFragmentKind = 'magma' | 'electric';

export interface CookieFragmentTypeConfig {
  id: CookieFragmentKind;
  upgradeId: string;
  name: string;
  baseRewardMultiplier: number;
  rewardMultiplierIncreasePerLevel: number;
  feedbackPowerRank: number;
  maximumChanceUnits: number;
  displayMaximumFractionDigits: number;
  imageKey: string;
  accentColor: string;
  glowColor: string;
  labelColor: string;
}

export interface CookieFragmentSpawnEffectConfig {
  spriteSizePixels: number;
  hitSlopPixels: number;
  anchorTopRatio: number;
  targetOffsetXPixels: number;
  targetOffsetYPixels: number;
  launchRisePixels: number;
  launchDurationMs: number;
  startScale: number;
  peakScale: number;
  settledScale: number;
  peakProgress: number;
  startRotationDegrees: number;
  endRotationDegrees: number;
  idlePulseScale: number;
  idlePulseDurationMs: number;
  crumbCount: number;
  crumbMinimumSizePixels: number;
  crumbMaximumSizePixels: number;
  crumbStartDistancePixels: number;
  crumbEndDistancePixels: number;
  crumbFallPixels: number;
  crumbHorizontalSpreadRatio: number;
  crumbVerticalSpreadRatio: number;
  crumbRotationTurns: number;
  crumbDurationMs: number;
  timerWidthPixels: number;
  timerHeightPixels: number;
  timerBottomOffsetPixels: number;
  timerWarningRatio: number;
  normalTimerColor: string;
  warningTimerColor: string;
  timerTrackColor: string;
  auraSizeRatio: number;
  auraCornerRadiusRatio: number;
  auraMaximumOpacity: number;
}

export interface CookieFragmentAudioConfig {
  magmaVolumeMultiplier: number;
  magmaRepeatCount: number;
  magmaRepeatIntervalMs: number;
  electricThunderVolumeMultiplier: number;
  electricThunderDelayMs: number;
  electricThunderRepeatCount: number;
  electricThunderRepeatIntervalMs: number;
}

export interface CookieFragmentsConfig {
  probabilityScale: number;
  lifetimeMs: number;
  types: CookieFragmentTypeConfig[];
  spawnEffect: CookieFragmentSpawnEffectConfig;
  audio: CookieFragmentAudioConfig;
}

export interface CookieFragmentStats {
  config: CookieFragmentTypeConfig;
  chanceUnits: number;
  rewardMultiplier: number;
}
