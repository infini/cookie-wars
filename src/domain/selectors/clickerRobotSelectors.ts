import { CLICKER_ROBOTS } from '../../config';
import type { ClickerRobotStats, GameState } from '../../types/game';
import {
  clampSafeInteger,
  saturatingAdd,
  saturatingProductInteger,
  saturatingSubtract,
} from '../safeNumbers';
import { getUpgradeProgress } from './upgradeSelectors';

export function getClickerRobotStats(
  state: GameState,
  playerClickPower: number,
): ClickerRobotStats {
  const progress = getUpgradeProgress(state, CLICKER_ROBOTS.upgradeId);
  const rawRobotCount = clampSafeInteger(progress?.current.value);
  const robotCount = Math.min(CLICKER_ROBOTS.maximumRobotCount, rawRobotCount);
  const postCapLevel = saturatingSubtract(
    rawRobotCount,
    CLICKER_ROBOTS.maximumRobotCount,
  );
  const clicksPerSecondPerRobot = saturatingAdd(
    CLICKER_ROBOTS.baseClicksPerSecondPerRobot,
    saturatingProductInteger(
      postCapLevel,
      CLICKER_ROBOTS.clicksPerSecondIncreasePerPostCapLevel,
    ),
  );
  const powerPercent = saturatingAdd(
    CLICKER_ROBOTS.basePowerPercent,
    saturatingProductInteger(
      postCapLevel,
      CLICKER_ROBOTS.powerPercentIncreasePerPostCapLevel,
    ),
  );
  const powerPerHit = saturatingProductInteger(
    playerClickPower,
    powerPercent / 100,
  );
  const totalClicksPerSecond = saturatingProductInteger(
    robotCount,
    clicksPerSecondPerRobot,
  );
  return {
    upgradeLevel: progress?.current.level ?? 1,
    robotCount,
    postCapLevel,
    clicksPerSecondPerRobot,
    totalClicksPerSecond,
    powerPercent,
    powerPerHit,
    cookiesPerSecond: saturatingProductInteger(totalClicksPerSecond, powerPerHit),
  };
}
