import {
  ConfigValidationError,
  UnknownRecord,
  numberField,
  record,
  validateNumberFields,
} from './primitives';

export function validateMiniGame(value: unknown): UnknownRecord {
  const path = 'MINI_GAME';
  const config = record(value, path);
  const integerFields = [
    'minimumDurationSeconds',
    'maximumDurationSeconds',
    'defaultDurationSeconds',
    'durationStepSeconds',
    'countdownSeconds',
    'timerRefreshIntervalMs',
    'cookieSizePixels',
    'pressInDurationMs',
    'releaseSpringSpeed',
    'releaseSpringBounciness',
  ];
  validateNumberFields(config, path, [...integerFields, 'pressedCookieScale']);
  integerFields.forEach((field) => (
    numberField(config, field, path, { integer: true, min: 1 })
  ));
  numberField(config, 'countdownSeconds', path, { integer: true, min: 1, max: 5 });
  numberField(config, 'timerRefreshIntervalMs', path, { integer: true, min: 16, max: 1_000 });
  numberField(config, 'cookieSizePixels', path, { integer: true, min: 120, max: 320 });
  numberField(config, 'pressInDurationMs', path, { integer: true, min: 1, max: 200 });
  numberField(config, 'releaseSpringSpeed', path, { integer: true, min: 1, max: 100 });
  numberField(config, 'releaseSpringBounciness', path, { integer: true, min: 0, max: 20 });
  numberField(config, 'pressedCookieScale', path, { min: 0.5, max: 0.99 });

  const minimum = config.minimumDurationSeconds as number;
  const maximum = config.maximumDurationSeconds as number;
  const defaultDuration = config.defaultDurationSeconds as number;
  const step = config.durationStepSeconds as number;
  if (minimum >= maximum || defaultDuration < minimum || defaultDuration > maximum) {
    throw new ConfigValidationError(
      `${path}.defaultDurationSeconds`,
      '최소와 최대 시간 사이여야 합니다.',
    );
  }
  if (minimum % step !== 0 || maximum % step !== 0 || defaultDuration % step !== 0) {
    throw new ConfigValidationError(
      `${path}.durationStepSeconds`,
      '최소·최대·기본 시간에 정확히 나누어져야 합니다.',
    );
  }
  return config;
}
