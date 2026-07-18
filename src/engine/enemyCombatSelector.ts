import {
  BATTLE_FEEDBACK,
  BATTLE_RULES,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
} from '../config';
import type {
  BattleEnemy,
  BattleProjectile,
  BattleStatus,
} from './battleTypes';

interface EnemyCombatSelectorInput {
  enemy: BattleEnemy;
  enemyProjectiles: BattleProjectile[];
  status: BattleStatus;
  now: number;
  enemyDiscCooldownMs: number;
  enemyDiscSpeed: number;
}

export interface EnemyCombatTiming {
  distanceToCastle: number;
  inAttackRange: boolean;
  hasProjectileInFlight: boolean;
  attackCooldownMs: number;
  meleeCooldownMs: number;
  timeUntilAttackMs: number;
  timeUntilMeleeMs: number;
  timeUntilSpecialAttackMs: number;
  projectileFlightMs: number;
  specialChannelReserved: boolean;
  projectileAttackReady: boolean;
  meleeAttackReady: boolean;
  specialAttackDue: boolean;
  projectileWindupVisible: boolean;
  meleeWindupVisible: boolean;
  specialWindupVisible: boolean;
  windupVisible: boolean;
  windupProgress: number;
}

export function selectEnemyCombatTiming({
  enemy,
  enemyProjectiles,
  status,
  now,
  enemyDiscCooldownMs,
  enemyDiscSpeed,
}: EnemyCombatSelectorInput): EnemyCombatTiming {
  const distanceToCastle = Math.hypot(
    enemy.x - BATTLE_RULES.playerStartX,
    enemy.y - BATTLE_RULES.playerStartY,
  );
  const inAttackRange = distanceToCastle <= BATTLE_RULES.enemyAttackRadius;
  const hasProjectileInFlight = enemyProjectiles.some(
    (projectile) => projectile.sourceEnemyId === enemy.id,
  );
  const enrageCooldownMultiplier = enemy.enraged
    ? BOSS_BEHAVIOR.enrageAttackCooldownMultiplier
    : 1;
  const attackCooldownMs = enemyDiscCooldownMs
    * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
    * enrageCooldownMultiplier;
  const meleeCooldownMs = BATTLE_RULES.enemyMeleeIntervalMs
    * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
    * enrageCooldownMultiplier;
  const timeUntilAttackMs = attackCooldownMs - (now - enemy.lastShotAt);
  const timeUntilMeleeMs = meleeCooldownMs - (now - enemy.lastMeleeAt);
  const timeUntilSpecialAttackMs = BOSS_SPECIAL_ATTACK.intervalMs
    - (now - enemy.specialAttackCycleStartedAt);
  const projectileTravelDistance = Math.max(
    0,
    BATTLE_RULES.coreProjectileHitY
      - (enemy.y + BATTLE_RULES.enemyProjectileStartOffsetY),
  );
  const projectileFlightMs = projectileTravelDistance
    * BATTLE_RULES.enemyProjectileMoveDivisor
    / Math.max(1, enemyDiscSpeed);
  const specialChannelReserved = timeUntilSpecialAttackMs > 0
    && timeUntilSpecialAttackMs
      <= BOSS_SPECIAL_ATTACK.windupMs + projectileFlightMs;
  const battleActive = status === 'active';
  const specialAttackDue = timeUntilSpecialAttackMs <= 0;
  const projectileAttackReady = battleActive
    && inAttackRange
    && !hasProjectileInFlight
    && (
      specialAttackDue
      || (timeUntilAttackMs <= 0 && !specialChannelReserved)
    );
  const meleeAttackReady = battleActive
    && enemy.y >= BATTLE_RULES.enemyMeleeTriggerY
    && timeUntilMeleeMs <= 0;
  const projectileWindupVisible = battleActive
    && inAttackRange
    && !hasProjectileInFlight
    && !specialChannelReserved
    && timeUntilAttackMs > 0
    && timeUntilAttackMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
  const meleeWindupVisible = battleActive
    && enemy.y >= BATTLE_RULES.enemyMeleeTriggerY
    && timeUntilMeleeMs > 0
    && timeUntilMeleeMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
  const specialWindupVisible = battleActive
    && inAttackRange
    && timeUntilSpecialAttackMs <= BOSS_SPECIAL_ATTACK.windupMs;
  const windupVisible = projectileWindupVisible
    || meleeWindupVisible
    || specialWindupVisible;
  const windupProgress = Math.max(
    projectileWindupVisible
      ? 1 - timeUntilAttackMs / BATTLE_FEEDBACK.enemyAttackWindupMs
      : 0,
    meleeWindupVisible
      ? 1 - timeUntilMeleeMs / BATTLE_FEEDBACK.enemyAttackWindupMs
      : 0,
    specialWindupVisible
      ? Math.max(
        0,
        Math.min(1, 1 - timeUntilSpecialAttackMs / BOSS_SPECIAL_ATTACK.windupMs),
      )
      : 0,
  );

  return {
    distanceToCastle,
    inAttackRange,
    hasProjectileInFlight,
    attackCooldownMs,
    meleeCooldownMs,
    timeUntilAttackMs,
    timeUntilMeleeMs,
    timeUntilSpecialAttackMs,
    projectileFlightMs,
    specialChannelReserved,
    projectileAttackReady,
    meleeAttackReady,
    specialAttackDue,
    projectileWindupVisible,
    meleeWindupVisible,
    specialWindupVisible,
    windupVisible,
    windupProgress,
  };
}
