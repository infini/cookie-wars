export type CookieFeedbackTier =
  | 'normal'
  | 'criticalFull'
  | 'criticalCompact'
  | 'superCriticalFull'
  | 'superCriticalCompact';

export interface CookieAudioFeedbackConfig {
  minimumClickIntervalMs: number;
  minimumFullCriticalIntervalMs: number;
  minimumFullSuperCriticalIntervalMs: number;
  criticalLayerDurationMs: number;
  criticalSparkleDelayMs: number;
  voicePlaybackRates: number[];
  voiceVolumeMultipliers: number[];
  criticalImpactVolumeMultiplier: number;
  criticalSparkleVolumeMultiplier: number;
  superCriticalImpactVolumeMultiplier: number;
  superCriticalShineVolumeMultiplier: number;
  superCriticalShineDelayMs: number;
  superCriticalLayerDurationMs: number;
}

export interface FloatingGainFeedbackConfig {
  durationMs: number;
  maximumConcurrent: number;
  holdUntilProgress: number;
  risePixels: number;
  startScale: number;
  peakAtProgress: number;
  peakScale: number;
  endScale: number;
}

export interface CookieCriticalEffectConfig {
  durationMs: number;
  compactDurationMs: number;
  sizePixels: number;
  maximumConcurrentFullEffects: number;
  maximumConcurrentCompactEffects: number;
  flashMaximumOpacity: number;
  flashStartScale: number;
  flashEndScale: number;
  coreSizeRatio: number;
  coreStartScale: number;
  corePeakScale: number;
  coreEndScale: number;
  coreBorderWidth: number;
  corePeakProgress: number;
  coreFadeStartProgress: number;
  firstRingStartScale: number;
  firstRingEndScale: number;
  firstRingBorderWidth: number;
  secondRingStartProgress: number;
  secondRingStartScale: number;
  secondRingEndScale: number;
  secondRingBorderWidth: number;
  ringFadeStartProgress: number;
  fragmentCount: number;
  fragmentStartProgress: number;
  fragmentRevealProgress: number;
  fragmentFadeStartProgress: number;
  fragmentStartDistancePixels: number;
  fragmentEndDistancePixels: number;
  fragmentMinimumSizePixels: number;
  fragmentMaximumSizePixels: number;
  fragmentBorderWidth: number;
  fragmentCornerRadiusRatio: number;
  fragmentChipSizeRatio: number;
  fragmentRotationTurns: number;
  fragmentAngleOffsetDegrees: number;
  sparkleCount: number;
  compactSparkleCount: number;
  sparkleStartProgress: number;
  sparkleStaggerProgress: number;
  sparkleFadeStartProgress: number;
  sparkleStartDistancePixels: number;
  sparkleEndDistancePixels: number;
  sparkleSizePixels: number;
  sparkleThicknessRatio: number;
  sparkleRotationTurns: number;
  sparkleAngleOffsetDegrees: number;
  compactScale: number;
  flashColor: string;
  coreColorStart: string;
  coreColorEnd: string;
  firstRingColor: string;
  secondRingColor: string;
  fragmentColor: string;
  fragmentEdgeColor: string;
  fragmentChipColor: string;
  sparkleColor: string;
  sparkleHighlightColor: string;
}

export interface CookieSuperCriticalEffectConfig {
  durationMs: number;
  compactDurationMs: number;
  sizePixels: number;
  maximumConcurrentFullEffects: number;
  maximumConcurrentCompactEffects: number;
  flashMaximumOpacity: number;
  flashStartScale: number;
  flashEndScale: number;
  coreSizeRatio: number;
  coreStartScale: number;
  corePeakScale: number;
  coreEndScale: number;
  corePeakProgress: number;
  coreFadeStartProgress: number;
  ringCount: number;
  ringStaggerProgress: number;
  ringFadeStartProgress: number;
  ringStartScale: number;
  ringEndScale: number;
  ringBorderWidth: number;
  rayCount: number;
  compactRayCount: number;
  rayLengthPixels: number;
  rayWidthPixels: number;
  rayStartScale: number;
  rayEndScale: number;
  rayRotationTurns: number;
  sparkleCount: number;
  compactSparkleCount: number;
  sparkleStartProgress: number;
  sparkleStaggerProgress: number;
  sparkleFadeStartProgress: number;
  sparkleStartDistancePixels: number;
  sparkleEndDistancePixels: number;
  sparkleSizePixels: number;
  sparkleThicknessRatio: number;
  compactScale: number;
  labelFontSize: number;
  labelTopRatio: number;
  flashColor: string;
  coreColorStart: string;
  coreColorEnd: string;
  ringColors: string[];
  rayColor: string;
  sparkleColors: string[];
  labelColor: string;
  labelShadowColor: string;
}

export interface CookieFeedbackConfig {
  audio: CookieAudioFeedbackConfig;
  floatingGain: FloatingGainFeedbackConfig;
  criticalEffect: CookieCriticalEffectConfig;
  superCriticalEffect: CookieSuperCriticalEffectConfig;
}
