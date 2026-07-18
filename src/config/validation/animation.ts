import {
  ConfigValidationError,
  UnknownRecord,
  array,
  assertUnique,
  numberField,
  numberValue,
  record,
  stringValue,
  validateIdTable,
  validateNumberFields,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';

function validateFrameSequence(
  value: unknown,
  path: string,
): number[] {
  return array(value, path).map((item, index) => numberValue(
    item,
    `${path}[${index}]`,
    { integer: true, min: 0 },
  ));
}

function validateImageKeys(value: unknown, path: string): string[] {
  const keys = array(value, path).map((item, index) => stringValue(
    item,
    `${path}[${index}]`,
  ));
  assertUnique(keys, path);
  return keys;
}

function validateSequenceReferences(
  sequence: number[],
  frameCount: number,
  path: string,
): void {
  sequence.forEach((frameIndex, index) => {
    if (frameIndex >= frameCount) {
      throw new ConfigValidationError(
        `${path}[${index}]`,
        `프레임 수 ${frameCount}보다 작은 인덱스여야 합니다.`,
      );
    }
  });
}

export function validateBossAnimation(value: unknown): UnknownRecord[] {
  const path = 'BOSS_ANIMATION';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'walkDistancePerCycle', 'impactHoldMs', 'recoveryMs', 'impactEffectDurationMs',
  ]);
  validatePositiveNumberFields(config, path, [
    'walkDistancePerCycle', 'impactHoldMs', 'recoveryMs', 'impactEffectDurationMs',
  ]);
  ['impactHoldMs', 'recoveryMs', 'impactEffectDurationMs'].forEach((field) => (
    numberField(config, field, path, { integer: true, min: 1 })
  ));
  const sequence = validateFrameSequence(
    config.walkFrameSequence,
    `${path}.walkFrameSequence`,
  );
  const sets = validateIdTable(config.sets, `${path}.sets`);
  sets.forEach((set, index) => {
    const itemPath = `${path}.sets[${index}]`;
    const frameKeys = validateImageKeys(set.walkImageKeys, `${itemPath}.walkImageKeys`);
    validateSequenceReferences(sequence, frameKeys.length, `${path}.walkFrameSequence`);
    validateStringFields(set, itemPath, [
      'hammerWindupImageKey', 'hammerImpactImageKey', 'hammerRecoveryImageKey',
    ]);
  });
  return sets;
}

export function validateBotAnimation(value: unknown): UnknownRecord[] {
  const path = 'BOT_ANIMATION';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'patrolCycleMs', 'patrolPhaseOffsetMs', 'patrolHorizontalRadius',
    'patrolForwardDistance', 'targetFollowRatio', 'throwWindupMs',
    'throwReleaseHoldMs', 'throwRecoveryMs',
  ], { min: 0 });
  validatePositiveNumberFields(config, path, [
    'patrolCycleMs', 'throwWindupMs', 'throwReleaseHoldMs', 'throwRecoveryMs',
  ]);
  [
    'patrolCycleMs', 'patrolPhaseOffsetMs', 'throwWindupMs',
    'throwReleaseHoldMs', 'throwRecoveryMs',
  ].forEach((field) => numberField(config, field, path, { integer: true, min: 0 }));
  ['patrolHorizontalRadius', 'patrolForwardDistance', 'targetFollowRatio'].forEach(
    (field) => numberField(config, field, path, { min: 0, max: 1 }),
  );
  ['projectileReleaseOffsetX', 'projectileReleaseOffsetY'].forEach(
    (field) => numberField(config, field, path, { min: -1, max: 1 }),
  );
  const sequence = validateFrameSequence(
    config.runFrameSequence,
    `${path}.runFrameSequence`,
  );
  const sets = validateIdTable(config.sets, `${path}.sets`);
  sets.forEach((set, index) => {
    const itemPath = `${path}.sets[${index}]`;
    const frameKeys = validateImageKeys(set.runImageKeys, `${itemPath}.runImageKeys`);
    validateSequenceReferences(sequence, frameKeys.length, `${path}.runFrameSequence`);
    validateStringFields(set, itemPath, [
      'throwWindupImageKey', 'throwReleaseImageKey', 'throwRecoveryImageKey',
    ]);
  });
  return sets;
}

export function validateAnimationFrameVisibility(
  battleRulesValue: unknown,
  bossAnimationValue: unknown,
  botAnimationValue: unknown,
): void {
  const battleRules = record(battleRulesValue, 'BATTLE_RULES');
  const speedMultipliers = array(
    battleRules.battleSpeedMultipliers,
    'BATTLE_RULES.battleSpeedMultipliers',
  ).map((item, index) => numberValue(
    item,
    `BATTLE_RULES.battleSpeedMultipliers[${index}]`,
    { integer: true, min: 1 },
  ));
  const maximumSpeedMultiplier = Math.max(...speedMultipliers);
  const maximumDeltaMs = numberField(
    battleRules,
    'maxDeltaMs',
    'BATTLE_RULES',
    { min: 0 },
  );
  const maximumSkippedSimulationMs = maximumDeltaMs
    * (maximumSpeedMultiplier - 1);
  const bossAnimation = record(bossAnimationValue, 'BOSS_ANIMATION');
  const botAnimation = record(botAnimationValue, 'BOT_ANIMATION');
  const bossImpactHoldMs = numberField(
    bossAnimation,
    'impactHoldMs',
    'BOSS_ANIMATION',
    { min: 0 },
  );
  const botReleaseHoldMs = numberField(
    botAnimation,
    'throwReleaseHoldMs',
    'BOT_ANIMATION',
    { min: 0 },
  );
  if (bossImpactHoldMs < maximumSkippedSimulationMs) {
    throw new ConfigValidationError(
      'BOSS_ANIMATION.impactHoldMs',
      `최대 전투 속도에서도 내려찍기 프레임이 보이도록 ${maximumSkippedSimulationMs} 이상이어야 합니다.`,
    );
  }
  if (botReleaseHoldMs < maximumSkippedSimulationMs) {
    throw new ConfigValidationError(
      'BOT_ANIMATION.throwReleaseHoldMs',
      `최대 전투 속도에서도 투척 프레임이 보이도록 ${maximumSkippedSimulationMs} 이상이어야 합니다.`,
    );
  }
}
