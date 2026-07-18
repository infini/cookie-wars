export type CookieFeedbackTier = 'normal' | 'criticalFull' | 'criticalCompact';

export interface CookieAudioFeedbackConfig {
  minimumClickIntervalMs: number;
  minimumFullCriticalIntervalMs: number;
  criticalLayerDurationMs: number;
  criticalSparkleDelayMs: number;
  voicePlaybackRates: number[];
  voiceVolumeMultipliers: number[];
  criticalImpactVolumeMultiplier: number;
  criticalSparkleVolumeMultiplier: number;
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

export interface CookieFeedbackConfig {
  audio: CookieAudioFeedbackConfig;
  floatingGain: FloatingGainFeedbackConfig;
  criticalEffect: CookieCriticalEffectConfig;
}
