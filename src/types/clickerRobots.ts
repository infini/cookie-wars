import type { CookieFragmentRewardResult } from './gameState';

export interface ClickerRobotFormationConfig {
  stageSizePixels: number;
  orbitRadiusPixels: number;
  robotSizePixels: number;
  hammerSizePixels: number;
  hammerOffsetXPixels: number;
  hammerOffsetYPixels: number;
  hammerRaisedDegrees: number;
  hammerStrikeDegrees: number;
  strikeProgress: number;
  bodyRecoilPixels: number;
  minimumVisualCycleMs: number;
}

export interface FlyingFragmentCollectorConfig {
  freeCount: number;
  robotSizePixels: number;
  homeOffsetXPixels: number;
  homeOffsetYPixels: number;
  dispatchDelayMs: number;
  travelDurationMs: number;
  returnDurationMs: number;
  hoverDistancePixels: number;
  hoverDurationMs: number;
  propellerSizePixels: number;
}

export interface ClickerRobotSoundConfig {
  minimumIntervalMs: number;
  volumeMultiplier: number;
}

export interface ClickerRobotRareJudgementConfig {
  intervalMs: number;
}

export interface ClickerRobotsConfig {
  upgradeId: string;
  maximumRobotCount: number;
  quadrantCount: number;
  robotsPerQuadrant: number;
  baseClicksPerSecondPerRobot: number;
  clicksPerSecondIncreasePerPostCapLevel: number;
  basePowerPercent: number;
  powerPercentIncreasePerPostCapLevel: number;
  productionIntervalMs: number;
  rareJudgement: ClickerRobotRareJudgementConfig;
  sound: ClickerRobotSoundConfig;
  formation: ClickerRobotFormationConfig;
  flyingFragmentCollector: FlyingFragmentCollectorConfig;
}

export interface ClickerRobotStats {
  upgradeLevel: number;
  robotCount: number;
  postCapLevel: number;
  clicksPerSecondPerRobot: number;
  totalClicksPerSecond: number;
  powerPercent: number;
  powerPerHit: number;
  cookiesPerSecond: number;
}

export interface ClickerRobotCriticalReward {
  kind: 'critical' | 'superCritical';
  amount: number;
}

export interface ClickerRobotRareEvent {
  critical?: ClickerRobotCriticalReward;
  fragment?: CookieFragmentRewardResult;
}

export interface ClickerRobotRareEventEnvelope extends ClickerRobotRareEvent {
  id: number;
}
