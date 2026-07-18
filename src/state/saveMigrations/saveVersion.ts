export function normalizeStoredSaveVersion(value: unknown): number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 1
    ? value
    : 0;
}

export function isFutureSaveVersion(value: unknown, currentVersion: number): boolean {
  return normalizeStoredSaveVersion(value) > currentVersion;
}
