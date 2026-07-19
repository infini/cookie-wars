import type { CookiePityKind } from '../../types/game';
import {
  ConfigValidationError,
  array,
  assertUnique,
  booleanValue,
  record,
  stringValue,
} from './primitives';

function validatePriority(
  value: unknown,
  path: string,
  expected: CookiePityKind[],
): void {
  const priorities = array(value, path).map((item, index) => (
    stringValue(item, `${path}[${index}]`)
  ));
  assertUnique(priorities, path);
  if (
    priorities.length !== expected.length
    || expected.some((kind) => !priorities.includes(kind))
  ) {
    throw new ConfigValidationError(
      path,
      `다음 종류를 정확히 한 번씩 포함해야 합니다: ${expected.join(', ')}`,
    );
  }
}

export function validateCookiePity(value: unknown): void {
  const path = 'COOKIE_PITY';
  const config = record(value, path);
  booleanValue(config.enabled, `${path}.enabled`);
  validatePriority(
    config.criticalPriority,
    `${path}.criticalPriority`,
    ['critical', 'superCritical'],
  );
  validatePriority(
    config.fragmentPriority,
    `${path}.fragmentPriority`,
    ['magma', 'electric'],
  );
}
