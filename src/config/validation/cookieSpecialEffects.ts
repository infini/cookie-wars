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
    ['durationMs', 'compactDurationMs', 'minimumSizePixels', 'zIndex', 'sourceFrameCount']
      .forEach((field) => numberField(effect, field, effectPath, { integer: true, min: 1 }));
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
