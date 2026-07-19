import { CLICKER_ROBOTS } from '../config';

export function getClickerRobotSoundIntervalMs(clicksPerSecondPerRobot: number): number {
  if (!Number.isFinite(clicksPerSecondPerRobot) || clicksPerSecondPerRobot <= 0) {
    return CLICKER_ROBOTS.sound.minimumIntervalMs;
  }
  return Math.max(
    CLICKER_ROBOTS.sound.minimumIntervalMs,
    Math.round(1000 / clicksPerSecondPerRobot),
  );
}
