import { ConfigValidationError, UnknownRecord, assertReference } from './primitives';

export interface ReferenceTables {
  maps: UnknownRecord[];
  upgrades: UnknownRecord[];
  upgradeRules: UnknownRecord;
  difficulties: UnknownRecord[];
  enemyDiscs: UnknownRecord[];
  waves: UnknownRecord[];
  monsters: UnknownRecord[];
  bots: UnknownRecord[];
  discs: UnknownRecord[];
  migrations: UnknownRecord;
  bossAnimations: UnknownRecord[];
  botAnimations: UnknownRecord[];
  cookieCritical: UnknownRecord;
  cookieSuperCritical: UnknownRecord;
}

export function validateReferences({
  maps,
  upgrades,
  upgradeRules,
  difficulties,
  enemyDiscs,
  waves,
  monsters,
  bots,
  discs,
  migrations,
  bossAnimations,
  botAnimations,
  cookieCritical,
  cookieSuperCritical,
}: ReferenceTables): void {
  const difficultyIds = new Set(difficulties.map((item) => item.id as string));
  const enemyDiscLevels = new Set(enemyDiscs.map((item) => item.level as number));
  const waveIds = new Set(waves.map((item) => item.id as string));
  const monsterIds = new Set(monsters.map((item) => item.id as string));
  const botIds = new Set(bots.map((item) => item.id as string));
  const discIds = new Set(discs.map((item) => item.id as string));
  const upgradeIds = new Set(upgrades.map((item) => item.id as string));
  const bossAnimationIds = new Set(bossAnimations.map((item) => item.id as string));
  const botAnimationIds = new Set(botAnimations.map((item) => item.id as string));
  assertReference(
    cookieCritical.upgradeId as string,
    upgradeIds,
    'COOKIE_CRITICAL.upgradeId',
    '쿠키 강화 ID',
  );
  assertReference(
    cookieSuperCritical.upgradeId as string,
    upgradeIds,
    'COOKIE_SUPER_CRITICAL.upgradeId',
    '쿠키 강화 ID',
  );
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

  bossAnimations.forEach((animation, index) => assertReference(
    animation.id as string,
    monsterIds,
    `BOSS_ANIMATION.sets[${index}].id`,
    '몬스터 ID',
  ));
  monsters.filter((monster) => monster.rank === '보스').forEach((monster) => assertReference(
    monster.id as string,
    bossAnimationIds,
    `MONSTERS.${monster.id}.id`,
    '보스 애니메이션 ID',
  ));
  botAnimations.forEach((animation, index) => assertReference(
    animation.id as string,
    botIds,
    `BOT_ANIMATION.sets[${index}].id`,
    '쿠키봇 ID',
  ));
  bots.forEach((bot) => assertReference(
    bot.id as string,
    botAnimationIds,
    `BOTS.${bot.id}.id`,
    '쿠키봇 애니메이션 ID',
  ));

  difficulties.forEach((difficulty, index) => {
    assertReference(
      difficulty.enemyWaveId as string,
      waveIds,
      `DIFFICULTIES[${index}].enemyWaveId`,
      '웨이브 ID',
    );
    assertReference(
      difficulty.enemyDiscLevel as number,
      enemyDiscLevels,
      `DIFFICULTIES[${index}].enemyDiscLevel`,
      '적 원반 레벨',
    );
  });
  maps.forEach((map, index) => assertReference(
    map.difficultyId as string,
    difficultyIds,
    `BATTLE_MAPS[${index}].difficultyId`,
    '난이도 ID',
  ));
  difficultyIds.forEach((difficultyId) => {
    if (!maps.some((map) => map.difficultyId === difficultyId)) {
      throw new ConfigValidationError('BATTLE_MAPS', `난이도 '${difficultyId}'의 전장이 없습니다.`);
    }
  });
  waves.forEach((wave, waveIndex) => {
    assertReference(
      wave.bossMonsterId as string,
      monsterIds,
      `ENEMY_WAVES[${waveIndex}].bossMonsterId`,
      '몬스터 ID',
    );
    (wave.monsterPatternIds as string[]).forEach((monsterId, monsterIndex) => assertReference(
      monsterId,
      monsterIds,
      `ENEMY_WAVES[${waveIndex}].monsterPatternIds[${monsterIndex}]`,
      '몬스터 ID',
    ));
  });
  Object.keys(upgradeRules).forEach((upgradeId) => assertReference(
    upgradeId,
    upgradeIds,
    `COOKIE_UPGRADE_RULES.${upgradeId}`,
    '쿠키 강화 ID',
  ));
  upgrades.forEach((upgrade, index) => {
    if (upgrade.enabled !== false && upgradeRules[upgrade.id as string] === undefined) {
      throw new ConfigValidationError(
        `COOKIE_UPGRADES[${index}].id`,
        `활성 강화 '${upgrade.id}'의 무한 강화 규칙이 없습니다.`,
      );
    }
  });

  const aliasTargets: Array<[string, Set<string>]> = [
    ['botIdAliases', botIds],
    ['discIdAliases', discIds],
    ['monsterIdAliases', monsterIds],
  ];
  aliasTargets.forEach(([field, knownIds]) => {
    const aliases = migrations[field] as UnknownRecord;
    Object.entries(aliases).forEach(([legacyId, currentId]) => assertReference(
      currentId as string,
      knownIds,
      `SAVE_MIGRATIONS.${field}.${legacyId}`,
      '현재 ID',
    ));
  });
}
