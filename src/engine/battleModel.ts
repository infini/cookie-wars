import {
  BATTLE_RULES,
  BOSS_BALANCE,
  BOSS_BEHAVIOR,
  GIANT_DISC,
  getEnemyDisc,
  getEnemyWave,
  getMonster,
} from '../config';
import type { ActiveBot } from '../domain/gameSelectors';
import { clampFiniteNumber, clampSafeInteger } from '../domain/safeNumbers';
import type { DifficultyConfig, DiscLevelConfig } from '../types/game';
import {
  saturatingCombatProduct,
  saturatingCombatProductInteger,
  saturatingCombatQuotient,
  saturatingCombatSum,
} from './battleNumbers';
import type { BattleEnemy } from './battleTypes';

export function aliveEnemies(enemies: BattleEnemy[], now: number): BattleEnemy[] {
  return enemies.filter((enemy) => enemy.hp > 0 && enemy.spawnAt <= now);
}

export function closestEnemy(
  enemies: BattleEnemy[],
  now: number,
): BattleEnemy | undefined {
  return [...aliveEnemies(enemies, now)].sort((a, b) => b.y - a.y)[0];
}

export function closestEnemyWithinRadius(
  enemies: BattleEnemy[],
  now: number,
  originX: number,
  originY: number,
  radius: number,
): BattleEnemy | undefined {
  return aliveEnemies(enemies, now)
    .filter((enemy) => Math.hypot(enemy.x - originX, enemy.y - originY) <= radius)
    .sort((a, b) => b.y - a.y)[0];
}

export function calculateCastleDiscDamage(playerDisc: DiscLevelConfig): number {
  return saturatingCombatProductInteger([
    playerDisc.damage,
    BATTLE_RULES.castleDiscDamageMultiplier,
  ]);
}

export function calculateBotDiscSize(playerDisc: DiscLevelConfig): number {
  return saturatingCombatProductInteger([
    playerDisc.size,
    BATTLE_RULES.botDiscSizeMultiplier,
  ]);
}

export function calculateGiantDiscDamage(
  playerDisc: DiscLevelConfig,
  bots: ActiveBot[] = [],
): number {
  const strongestNormalDiscDamage = bots.reduce((strongest, activeBot) => Math.max(
    strongest,
    saturatingCombatProduct([
      playerDisc.damage,
      activeBot.config.discDamageMultiplier,
      activeBot.count,
    ]),
  ), clampFiniteNumber(playerDisc.damage, { fallback: 0 }));
  return saturatingCombatProductInteger([
    strongestNormalDiscDamage,
    GIANT_DISC.damageMultiplier,
  ]);
}

export function calculateBotArmyDps(
  playerDisc: DiscLevelConfig,
  bots: ActiveBot[],
): number {
  return saturatingCombatSum(bots.map((activeBot) => saturatingCombatQuotient(
    saturatingCombatProduct([
      playerDisc.damage,
      activeBot.config.discDamageMultiplier,
      activeBot.count,
    ]),
    activeBot.config.attackIntervalMs / 1000,
  )));
}

export function calculateBossHealth(
  baseHp: number,
  difficulty: DifficultyConfig,
  playerDisc?: DiscLevelConfig,
  bots: ActiveBot[] = [],
): number {
  const tableHealth = saturatingCombatProductInteger([
    baseHp,
    difficulty.hpMultiplier,
  ], 'round', 1);
  if (!playerDisc || bots.length === 0) {
    return saturatingCombatProductInteger([
      tableHealth,
      BOSS_BEHAVIOR.globalDifficultyMultiplier,
    ], 'ceil', 1);
  }

  const survivalSeconds = clampFiniteNumber(
    BOSS_BALANCE.playerPowerBaseSurvivalSeconds * Math.pow(
      Math.max(1, difficulty.hpMultiplier / BOSS_BALANCE.hpMultiplierReference),
      BOSS_BALANCE.hpScalingExponent,
    ),
    {
      fallback: BOSS_BALANCE.maximumPowerScaledSurvivalSeconds,
      maximum: BOSS_BALANCE.maximumPowerScaledSurvivalSeconds,
    },
  );
  const armyDps = calculateBotArmyDps(playerDisc, bots);
  const powerScaledHealth = saturatingCombatProductInteger([
    armyDps,
    survivalSeconds,
  ], 'ceil');
  const strongestAutomaticHit = bots.reduce((strongest, activeBot) => Math.max(
    strongest,
    saturatingCombatProduct([
      playerDisc.damage,
      activeBot.config.discDamageMultiplier,
      activeBot.count,
    ]),
  ), 0);
  const antiOneShotHealth = saturatingCombatProductInteger([
    strongestAutomaticHit,
    BOSS_BALANCE.minimumAutomaticHitsToDefeat,
  ], 'ceil');
  return saturatingCombatProductInteger([
    Math.max(tableHealth, powerScaledHealth, antiOneShotHealth),
    BOSS_BEHAVIOR.globalDifficultyMultiplier,
  ], 'ceil', 1);
}

export function createBattleEnemies(
  difficulty: DifficultyConfig,
  now: number,
  playerDisc?: DiscLevelConfig,
  bots: ActiveBot[] = [],
): BattleEnemy[] {
  const wave = getEnemyWave(difficulty.enemyWaveId);
  const enemyDisc = getEnemyDisc(difficulty.enemyDiscLevel);
  return Array.from({ length: difficulty.enemyCount }, (_, index) => {
    const sequenceNumber = index + 1;
    const monsterId = wave.bossEveryEnemies > 0
      && sequenceNumber % wave.bossEveryEnemies === 0
      ? wave.bossMonsterId
      : wave.monsterPatternIds[index % wave.monsterPatternIds.length];
    const monster = getMonster(monsterId);
    const maxHp = calculateBossHealth(monster.baseHp, difficulty, playerDisc, bots);
    return {
      id: `enemy-${now}-${index}`,
      monsterId: monster.id,
      imageKey: monster.imageKey,
      name: monster.name,
      rank: monster.rank,
      hp: maxHp,
      maxHp,
      attack: clampSafeInteger(monster.baseAttack),
      moveSpeedMultiplier: clampFiniteNumber(monster.moveSpeedMultiplier),
      discDamageMultiplier: clampFiniteNumber(monster.discDamageMultiplier),
      sizeMultiplier: clampFiniteNumber(monster.sizeMultiplier),
      x: BATTLE_RULES.enemyX,
      y: BATTLE_RULES.enemyStartY,
      spawnAt: now,
      lastShotAt: now
        - enemyDisc.cooldownMs * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
        + BATTLE_RULES.enemyFirstShotDelayMs,
      lastMeleeAt: now,
      specialAttackCycleStartedAt: now,
      lastSpecialAttackAt: now,
      enraged: false,
    };
  });
}
