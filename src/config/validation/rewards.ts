import {
  UnknownRecord,
  numberField,
  record,
} from './primitives';

export function validateBattleRewards(value: unknown): UnknownRecord {
  const path = 'BATTLE_REWARDS';
  const config = record(value, path);
  numberField(config, 'battleMedalsPerStageClear', path, {
    integer: true,
    min: 1,
  });
  [
    'clickPowerBonusPercentPerMedal',
    'autoProductionBonusPercentPerMedal',
    'castleHealthBonusPercentPerMedal',
  ].forEach((field) => numberField(config, field, path, {
    integer: true,
    min: 1,
  }));
  return config;
}
