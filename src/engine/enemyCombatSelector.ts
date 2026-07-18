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
    - (now - enemy.lastSpecialAttackAt);
  const battleActive = status === 'active';
  const projectileAttackReady = battleActive
    && inAttackRange
    && !hasProjectileInFlight
    && timeUntilAttackMs <= 0;
  const meleeAttackReady = battleActive
    && enemy.y >= BATTLE_RULES.enemyMeleeTriggerY
    && timeUntilMeleeMs <= 0;
  const specialAttackDue = timeUntilSpecialAttackMs <= 0;
  const projectileWindupVisible = battleActive
    && inAttackRange
    && !hasProjectileInFlight
    && timeUntilAttackMs > 0
    && timeUntilAttackMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
  const meleeWindupVisible = battleActive
    && enemy.y >= BATTLE_RULES.enemyMeleeTriggerY
    && timeUntilMeleeMs > 0
    && timeUntilMeleeMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
  const specialWindupVisible = battleActive
    && inAttackRange
    && !hasProjectileInFlight
    && timeUntilSpecialAttackMs > 0
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
      ? 1 - timeUntilSpecialAttackMs / BOSS_SPECIAL_ATTACK.windupMs
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
