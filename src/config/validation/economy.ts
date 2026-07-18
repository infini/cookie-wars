import {
  ConfigValidationError,
  UnknownRecord,
  numberField,
  record,
  validateIdTable,
  validateLevelRows,
  validateNumberFields,
  validateOptionalBoolean,
  validateOptionalNumber,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';

export function validateBots(value: unknown): UnknownRecord[] {
  const path = 'BOTS';
  const bots = validateIdTable(value, path);
  bots.forEach((bot, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(bot, itemPath, ['name', 'description', 'accentColor']);
    numberField(bot, 'baseCost', itemPath, { integer: true, min: 0 });
    validateNumberFields(bot, itemPath, [
      'costMultiplier', 'discDamageMultiplier',
    ], { min: 0 });
    validatePositiveNumberFields(bot, itemPath, ['attackIntervalMs'], { integer: true });
  });
  return bots;
}

export function validateCookieUpgrades(value: unknown): UnknownRecord[] {
  const path = 'COOKIE_UPGRADES';
  const upgrades = validateIdTable(value, path);
  upgrades.forEach((upgrade, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(upgrade, itemPath, ['name', 'description', 'unit']);
    validateOptionalBoolean(upgrade, 'enabled', itemPath);
    validateOptionalBoolean(upgrade, 'visible', itemPath);
    validateOptionalNumber(upgrade, 'renderBaseSizePixels', itemPath, { min: 0 });
    validateOptionalNumber(upgrade, 'renderMaximumSizePixels', itemPath, { min: 0 });
    validateLevelRows(upgrade.levels, `${itemPath}.levels`, ['value', 'cost']);
  });
  return upgrades;
}

export function validateCookieUpgradeRules(value: unknown): UnknownRecord {
  const path = 'COOKIE_UPGRADE_RULES';
  const rules = record(value, path);
  const entries = Object.entries(rules);
  if (entries.length === 0) {
    throw new ConfigValidationError(path, '비어 있을 수 없습니다.');
  }
  entries.forEach(([upgradeId, rule]) => {
    const itemPath = `${path}.${upgradeId}`;
    const upgradeRule = record(rule, itemPath);
    numberField(upgradeRule, 'valueIncreasePerLevel', itemPath, {
      integer: true,
      min: 0,
    });
    numberField(upgradeRule, 'costGrowthMultiplier', itemPath, { min: 0 });
  });
  return rules;
}

export function validateCookies(value: unknown): UnknownRecord[] {
  const path = 'COOKIES';
  const cookies = validateIdTable(value, path);
  cookies.forEach((cookie, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(cookie, itemPath, ['imageKey', 'name', 'description']);
    numberField(cookie, 'requiredTotalUpgradeLevels', itemPath, { integer: true, min: 0 });
    validateNumberFields(cookie, itemPath, [
      'clickMultiplier', 'autoProductionMultiplier', 'healthMultiplier',
    ], { min: 0 });
  });
  return cookies;
}

export function validateDiscs(value: unknown): UnknownRecord[] {
  const path = 'DISCS';
  const discs = validateIdTable(value, path);
  discs.forEach((disc, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(disc, itemPath, ['name', 'description']);
    numberField(disc, 'purchaseCost', itemPath, { integer: true, min: 0 });
    const levelsPath = `${itemPath}.levels`;
    const levels = validateLevelRows(disc.levels, levelsPath, [
      'damage', 'size', 'speed', 'cooldownMs', 'cost',
    ]);
    levels.forEach((level, levelIndex) => validatePositiveNumberFields(
      level,
      `${levelsPath}[${levelIndex}]`,
      ['cooldownMs'],
    ));
  });
  return discs;
}

export function validateDiscUpgradeRules(value: unknown): void {
  const path = 'DISC_UPGRADE_RULES';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'damageGrowthMultiplier', 'costGrowthMultiplier',
  ], { min: 0 });
  validateNumberFields(config, path, [
    'sizeIncreasePerLevel', 'speedIncreasePerLevel', 'cooldownReductionMsPerLevel',
  ], { integer: true, min: 0 });
  validatePositiveNumberFields(config, path, ['minimumCooldownMs'], { integer: true });
}
