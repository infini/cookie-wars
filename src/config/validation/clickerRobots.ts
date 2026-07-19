import {
  ConfigValidationError,
  numberField,
  record,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';

export function validateClickerRobots(value: unknown): void {
  const path = 'CLICKER_ROBOTS';
  const config = record(value, path);
  validateStringFields(config, path, ['upgradeId']);
  validatePositiveNumberFields(config, path, [
    'maximumRobotCount',
    'quadrantCount',
    'robotsPerQuadrant',
    'baseClicksPerSecondPerRobot',
    'clicksPerSecondIncreasePerPostCapLevel',
    'basePowerPercent',
    'powerPercentIncreasePerPostCapLevel',
    'productionIntervalMs',
  ], { integer: true });
  if (
    (config.maximumRobotCount as number)
      !== (config.robotsPerQuadrant as number) * (config.quadrantCount as number)
  ) {
    throw new ConfigValidationError(
      `${path}.maximumRobotCount`,
      'quadrantCount개 구역에 robotsPerQuadrant만큼 정확히 배치되어야 합니다.',
    );
  }

  const sound = record(config.sound, `${path}.sound`);
  validatePositiveNumberFields(sound, `${path}.sound`, ['minimumIntervalMs'], {
    integer: true,
  });
  numberField(sound, 'volumeMultiplier', `${path}.sound`, {
    min: 0.01,
    max: 1,
  });

  const formation = record(config.formation, `${path}.formation`);
  validatePositiveNumberFields(formation, `${path}.formation`, [
    'stageSizePixels',
    'orbitRadiusPixels',
    'robotSizePixels',
    'hammerSizePixels',
    'hammerOffsetXPixels',
    'hammerOffsetYPixels',
    'bodyRecoilPixels',
    'minimumVisualCycleMs',
  ]);
  numberField(formation, 'hammerRaisedDegrees', `${path}.formation`);
  numberField(formation, 'hammerStrikeDegrees', `${path}.formation`);
  numberField(formation, 'strikeProgress', `${path}.formation`, {
    min: 0.01,
    max: 0.99,
  });

  const collector = record(
    config.flyingFragmentCollector,
    `${path}.flyingFragmentCollector`,
  );
  validatePositiveNumberFields(collector, `${path}.flyingFragmentCollector`, [
    'freeCount',
    'robotSizePixels',
    'dispatchDelayMs',
    'travelDurationMs',
    'returnDurationMs',
    'hoverDistancePixels',
    'hoverDurationMs',
    'propellerSizePixels',
  ], { integer: true });
  numberField(collector, 'homeOffsetXPixels', `${path}.flyingFragmentCollector`);
  numberField(collector, 'homeOffsetYPixels', `${path}.flyingFragmentCollector`);
}
