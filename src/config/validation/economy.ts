import {
  assertUnique,
  booleanValue,
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
    booleanValue(
      upgrade.countsTowardCookieEvolution,
      `${itemPath}.countsTowardCookieEvolution`,
    );
    if (
      upgrade.countsTowardCookieEvolution === true
      && (upgrade.enabled === false || upgrade.visible === false)
    ) {
      throw new ConfigValidationError(
        `${itemPath}.countsTowardCookieEvolution`,
        '숨기거나 비활성화한 강화는 쿠키 진화 레벨에 포함할 수 없습니다.',
      );
    }
    validateOptionalBoolean(upgrade, 'enabled', itemPath);
    validateOptionalBoolean(upgrade, 'visible', itemPath);
    validateOptionalNumber(upgrade, 'renderBaseSizePixels', itemPath, { min: 0 });
    validateOptionalNumber(upgrade, 'renderMaximumSizePixels', itemPath, { min: 0 });
    validateOptionalNumber(upgrade, 'maximumLevel', itemPath, { integer: true, min: 1 });
    const levels = validateLevelRows(upgrade.levels, `${itemPath}.levels`, ['value', 'cost']);
    if (
      upgrade.maximumLevel !== undefined
      && (upgrade.maximumLevel as number) < (levels[levels.length - 1].level as number)
    ) {
      throw new ConfigValidationError(
        `${itemPath}.maximumLevel`,
        '마지막 명시 레벨 이상이어야 합니다.',
      );
    }
  });
  if (!upgrades.some((upgrade) => upgrade.countsTowardCookieEvolution === true)) {
    throw new ConfigValidationError(
      `${path}.countsTowardCookieEvolution`,
      '쿠키 진화에 포함되는 강화가 하나 이상 필요합니다.',
    );
  }
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

function validateCriticalConfig(value: unknown, path: string): UnknownRecord {
  const config = record(value, path);
  validateStringFields(config, path, ['upgradeId']);
  validateNumberFields(config, path, [
    'probabilityScale', 'maximumChanceUnits', 'baseRewardMultiplier',
    'rewardMultiplierIncreasePerLevel', 'feedbackPowerRank',
    'displayMaximumFractionDigits',
  ], { min: 0 });
  validatePositiveNumberFields(config, path, [
    'probabilityScale', 'baseRewardMultiplier',
  ]);
  [
    'probabilityScale', 'maximumChanceUnits', 'baseRewardMultiplier',
    'rewardMultiplierIncreasePerLevel', 'feedbackPowerRank',
    'displayMaximumFractionDigits',
  ].forEach((field) => numberField(config, field, path, { integer: true, min: 0 }));
  numberField(config, 'displayMaximumFractionDigits', path, {
    integer: true,
    min: 0,
    max: 4,
  });
  numberField(config, 'feedbackPowerRank', path, { integer: true, min: 1, max: 4 });
  if ((config.maximumChanceUnits as number) > (config.probabilityScale as number)) {
    throw new ConfigValidationError(
      `${path}.maximumChanceUnits`,
      'probabilityScale 이하여야 합니다.',
    );
  }
  return config;
}

export function validateCookieCritical(value: unknown): UnknownRecord {
  return validateCriticalConfig(value, 'COOKIE_CRITICAL');
}

export function validateCookieSuperCritical(value: unknown): UnknownRecord {
  return validateCriticalConfig(value, 'COOKIE_SUPER_CRITICAL');
}

export function validateCookies(value: unknown): UnknownRecord[] {
  const path = 'COOKIES';
  const cookies = validateIdTable(value, path);
  let previousRequiredLevels = -1;
  let previousCommonMultiplier = -1;
  cookies.forEach((cookie, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(cookie, itemPath, ['imageKey', 'name', 'description']);
    const requiredLevels = numberField(cookie, 'requiredTotalUpgradeLevels', itemPath, {
      integer: true,
      min: 0,
    });
    if (requiredLevels <= previousRequiredLevels) {
      throw new ConfigValidationError(
        `${itemPath}.requiredTotalUpgradeLevels`,
        '앞 쿠키보다 커야 합니다.',
      );
    }
    previousRequiredLevels = requiredLevels;
    const clickMultiplier = numberField(cookie, 'clickMultiplier', itemPath, { min: 0 });
    const autoProductionMultiplier = numberField(
      cookie,
      'autoProductionMultiplier',
      itemPath,
      { min: 0 },
    );
    const healthMultiplier = numberField(cookie, 'healthMultiplier', itemPath, { min: 0 });
    if (
      clickMultiplier !== autoProductionMultiplier
      || clickMultiplier !== healthMultiplier
    ) {
      throw new ConfigValidationError(
        `${itemPath}.autoProductionMultiplier`,
        '화면에 공통 배율로 표시하므로 클릭·자동 생산·성 체력 배율이 같아야 합니다.',
      );
    }
    if (clickMultiplier <= previousCommonMultiplier) {
      throw new ConfigValidationError(
        `${itemPath}.clickMultiplier`,
        '앞 쿠키의 공통 배율보다 커야 합니다.',
      );
    }
    previousCommonMultiplier = clickMultiplier;
  });
  assertUnique(
    cookies.map((cookie) => cookie.imageKey as string),
    `${path}.imageKey`,
  );
  assertUnique(
    cookies.map((cookie) => cookie.name as string),
    `${path}.name`,
  );
  return cookies;
}

export function validateCookieExpansion(
  value: unknown,
  cookies: UnknownRecord[],
): UnknownRecord {
  const path = 'COOKIE_EXPANSION';
  const config = record(value, path);
  const legacyCount = numberField(config, 'legacyCookieCount', path, {
    integer: true,
    min: 1,
  });
  const extensionCount = numberField(config, 'extensionCookieCount', path, {
    integer: true,
    min: 1,
  });
  const firstRequiredLevels = numberField(
    config,
    'firstRequiredTotalUpgradeLevels',
    path,
    { integer: true, min: 1 },
  );
  const requiredLevelStep = numberField(config, 'requiredLevelStep', path, {
    integer: true,
    min: 1,
  });
  const multiplierPerCookie = numberField(config, 'multiplierPerCookie', path, {
    min: 1.000001,
  });
  if (cookies.length !== legacyCount + extensionCount) {
    throw new ConfigValidationError(
      `${path}.extensionCookieCount`,
      '기존 쿠키 수와 확장 쿠키 수의 합이 COOKIES 행 수와 같아야 합니다.',
    );
  }
  const extension = cookies.slice(legacyCount);
  extension.forEach((cookie, index) => {
    const expectedLevels = firstRequiredLevels + index * requiredLevelStep;
    if (cookie.requiredTotalUpgradeLevels !== expectedLevels) {
      throw new ConfigValidationError(
        `COOKIES[${legacyCount + index}].requiredTotalUpgradeLevels`,
        'COOKIE_EXPANSION의 시작 레벨과 간격을 따라야 합니다.',
      );
    }
    const previous = cookies[legacyCount + index - 1];
    const expectedMultiplier = Math.round(
      (previous.clickMultiplier as number) * multiplierPerCookie * 100,
    ) / 100;
    if (cookie.clickMultiplier !== expectedMultiplier) {
      throw new ConfigValidationError(
        `COOKIES[${legacyCount + index}].clickMultiplier`,
        'COOKIE_EXPANSION의 쿠키별 배율을 소수 둘째 자리 반올림으로 따라야 합니다.',
      );
    }
  });
  return config;
}

export function validateDiscs(value: unknown): UnknownRecord[] {
  const path = 'DISCS';
  const discs = validateIdTable(value, path);
  discs.forEach((disc, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(disc, itemPath, ['name', 'description']);
    if (disc.upgradeProfileId !== undefined) {
      validateStringFields(disc, itemPath, ['upgradeProfileId']);
    }
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
  validateStringFields(config, path, ['defaultProfileId']);
  const profiles = validateIdTable(config.profiles, `${path}.profiles`);
  profiles.forEach((profile, index) => {
    const profilePath = `${path}.profiles[${index}]`;
    validateStringFields(profile, profilePath, ['damageGrowthMode']);
    if (!['multiplier', 'linear'].includes(profile.damageGrowthMode as string)) {
      throw new ConfigValidationError(
        `${profilePath}.damageGrowthMode`,
        'multiplier 또는 linear여야 합니다.',
      );
    }
    validateNumberFields(profile, profilePath, [
      'damageGrowthMultiplier', 'costGrowthMultiplier',
    ], { min: 0 });
    validateNumberFields(profile, profilePath, [
      'damageIncreasePerLevel',
      'sizeIncreasePerLevel',
      'speedIncreasePerLevel',
      'cooldownReductionMsPerLevel',
    ], { integer: true, min: 0 });
    validatePositiveNumberFields(
      profile,
      profilePath,
      ['minimumCooldownMs'],
      { integer: true },
    );
  });
}
