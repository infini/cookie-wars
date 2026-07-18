import {
  BATTLE_FEEDBACK,
  BATTLE_RULES,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
  DIFFICULTIES,
  getEnemyDisc,
} from '../src/config';
import { selectEnemyCombatTiming } from '../src/engine/enemyCombatSelector';
import type {
  BattleEnemy,
  BattleProjectile,
} from '../src/engine/battleTypes';

function enemyAt(y: number): BattleEnemy {
  return {
    id: 'boss-1',
    monsterId: 'boss-1',
    imageKey: 'boss-1',
    name: '테스트 보스',
    rank: '보스',
    hp: 100,
    maxHp: 100,
    attack: 10,
    moveSpeedMultiplier: 1,
    discDamageMultiplier: 1,
    sizeMultiplier: 1,
    x: BATTLE_RULES.playerStartX,
    y,
    spawnAt: 0,
    lastShotAt: 0,
    lastMeleeAt: 0,
    specialAttackCycleStartedAt: 0,
    lastSpecialAttackAt: 0,
    enraged: false,
  };
}

function flyingProjectile(enemyId: string): BattleProjectile {
  return {
    id: 'enemy-disc',
    owner: 'enemy',
    sourceEnemyId: enemyId,
    x: BATTLE_RULES.playerStartX,
    y: BATTLE_RULES.enemyStopY,
    level: 1,
    damage: 1,
    size: 1,
    speed: 1,
    createdAt: 0,
  };
}

describe('보스 공격 타이밍 selector', () => {
  const enemyDisc = getEnemyDisc(DIFFICULTIES[0].enemyDiscLevel);
  const now = 10_000;

  test('사거리·쿨타임·비행 중 원반을 함께 확인해 원거리 공격을 판정한다', () => {
    const enemy = enemyAt(BATTLE_RULES.enemyStopY);
    const cooldownMs = enemyDisc.cooldownMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier;
    enemy.lastShotAt = now - cooldownMs;
    enemy.lastSpecialAttackAt = now;
    enemy.specialAttackCycleStartedAt = now;

    const ready = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(ready.inAttackRange).toBe(true);
    expect(ready.projectileAttackReady).toBe(true);

    const blocked = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [flyingProjectile(enemy.id)],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(blocked.hasProjectileInFlight).toBe(true);
    expect(blocked.projectileAttackReady).toBe(false);
    expect(blocked.projectileWindupVisible).toBe(false);
  });

  test('원거리 공격 직전의 windup 진행률을 화면과 엔진이 공유한다', () => {
    const enemy = enemyAt(BATTLE_RULES.enemyStopY);
    const cooldownMs = enemyDisc.cooldownMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier;
    const remainingMs = BATTLE_FEEDBACK.enemyAttackWindupMs / 2;
    enemy.lastShotAt = now - (cooldownMs - remainingMs);
    enemy.lastSpecialAttackAt = now;
    enemy.specialAttackCycleStartedAt = now;

    const timing = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(timing.projectileAttackReady).toBe(false);
    expect(timing.projectileWindupVisible).toBe(true);
    expect(timing.windupVisible).toBe(true);
    expect(timing.windupProgress).toBeCloseTo(0.5);
  });

  test('근접 공격의 준비 연출과 실제 공격 시점을 같은 쿨타임으로 계산한다', () => {
    const enemy = enemyAt(BATTLE_RULES.enemyMeleeTriggerY);
    const meleeCooldownMs = BATTLE_RULES.enemyMeleeIntervalMs
      * BOSS_BEHAVIOR.globalAttackCooldownMultiplier;
    const remainingMs = BATTLE_FEEDBACK.enemyAttackWindupMs / 2;
    enemy.lastMeleeAt = now - (meleeCooldownMs - remainingMs);
    enemy.lastShotAt = now;
    enemy.lastSpecialAttackAt = now;
    enemy.specialAttackCycleStartedAt = now;

    const windup = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(windup.meleeWindupVisible).toBe(true);
    expect(windup.meleeAttackReady).toBe(false);

    enemy.lastMeleeAt = now - meleeCooldownMs;
    const ready = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(ready.meleeWindupVisible).toBe(false);
    expect(ready.meleeAttackReady).toBe(true);
  });

  test('분노 상태와 강공격 준비 시간도 공용 selector에서 계산한다', () => {
    const enemy = enemyAt(BATTLE_RULES.enemyStopY);
    enemy.enraged = true;
    enemy.lastShotAt = now;
    enemy.lastSpecialAttackAt = now - (
      BOSS_SPECIAL_ATTACK.intervalMs - BOSS_SPECIAL_ATTACK.windupMs / 2
    );
    enemy.specialAttackCycleStartedAt = enemy.lastSpecialAttackAt;

    const timing = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(timing.attackCooldownMs).toBe(
      enemyDisc.cooldownMs
        * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
        * BOSS_BEHAVIOR.enrageAttackCooldownMultiplier,
    );
    expect(timing.specialWindupVisible).toBe(true);
    expect(timing.specialAttackDue).toBe(false);

    enemy.lastSpecialAttackAt = now - BOSS_SPECIAL_ATTACK.intervalMs;
    enemy.specialAttackCycleStartedAt = enemy.lastSpecialAttackAt;
    const due = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(due.specialAttackDue).toBe(true);
    expect(due.projectileAttackReady).toBe(true);
    expect(due.specialWindupVisible).toBe(true);
    expect(due.windupProgress).toBe(1);

    const heldForProjectile = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [flyingProjectile(enemy.id)],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(heldForProjectile.projectileAttackReady).toBe(false);
    expect(heldForProjectile.specialWindupVisible).toBe(true);
    expect(heldForProjectile.windupProgress).toBe(1);
  });

  test('전투가 끝났거나 사거리 밖이면 공격과 windup을 모두 비활성화한다', () => {
    const enemy = enemyAt(BATTLE_RULES.enemyStartY);
    enemy.lastShotAt = 0;
    enemy.lastMeleeAt = 0;
    enemy.lastSpecialAttackAt = 0;

    const outside = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'active',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(outside.inAttackRange).toBe(false);
    expect(outside.projectileAttackReady).toBe(false);
    expect(outside.projectileWindupVisible).toBe(false);

    enemy.y = BATTLE_RULES.enemyStopY;
    const ended = selectEnemyCombatTiming({
      enemy,
      enemyProjectiles: [],
      status: 'victory',
      now,
      enemyDiscCooldownMs: enemyDisc.cooldownMs,
      enemyDiscSpeed: enemyDisc.speed,
    });
    expect(ended.projectileAttackReady).toBe(false);
    expect(ended.meleeAttackReady).toBe(false);
    expect(ended.windupVisible).toBe(false);
  });
});
