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
  superCriticalShockwaveVolumeMultiplier: number;
  superCriticalShockwaveDelayMs: number;
  superCriticalLayerDurationMs: number;
}

export interface FloatingGainFeedbackConfig {
  durationMs: number;
  maximumConcurrent: number;
  normalFontSize: number;
  criticalFontSize: number;
  superCriticalFontSize: number;
  normalColor: string;
  criticalColor: string;
  superCriticalColor: string;
  normalShadowColor: string;
  criticalShadowColor: string;
  superCriticalShadowColor: string;
  normalShadowRadius: number;
  criticalShadowRadius: number;
  superCriticalShadowRadius: number;
  holdUntilProgress: number;
  risePixels: number;
  startScale: number;
  peakAtProgress: number;
  peakScale: number;
  endScale: number;
}

export interface CookieSuperCriticalShakeConfig {
  firstProgress: number;
  secondProgress: number;
  thirdProgress: number;
  endProgress: number;
  distancePixels: number;
  returnRatio: number;
}

export interface CookieFeedbackConfig {
  audio: CookieAudioFeedbackConfig;
  floatingGain: FloatingGainFeedbackConfig;
  superCriticalShake: CookieSuperCriticalShakeConfig;
}
