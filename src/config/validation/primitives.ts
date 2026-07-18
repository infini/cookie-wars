export class ConfigValidationError extends Error {
  constructor(path: string, reason: string) {
    super(`[설정 오류] ${path}: ${reason}`);
    this.name = 'ConfigValidationError';
  }
}

export type UnknownRecord = Record<string, unknown>;

export interface NumberOptions {
  integer?: boolean;
  min?: number;
  max?: number;
}

function fail(path: string, reason: string): never {
  throw new ConfigValidationError(path, reason);
}

export function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, '객체여야 합니다.');
  }
  return value as UnknownRecord;
}

export function array(value: unknown, path: string, allowEmpty = false): unknown[] {
  if (!Array.isArray(value)) fail(path, '배열이어야 합니다.');
  if (!allowEmpty && value.length === 0) fail(path, '비어 있을 수 없습니다.');
  return value;
}

export function stringValue(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(path, '비어 있지 않은 문자열이어야 합니다.');
  }
  return value;
}

export function numberValue(
  value: unknown,
  path: string,
  options: NumberOptions = {},
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, '유한한 숫자여야 합니다.');
  }
  if (options.integer && !Number.isSafeInteger(value)) {
    fail(path, '안전한 정수여야 합니다.');
  }
  if (options.min !== undefined && value < options.min) {
    fail(path, `${options.min} 이상이어야 합니다.`);
  }
  if (options.max !== undefined && value > options.max) {
    fail(path, `${options.max} 이하여야 합니다.`);
  }
  return value;
}

export function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, '불리언이어야 합니다.');
  return value;
}

export function stringField(value: UnknownRecord, key: string, path: string): string {
  return stringValue(value[key], `${path}.${key}`);
}

export function numberField(
  value: UnknownRecord,
  key: string,
  path: string,
  options: NumberOptions = {},
): number {
  return numberValue(value[key], `${path}.${key}`, options);
}

export function validateNumberFields(
  value: UnknownRecord,
  path: string,
  fields: readonly string[],
  options: NumberOptions = {},
): void {
  fields.forEach((field) => numberField(value, field, path, options));
}

export function validatePositiveNumberFields(
  value: UnknownRecord,
  path: string,
  fields: readonly string[],
  options: Omit<NumberOptions, 'min'> = {},
): void {
  fields.forEach((field) => {
    const number = numberField(value, field, path, options);
    if (number <= 0) {
      throw new ConfigValidationError(`${path}.${field}`, '0보다 커야 합니다.');
    }
  });
}

export function validateStringFields(
  value: UnknownRecord,
  path: string,
  fields: readonly string[],
): void {
  fields.forEach((field) => stringField(value, field, path));
}

export function validateOptionalBoolean(
  value: UnknownRecord,
  key: string,
  path: string,
): void {
  if (value[key] !== undefined) booleanValue(value[key], `${path}.${key}`);
}

export function validateOptionalNumber(
  value: UnknownRecord,
  key: string,
  path: string,
  options: NumberOptions = {},
): void {
  if (value[key] !== undefined) numberField(value, key, path, options);
}

export function assertUnique(values: string[] | number[], path: string): void {
  const seen = new Set<string | number>();
  values.forEach((value, index) => {
    if (seen.has(value)) fail(`${path}[${index}]`, `중복 값 '${value}'을(를) 사용할 수 없습니다.`);
    seen.add(value);
  });
}

export function assertReference(
  value: string | number,
  knownValues: Set<string | number>,
  path: string,
  targetName: string,
): void {
  if (!knownValues.has(value)) {
    fail(path, `존재하지 않는 ${targetName} '${value}'을(를) 참조합니다.`);
  }
}

export function validateIdTable(value: unknown, path: string): UnknownRecord[] {
  const rows = array(value, path).map((item, index) => record(item, `${path}[${index}]`));
  const ids = rows.map((item, index) => stringField(item, 'id', `${path}[${index}]`));
  assertUnique(ids, `${path}.id`);
  return rows;
}

export function validateLevelRows(
  value: unknown,
  path: string,
  numericFields: readonly string[],
): UnknownRecord[] {
  const rows = array(value, path).map((item, index) => {
    const rowPath = `${path}[${index}]`;
    const row = record(item, rowPath);
    numberField(row, 'level', rowPath, { integer: true, min: 1 });
    numericFields.forEach((field) => numberField(row, field, rowPath, {
      integer: true,
      min: 0,
    }));
    return row;
  });
  const levels = rows.map((row) => row.level as number);
  assertUnique(levels, `${path}.level`);
  levels.forEach((level, index) => {
    const expected = index + 1;
    if (level !== expected) {
      fail(`${path}[${index}].level`, `레벨은 1부터 연속이어야 합니다. 예상값: ${expected}`);
    }
  });
  return rows;
}
