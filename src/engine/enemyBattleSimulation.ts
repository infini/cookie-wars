import {
  BATTLE_RULES,
  BOSS_BEHAVIOR,
} from '../config';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingSubtract,
} from '../domain/safeNumbers';
import type { DifficultyConfig, EnemyDiscConfig } from '../types/game';
import { appendBattleEvent } from './battleEvents';
import { aliveEnemies } from './battleModel';
import {
  saturatingCombatProduct,
  saturatingCombatProductInteger,
  saturatingCombatSum,
} from './battleNumbers';
import { selectEnemyCombatTiming } from './enemyCombatSelector';
import type {
  BattleEnemy,
  BattleEventJournal,
  BattleFrame,
  BattleProjectile,
} from './battleTypes';

interface MoveEnemyOptions {
  difficulty: DifficultyConfig;
  now: number;
  deltaMs: number;
}

export function moveEnemies(
  enemies: BattleEnemy[],
  { difficulty, now, deltaMs }: MoveEnemyOptions,
): BattleEnemy[] {
  const safeDeltaMs = clampFiniteNumber(deltaMs, {
    fallback: 0,
    maximum: BATTLE_RULES.maxDeltaMs,
  });
  return enemies.map((enemy) => {
    if (enemy.hp <= 0 || enemy.spawnAt > now) return enemy;
    const approach = enemy.y < BATTLE_RULES.enemyStopY
      ? clampFiniteNumber(
          difficulty.moveSpeed
            * BOSS_BEHAVIOR.globalMoveSpeedMultiplier
            * enemy.moveSpeedMultiplier
            * safeDeltaMs
            / BATTLE_RULES.enemyMoveDivisor,
          { fallback: 0 },
        )
      : 0;
    const nextY = Math.min(BATTLE_RULES.enemyStopY, enemy.y + approach);
    const distanceBeforeMove = Math.hypot(
      enemy.x - BATTLE_RULES.playerStartX,
      enemy.y - BATTLE_RULES.playerStartY,
    );
    const distanceAfterMove = Math.hypot(
      enemy.x - BATTLE_RULES.playerStartX,
      nextY - BATTLE_RULES.playerStartY,
    );
    const enteredAttackRange = distanceBeforeMove > BATTLE_RULES.enemyAttackRadius
      && distanceAfterMove <= BATTLE_RULES.enemyAttackRadius;
    const enteredMeleeRange = enemy.y < BATTLE_RULES.enemyMeleeTriggerY
      && nextY >= BATTLE_RULES.enemyMeleeTriggerY;
    return {
      ...enemy,
      y: nextY,
      lastShotAt: enteredAttackRange ? now : enemy.lastShotAt,
      specialAttackCycleStartedAt: enteredAttackRange
        ? now
        : enemy.specialAttackCycleStartedAt,
      lastMeleeAt: enteredMeleeRange ? now : enemy.lastMeleeAt,
    };
  });
}

export function moveEnemyProjectiles(
  projectiles: BattleProjectile[],
  deltaMs: number,
): BattleProjectile[] {
  const safeDeltaMs = clampFiniteNumber(deltaMs, {
    fallback: 0,
    maximum: BATTLE_RULES.maxDeltaMs,
  });
  return projectiles.map((projectile) => ({
    ...projectile,
    y: clampFiniteNumber(
      projectile.y
        + projectile.speed
          * safeDeltaMs
          / BATTLE_RULES.enemyProjectileMoveDivisor,
      { fallback: BATTLE_RULES.coreProjectileHitY },
    ),
  }));
}

interface ResolveBossAttacksOptions {
  difficulty: DifficultyConfig;
  enemyDisc: EnemyDiscConfig;
  now: number;
}

export function resolveBossAttacks(
  frame: BattleFrame,
  { difficulty, enemyDisc, now }: ResolveBossAttacksOptions,
): BattleFrame {
  let enemies = frame.enemies;
  let enemyProjectiles = [...frame.enemyProjectiles];
  let baseHealth = frame.baseHealth;
  let eventJournal: BattleEventJournal = frame;

  for (const enemy of aliveEnemies(enemies, now)) {
    if (
      enemyProjectiles.length
      >= BATTLE_RULES.maximumSimultaneousEnemyProjectiles
    ) break;
    const combat = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles,
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    if (!combat.projectileAttackReady) continue;

    enemyProjectiles.push({
      id: `enemy-disc-${enemy.id}-${now}`,
      owner: 'enemy',
      sourceEnemyId: enemy.id,
      attackKind: combat.specialAttackDue ? 'special' : 'projectile',
      x: enemy.x,
      y: enemy.y + BATTLE_RULES.enemyProjectileStartOffsetY,
      level: clampSafeInteger(enemyDisc.level),
      damage: saturatingCombatProduct([
        enemyDisc.damage,
        enemy.discDamageMultiplier,
        enemy.enraged ? BOSS_BEHAVIOR.enrageProjectileDamageMultiplier : 1,
      ]),
      size: clampSafeInteger(enemyDisc.size),
      speed: clampSafeInteger(enemyDisc.speed),
      createdAt: now,
    });
    enemies = enemies.map((item) => item.id === enemy.id
      ? {
        ...item,
        lastShotAt: now,
        specialAttackCycleStartedAt: combat.specialAttackDue
          ? now
          : item.specialAttackCycleStartedAt,
        lastSpecialAttackAt: combat.specialAttackDue
          ? now
          : item.lastSpecialAttackAt,
      }
      : item);
    eventJournal = appendBattleEvent(
      eventJournal,
      combat.specialAttackDue ? 'bossSpecialAttack' : 'enemyDisc',
      now,
      {
        x: enemy.x,
        y: enemy.y,
        sourceEnemyId: enemy.id,
        attackKind: combat.specialAttackDue ? 'special' : 'projectile',
      },
    );
  }

  const coreHits = enemyProjectiles.filter(
    (projectile) => projectile.y >= BATTLE_RULES.coreProjectileHitY,
  );
  if (coreHits.length > 0) {
    const damage = saturatingCombatSum(coreHits.map((projectile) => projectile.damage));
    const appliedDamage = saturatingCombatProductInteger([
      damage,
      difficulty.attackMultiplier,
      BOSS_BEHAVIOR.globalAttackDamageMultiplier,
      BOSS_BEHAVIOR.globalDifficultyMultiplier,
    ]);
    baseHealth = saturatingSubtract(baseHealth, appliedDamage);
    enemyProjectiles = enemyProjectiles.filter(
      (projectile) => projectile.y < BATTLE_RULES.coreProjectileHitY,
    );
    eventJournal = appendBattleEvent(eventJournal, 'castleHit', now, {
      amount: appliedDamage,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.playerStartY,
      sourceEnemyId: coreHits[0].sourceEnemyId,
      attackKind: coreHits[0].attackKind ?? 'projectile',
    });
  }

  for (const enemy of aliveEnemies(enemies, now)) {
    const combat = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles,
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    if (!combat.meleeAttackReady) continue;

    const damage = saturatingCombatProductInteger([
      enemy.attack,
      difficulty.attackMultiplier,
      BOSS_BEHAVIOR.globalAttackDamageMultiplier,
      BOSS_BEHAVIOR.globalDifficultyMultiplier,
      enemy.enraged ? BOSS_BEHAVIOR.enrageMeleeDamageMultiplier : 1,
    ], 'round', 1);
    baseHealth = saturatingSubtract(baseHealth, damage);
    enemies = enemies.map((item) => item.id === enemy.id
      ? {
        ...item,
        lastMeleeAt: now,
      }
      : item);
    eventJournal = appendBattleEvent(eventJournal, 'castleHit', now, {
      amount: damage,
      x: BATTLE_RULES.playerStartX,
      y: BATTLE_RULES.playerStartY,
      sourceEnemyId: enemy.id,
      attackKind: 'melee',
    });
  }

  return {
    ...frame,
    ...eventJournal,
    enemies,
    enemyProjectiles,
    baseHealth,
  };
}
