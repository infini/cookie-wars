import {
  ConfigValidationError,
  UnknownRecord,
  array,
  stringValue,
} from './primitives';

export function validateColorArray(
  source: UnknownRecord,
  path: string,
  field: string,
  minimumLength: number,
): void {
  const colors = array(source[field], `${path}.${field}`);
  if (colors.length < minimumLength) {
    throw new ConfigValidationError(
      `${path}.${field}`,
      `색상이 ${minimumLength}개 이상 필요합니다.`,
    );
  }
  colors.forEach((color, index) => stringValue(color, `${path}.${field}[${index}]`));
}

export function assertAscending(
  source: UnknownRecord,
  path: string,
  fields: string[],
): void {
  fields.slice(1).forEach((field, index) => {
    const previous = fields[index];
    if ((source[previous] as number) >= (source[field] as number)) {
      throw new ConfigValidationError(`${path}.${field}`, `${previous}보다 커야 합니다.`);
    }
  });
}

export function assertLess(
  source: UnknownRecord,
  path: string,
  smallerField: string,
  largerField: string,
): void {
  if ((source[smallerField] as number) >= (source[largerField] as number)) {
    throw new ConfigValidationError(
      `${path}.${largerField}`,
      `${smallerField}보다 커야 합니다.`,
    );
  }
}
