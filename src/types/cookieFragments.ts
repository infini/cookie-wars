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
  magmaSizePixels: number;
  electricSizePixels: number;
  magmaScreenWidthRatio: number;
  magmaScreenHeightRatio: number;
  electricScreenWidthRatio: number;
  electricScreenHeightRatio: number;
  magmaFlashMaximumOpacity: number;
  electricFlashMaximumOpacity: number;
  flashStartScale: number;
  flashEndScale: number;
  flashPeakProgress: number;
  flashFadeProgress: number;
  magmaFlashRotationDegrees: number;
  electricFlashRotationDegrees: number;
  magmaPlumeSizeRatio: number;
  magmaPlumeLeftRatio: number;
  magmaPlumeTopRatio: number;
  magmaPlumeStartScaleY: number;
  magmaPlumePeakScaleY: number;
  magmaPlumeEndScaleY: number;
  magmaPlumeStartOffsetYRatio: number;
  magmaPlumePulseCount: number;
  magmaPlumePulseScaleDelta: number;
  magmaPlumeSwayPixels: number;
  magmaVolcanoSizeRatio: number;
  magmaVolcanoLeftRatio: number;
  magmaVolcanoTopRatio: number;
  magmaVolcanoStartOffsetYRatio: number;
  magmaVolcanoEndOffsetYRatio: number;
  magmaVolcanoPeakScale: number;
  magmaVolcanoSettleProgress: number;
  magmaCraterCenterXRatio: number;
  magmaCraterCenterYRatio: number;
  magmaCraterGlowSizeRatio: number;
  magmaCraterGlowEndScale: number;
  magmaShockwaveCount: number;
  magmaShockwaveStaggerProgress: number;
  magmaShockwaveEndScale: number;
  magmaShockwaveWidthRatio: number;
  magmaShockwaveHeightRatio: number;
  magmaShockwaveBorderWidthPixels: number;
  magmaEmberCount: number;
  magmaEmberSizePixels: number;
  magmaEmberStaggerProgress: number;
  magmaEmberRiseRatio: number;
  magmaEmberSpreadRatio: number;
  magmaEmberRotationTurns: number;
  magmaColors: string[];
  electricBoltCount: number;
  electricHorizontalInsetRatio: number;
  electricTopRatio: number;
  electricBoltWidthRatio: number;
  electricBoltHeightRatio: number;
  electricBoltStartScale: number;
  electricRevealProgress: number;
  electricBoltStaggerProgress: number;
  electricBoltVisibleProgress: number;
  electricBoltFlickerRatio: number;
  electricBoltFlickerMinimumOpacity: number;
  electricBoltEchoOpacity: number;
  electricBoltRotationDegrees: number;
  electricColors: string[];
  electricCoreSizeRatio: number;
  electricCoreTopRatio: number;
  electricCoreStartScale: number;
  electricCorePeakScale: number;
  electricCoreEndScale: number;
  electricCoreRotationTurns: number;
  electricPulseCount: number;
  electricPulseStaggerProgress: number;
  electricPulseSizeRatio: number;
  electricPulseEndScale: number;
  electricPulseBorderWidthPixels: number;
  electricPulseCornerRadiusRatio: number;
  electricPulseRotationDegrees: number;
  electricSparkCount: number;
  electricSparkSizePixels: number;
  electricSparkHeightMultiplier: number;
  electricSparkCornerRadiusPixels: number;
  electricSparkEndDistanceRatio: number;
  rewardFontSize: number;
  rewardTopRatio: number;
  rewardShadowRadius: number;
  rewardShadowColor: string;
  rewardPeakScale: number;
  rewardStartScale: number;
  rewardEndScale: number;
  magmaFadeStartProgress: number;
  electricFadeStartProgress: number;
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
