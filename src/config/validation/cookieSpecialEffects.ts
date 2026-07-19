import {
  ConfigValidationError,
  UnknownRecord,
  array,
  numberField,
  record,
  stringValue,
  validateNumberFields,
} from './primitives';

const EFFECT_IDS = ['critical', 'magma', 'superCritical', 'electric'];
const LINE_BURST_IDS = ['critical', 'superCritical'];

function validateColorArray(
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

function validateLineBursts(config: UnknownRecord, path: string): void {
  const bursts = array(config.lineBursts, `${path}.lineBursts`).map((item, index) => {
    const burstPath = `${path}.lineBursts[${index}]`;
    const burst = record(item, burstPath);
    stringValue(burst.id, `${burstPath}.id`);
    const integerFields = [
      'mainLineCount', 'compactMainLineCount', 'radialLineCount',
      'compactRadialLineCount', 'mainLineWidthPixels', 'radialLineWidthPixels',
      'ghostOffsetPixels',
    ];
    validateNumberFields(burst, burstPath, [
      ...integerFields, 'mainLineLengthRatio', 'mainAngleOffsetDegrees',
      'mainAngleStepDegrees', 'radialLineLengthRatio', 'radialStartDistanceRatio',
      'radialAngleOffsetDegrees', 'radialRevealProgress', 'radialStaggerProgress',
      'radialFadeStartProgress', 'flashMaximumOpacity', 'compactFlashMaximumOpacity',
      'flashStartScale', 'flashEndScale', 'impactPeakProgress', 'fadeStartProgress',
      'compactScale',
    ]);
    integerFields.forEach((field) => numberField(
      burst,
      field,
      burstPath,
      { integer: true, min: field === 'ghostOffsetPixels' ? 0 : 1 },
    ));
    ['mainLineLengthRatio', 'radialLineLengthRatio', 'radialStartDistanceRatio']
      .forEach((field) => numberField(burst, field, burstPath, { min: 0.01, max: 1.5 }));
    [
      'radialRevealProgress', 'radialStaggerProgress', 'radialFadeStartProgress',
      'flashMaximumOpacity', 'compactFlashMaximumOpacity', 'impactPeakProgress',
      'fadeStartProgress',
    ].forEach((field) => numberField(burst, field, burstPath, { min: 0, max: 1 }));
    ['flashStartScale', 'flashEndScale', 'compactScale']
      .forEach((field) => numberField(burst, field, burstPath, { min: 0.01, max: 2 }));
    stringValue(burst.flashColor, `${burstPath}.flashColor`);
    validateColorArray(burst, burstPath, 'mainGradientColors', 2);
    validateColorArray(burst, burstPath, 'ghostColors', 0);
    validateColorArray(burst, burstPath, 'radialColors', 1);
    if ((burst.compactMainLineCount as number) > (burst.mainLineCount as number)) {
      throw new ConfigValidationError(
        `${burstPath}.compactMainLineCount`,
        'mainLineCount 이하여야 합니다.',
      );
    }
    if ((burst.compactRadialLineCount as number) > (burst.radialLineCount as number)) {
      throw new ConfigValidationError(
        `${burstPath}.compactRadialLineCount`,
        'radialLineCount 이하여야 합니다.',
      );
    }
    if (
      (burst.radialRevealProgress as number)
        + ((burst.radialLineCount as number) - 1)
          * (burst.radialStaggerProgress as number)
      >= (burst.radialFadeStartProgress as number)
    ) {
      throw new ConfigValidationError(
        `${burstPath}.radialFadeStartProgress`,
        '마지막 방사선 시작 시점보다 커야 합니다.',
      );
    }
    if (
      (burst.impactPeakProgress as number) >= (burst.fadeStartProgress as number)
      || (burst.flashStartScale as number) >= (burst.flashEndScale as number)
    ) {
      throw new ConfigValidationError(burstPath, '선형 타격 연출 순서가 올바르지 않습니다.');
    }
    return burst;
  });
  if (
    bursts.length !== LINE_BURST_IDS.length
    || new Set(bursts.map((burst) => burst.id)).size !== LINE_BURST_IDS.length
    || LINE_BURST_IDS.some((id) => !bursts.some((burst) => burst.id === id))
  ) {
    throw new ConfigValidationError(
      `${path}.lineBursts`,
      'critical, superCritical을 정확히 한 번씩 정의해야 합니다.',
    );
  }
  const critical = bursts.find((burst) => burst.id === 'critical')!;
  const superCritical = bursts.find((burst) => burst.id === 'superCritical')!;
  ['mainLineCount', 'radialLineCount', 'mainLineLengthRatio', 'radialLineLengthRatio']
    .forEach((field) => {
      if ((superCritical[field] as number) <= (critical[field] as number)) {
        throw new ConfigValidationError(
          `${path}.lineBursts.superCritical.${field}`,
          '슈퍼 크리티컬이 일반 크리티컬보다 강해야 합니다.',
        );
      }
    });
}

export function validateCookieSpecialEffects(value: unknown): UnknownRecord {
  const path = 'COOKIE_SPECIAL_EFFECTS';
  const config = record(value, path);
  const effects = array(config.effects, `${path}.effects`).map((item, index) => {
    const effectPath = `${path}.effects[${index}]`;
    const effect = record(item, effectPath);
    stringValue(effect.id, `${effectPath}.id`);
    validateNumberFields(effect, effectPath, [
      'durationMs', 'compactDurationMs', 'minimumSizePixels', 'screenWidthRatio',
      'screenHeightRatio', 'offsetXScreenRatio', 'offsetYScreenRatio', 'zIndex',
      'sourceFrameCount',
    ]);
    ['durationMs', 'compactDurationMs', 'minimumSizePixels', 'zIndex']
      .forEach((field) => numberField(effect, field, effectPath, { integer: true, min: 1 }));
    numberField(effect, 'sourceFrameCount', effectPath, { integer: true, min: 0 });
    ['screenWidthRatio', 'screenHeightRatio'].forEach((field) => (
      numberField(effect, field, effectPath, { min: 0.1, max: 2 })
    ));
    ['offsetXScreenRatio', 'offsetYScreenRatio'].forEach((field) => (
      numberField(effect, field, effectPath, { min: -0.5, max: 0.5 })
    ));
    if ((effect.compactDurationMs as number) > (effect.durationMs as number)) {
      throw new ConfigValidationError(
        `${effectPath}.compactDurationMs`,
        '전체 연출 시간 이하여야 합니다.',
      );
    }
    return effect;
  });
  if (
    effects.length !== EFFECT_IDS.length
    || new Set(effects.map((effect) => effect.id)).size !== EFFECT_IDS.length
    || EFFECT_IDS.some((id) => !effects.some((effect) => effect.id === id))
  ) {
    throw new ConfigValidationError(
      `${path}.effects`,
      'critical, magma, superCritical, electric을 정확히 한 번씩 정의해야 합니다.',
    );
  }
  const ordered = EFFECT_IDS.map((id) => effects.find((effect) => effect.id === id)!);
  ['durationMs', 'minimumSizePixels', 'screenWidthRatio', 'screenHeightRatio', 'zIndex']
    .forEach((field) => ordered.slice(1).forEach((effect, index) => {
      if ((effect[field] as number) <= (ordered[index][field] as number)) {
        throw new ConfigValidationError(
          `${path}.effects.${effect.id}.${field}`,
          '희귀도가 높을수록 연출 시간과 화면 점유 범위가 커야 합니다.',
        );
      }
    }));
  validateLineBursts(config, path);

  const rewardPath = `${path}.fragmentReward`;
  const reward = record(config.fragmentReward, rewardPath);
  validateNumberFields(reward, rewardPath, [
    'fontSize', 'topRatio', 'shadowRadius', 'peakProgress',
    'magmaFadeStartProgress', 'electricFadeStartProgress', 'startScale',
    'peakScale', 'endScale', 'magmaShakeDistancePixels', 'electricShakeDistancePixels',
  ], { min: 0 });
  stringValue(reward.shadowColor, `${rewardPath}.shadowColor`);
  numberField(reward, 'fontSize', rewardPath, { min: 1 });
  ['topRatio', 'peakProgress', 'magmaFadeStartProgress', 'electricFadeStartProgress']
    .forEach((field) => numberField(reward, field, rewardPath, { min: 0, max: 1 }));
  if (
    (reward.peakProgress as number) >= (reward.magmaFadeStartProgress as number)
    || (reward.magmaFadeStartProgress as number) >= (reward.electricFadeStartProgress as number)
    || (reward.startScale as number) >= (reward.peakScale as number)
  ) {
    throw new ConfigValidationError(rewardPath, '보상 글자 연출 순서가 올바르지 않습니다.');
  }
  return config;
}
