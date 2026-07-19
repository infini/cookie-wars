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

export interface CookieFragmentClaimEffectConfig {
  magmaDurationMs: number;
  electricDurationMs: number;
  sizePixels: number;
  screenWidthRatio: number;
  screenHeightRatio: number;
  flashMaximumOpacity: number;
  flashStartScale: number;
  flashEndScale: number;
  flashPeakProgress: number;
  flashFadeProgress: number;
  magmaStreamCount: number;
  magmaEmberCount: number;
  magmaStreamMinimumWidthPixels: number;
  magmaStreamMaximumWidthPixels: number;
  magmaStreamLengthRatio: number;
  magmaFlowDistanceRatio: number;
  magmaHorizontalInsetRatio: number;
  magmaStreamRevealProgress: number;
  magmaStreamStaggerProgress: number;
  magmaEmberMinimumSizePixels: number;
  magmaEmberMaximumSizePixels: number;
  magmaEmberStartDistancePixels: number;
  magmaEmberFallDistanceRatio: number;
  magmaEmberRevealProgress: number;
  magmaEmberRotationTurns: number;
  magmaEmberAngleOffsetDegrees: number;
  magmaVolcanoSizeRatio: number;
  magmaVolcanoLeftRatio: number;
  magmaVolcanoTopRatio: number;
  magmaVolcanoStartOffsetYRatio: number;
  magmaVolcanoEndOffsetYRatio: number;
  magmaVolcanoPeakScale: number;
  magmaVolcanoSettleProgress: number;
  magmaStreamWidthSequenceStep: number;
  magmaEmberSizeSequenceStep: number;
  magmaEmberHorizontalInsetRatio: number;
  magmaColors: string[];
  electricBoltCount: number;
  electricSegmentCount: number;
  electricSegmentLengthPixels: number;
  electricSegmentWidthPixels: number;
  electricHorizontalInsetRatio: number;
  electricTopRatio: number;
  electricTurnDegrees: number;
  electricZigzagPixels: number;
  electricRevealProgress: number;
  electricBoltStaggerProgress: number;
  electricSegmentStaggerProgress: number;
  electricSegmentStartScale: number;
  electricSegmentEndScale: number;
  electricSegmentSpacingRatio: number;
  electricColumnHeightRatio: number;
  electricColumnWidthMultiplier: number;
  electricColumnRevealProgress: number;
  electricColumnMaximumOpacity: number;
  electricColumnFadeOpacity: number;
  electricCoreWidthRatio: number;
  electricColors: string[];
  electricShardCount: number;
  electricShardMinimumSizePixels: number;
  electricShardMaximumSizePixels: number;
  electricShardStartDistancePixels: number;
  electricShardRevealProgress: number;
  electricShardEndDistancePixels: number;
  electricShardRotationTurns: number;
  electricShardAngleOffsetDegrees: number;
  rewardFontSize: number;
  rewardTopRatio: number;
  rewardShadowRadius: number;
  rewardShadowColor: string;
  rewardPeakScale: number;
  rewardStartScale: number;
  rewardEndScale: number;
  fadeStartProgress: number;
  magmaShakeDistancePixels: number;
  electricShakeDistancePixels: number;
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
  claimEffect: CookieFragmentClaimEffectConfig;
  audio: CookieFragmentAudioConfig;
}

export interface CookieFragmentStats {
  config: CookieFragmentTypeConfig;
  chanceUnits: number;
  rewardMultiplier: number;
}
