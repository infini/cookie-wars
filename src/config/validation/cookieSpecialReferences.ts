import { ConfigValidationError, UnknownRecord, assertReference } from './primitives';

interface CookieSpecialReferenceTables {
  upgrades: UnknownRecord[];
  upgradeRules: UnknownRecord;
  cookieCritical: UnknownRecord;
  cookieSuperCritical: UnknownRecord;
  cookieFragments: UnknownRecord;
  cookieFeedback: UnknownRecord;
}

function validateProbabilityContracts(
  cookieCritical: UnknownRecord,
  cookieSuperCritical: UnknownRecord,
  cookieFragments: UnknownRecord,
): void {
  if (cookieCritical.upgradeId === cookieSuperCritical.upgradeId) {
    throw new ConfigValidationError(
      'COOKIE_SUPER_CRITICAL.upgradeId',
      '일반 크리티컬과 다른 강화 ID여야 합니다.',
    );
  }
  if (cookieCritical.probabilityScale !== cookieSuperCritical.probabilityScale) {
    throw new ConfigValidationError(
      'COOKIE_SUPER_CRITICAL.probabilityScale',
      '일반 크리티컬과 같은 확률 눈금을 사용해야 합니다.',
    );
  }
  if (cookieCritical.probabilityScale !== cookieFragments.probabilityScale) {
    throw new ConfigValidationError(
      'COOKIE_FRAGMENTS.probabilityScale',
      '크리티컬과 같은 확률 눈금을 사용해야 합니다.',
    );
  }
  if (
    (cookieCritical.maximumChanceUnits as number)
    + (cookieSuperCritical.maximumChanceUnits as number)
    > (cookieCritical.probabilityScale as number)
  ) {
    throw new ConfigValidationError(
      'COOKIE_SUPER_CRITICAL.maximumChanceUnits',
      '두 크리티컬의 최대 확률 합은 100% 이하여야 합니다.',
    );
  }
}

function validateGrowthRatios(
  configs: Array<[UnknownRecord, string]>,
  upgradeById: Map<string, UnknownRecord>,
  upgradeRules: UnknownRecord,
): number {
  const [referenceConfig] = configs[0];
  const referenceUpgradeId = referenceConfig.upgradeId as string;
  const referenceUpgrade = upgradeById.get(referenceUpgradeId) as UnknownRecord;
  const referenceRule = upgradeRules[referenceUpgradeId] as UnknownRecord | undefined;
  if (!referenceRule) {
    throw new ConfigValidationError(
      `COOKIE_UPGRADE_RULES.${referenceUpgradeId}`,
      '활성 강화의 무한 강화 규칙이 없습니다.',
    );
  }
  const referenceBaseChance = ((referenceUpgrade.levels as UnknownRecord[])[0].value as number);
  const referenceChanceIncrease = referenceRule.valueIncreasePerLevel as number;
  const referenceRewardBase = referenceConfig.baseRewardMultiplier as number;
  const referenceRewardIncrease = referenceConfig.rewardMultiplierIncreasePerLevel as number;

  configs.forEach(([config, path]) => {
    const upgradeId = config.upgradeId as string;
    const upgrade = upgradeById.get(upgradeId) as UnknownRecord;
    const rule = upgradeRules[upgradeId] as UnknownRecord | undefined;
    if (!rule) {
      throw new ConfigValidationError(
        `COOKIE_UPGRADE_RULES.${upgradeId}`,
        '활성 강화의 무한 강화 규칙이 없습니다.',
      );
    }
    const levels = upgrade.levels as UnknownRecord[];
    const baseChance = levels[0].value as number;
    const chanceIncrease = rule.valueIncreasePerLevel as number;
    const rewardBase = config.baseRewardMultiplier as number;
    const rewardIncrease = config.rewardMultiplierIncreasePerLevel as number;
    if (chanceIncrease * referenceBaseChance !== referenceChanceIncrease * baseChance) {
      throw new ConfigValidationError(
        `${path}.upgradeId`,
        '크리티컬과 같은 기본 확률 대비 레벨당 증가 비율이어야 합니다.',
      );
    }
    if (rewardIncrease * referenceRewardBase !== referenceRewardIncrease * rewardBase) {
      throw new ConfigValidationError(
        `${path}.rewardMultiplierIncreasePerLevel`,
        '크리티컬과 같은 기본 획득 배수 대비 레벨당 증가 비율이어야 합니다.',
      );
    }
    levels.slice(1).forEach((level, index) => {
      if (level.value !== baseChance + chanceIncrease * (index + 1)) {
        throw new ConfigValidationError(
          `COOKIE_UPGRADES.${upgradeId}.levels[${index + 1}].value`,
          '레벨당 확률 증가량과 일치해야 합니다.',
        );
      }
    });
  });
  return referenceBaseChance;
}

function validateFeedbackPower(
  cookieCritical: UnknownRecord,
  cookieSuperCritical: UnknownRecord,
  fragmentConfigs: UnknownRecord[],
  cookieFeedback: UnknownRecord,
  cookieFragments: UnknownRecord,
  upgradeById: Map<string, UnknownRecord>,
  referenceBaseChance: number,
): void {
  const feedbackAudio = cookieFeedback.audio as UnknownRecord;
  const claimEffect = cookieFragments.claimEffect as UnknownRecord;
  const fragmentAudio = cookieFragments.audio as UnknownRecord;
  const feedbackPower = [
    {
      path: 'COOKIE_CRITICAL',
      rank: cookieCritical.feedbackPowerRank as number,
      chance: referenceBaseChance,
      visualDuration: undefined,
      sound: (feedbackAudio.criticalImpactVolumeMultiplier as number)
        + (feedbackAudio.criticalSparkleVolumeMultiplier as number),
    },
    {
      path: 'COOKIE_SUPER_CRITICAL',
      rank: cookieSuperCritical.feedbackPowerRank as number,
      chance: ((upgradeById.get(cookieSuperCritical.upgradeId as string) as UnknownRecord)
        .levels as UnknownRecord[])[0].value as number,
      visualDuration: (cookieFeedback.superCriticalEffect as UnknownRecord).durationMs as number,
      sound: (feedbackAudio.superCriticalImpactVolumeMultiplier as number)
        + (feedbackAudio.superCriticalShockwaveVolumeMultiplier as number),
    },
    ...fragmentConfigs.map((fragment) => ({
      path: `COOKIE_FRAGMENTS.types.${fragment.id as string}`,
      rank: fragment.feedbackPowerRank as number,
      chance: ((upgradeById.get(fragment.upgradeId as string) as UnknownRecord)
        .levels as UnknownRecord[])[0].value as number,
      visualDuration: fragment.id === 'magma'
        ? claimEffect.magmaDurationMs as number
        : claimEffect.electricDurationMs as number,
      sound: fragment.id === 'magma'
        ? (fragmentAudio.magmaVolumeMultiplier as number)
          * (fragmentAudio.magmaRepeatCount as number)
        : (fragmentAudio.electricThunderVolumeMultiplier as number)
          * (fragmentAudio.electricThunderRepeatCount as number),
    })),
  ].sort((left, right) => left.rank - right.rank);

  feedbackPower.forEach((item, index) => {
    if (item.rank !== index + 1) {
      throw new ConfigValidationError(
        `${item.path}.feedbackPowerRank`,
        `피드백 등급은 1~4를 정확히 한 번씩 사용해야 합니다. 예상값: ${index + 1}`,
      );
    }
    if (index === 0) return;
    const previous = feedbackPower[index - 1];
    if (item.chance >= previous.chance) {
      throw new ConfigValidationError(
        `${item.path}.feedbackPowerRank`,
        '낮은 확률일수록 피드백 등급이 높아야 합니다.',
      );
    }
    if (item.sound <= previous.sound) {
      throw new ConfigValidationError(
        `${item.path}.feedbackPowerRank`,
        '상위 피드백의 음향 레이어 강도는 하위보다 커야 합니다.',
      );
    }
  });
  const visualFeedback = feedbackPower.filter(
    (item): item is typeof item & { visualDuration: number } => (
      item.visualDuration !== undefined
    ),
  );
  visualFeedback.slice(1).forEach((item, index) => {
    const previous = visualFeedback[index];
    if (item.visualDuration <= previous.visualDuration) {
      throw new ConfigValidationError(
        `${item.path}.feedbackPowerRank`,
        '마그마, 슈퍼 크리티컬, 전기 순으로 시각 연출 수명이 길어야 합니다.',
      );
    }
  });
}

export function validateCookieSpecialReferences({
  upgrades,
  upgradeRules,
  cookieCritical,
  cookieSuperCritical,
  cookieFragments,
  cookieFeedback,
}: CookieSpecialReferenceTables): void {
  const upgradeIds = new Set(upgrades.map((item) => item.id as string));
  const upgradeById = new Map(upgrades.map((item) => [item.id as string, item]));
  const fragmentConfigs = cookieFragments.types as UnknownRecord[];
  const configs: Array<[UnknownRecord, string]> = [
    [cookieCritical, 'COOKIE_CRITICAL'],
    [cookieSuperCritical, 'COOKIE_SUPER_CRITICAL'],
    ...fragmentConfigs.map((fragment, index) => [
      fragment,
      `COOKIE_FRAGMENTS.types[${index}]`,
    ] as [UnknownRecord, string]),
  ];

  configs.forEach(([config, path]) => assertReference(
    config.upgradeId as string,
    upgradeIds,
    `${path}.upgradeId`,
    '쿠키 강화 ID',
  ));
  const specialUpgradeIds = configs.map(([config]) => config.upgradeId as string);
  if (new Set(specialUpgradeIds).size !== specialUpgradeIds.length) {
    throw new ConfigValidationError(
      'COOKIE_FRAGMENTS.types.upgradeId',
      '크리티컬과 조각 발견 강화 ID는 서로 달라야 합니다.',
    );
  }
  validateProbabilityContracts(cookieCritical, cookieSuperCritical, cookieFragments);
  const referenceBaseChance = validateGrowthRatios(configs, upgradeById, upgradeRules);
  validateFeedbackPower(
    cookieCritical,
    cookieSuperCritical,
    fragmentConfigs,
    cookieFeedback,
    cookieFragments,
    upgradeById,
    referenceBaseChance,
  );
}
