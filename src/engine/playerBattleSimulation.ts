import { BATTLE_RULES, BOSS_BEHAVIOR } from '../config';
import type { ActiveBot } from '../domain/gameSelectors';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingAdd,
  saturatingSubtract,
} from '../domain/safeNumbers';
import type { DiscLevelConfig } from '../types/game';
import { appendBattleEvent } from './battleEvents';
import {
  calculateBotDiscSize,
  closestEnemy,
  closestEnemyWithinRadius,
} from './battleModel';
import { saturatingCombatProductInteger } from './battleNumbers';
import type {
  BattleEventJournal,
  BattleFrame,
  BattleProjectile,
} from './battleTypes';

interface ResolvePlayerHitsOptions {
  now: number;
  deltaMs: number;
}

export function resolvePlayerHits(
  frame: BattleFrame,
  sourceProjectiles: BattleProjectile[],
  { now, deltaMs }: ResolvePlayerHitsOptions,
): BattleFrame {
  let enemies = frame.enemies;
  let killedEnemies = frame.killedEnemies;
  let notice = frame.notice;
  let noticeUntil = frame.noticeUntil;
  let eventJournal: BattleEventJournal = frame;
  const playerProjectiles: BattleProjectile[] = [];

  for (const originalProjectile of sourceProjectiles) {
    const target = originalProjectile.targetId
      ? enemies.find((enemy) => (
        enemy.id === originalProjectile.targetId && enemy.hp > 0 && enemy.spawnAt <= now
      ))
      : closestEnemy(enemies, now);
    const targetDistanceY = target ? target.y - originalProjectile.y : 0;
    const safeDeltaMs = clampFiniteNumber(deltaMs, {
      fallback: 0,
      maximum: BATTLE_RULES.maxDeltaMs,
    });
    const physicalTravelY = clampFiniteNumber(
      originalProjectile.speed
        * safeDeltaMs
        / BATTLE_RULES.playerProjectileMoveDivisor,
      { fallback: 0 },
    );
    const ageAtFrameStart = Math.max(
      0,
      now - safeDeltaMs - originalProjectile.createdAt,
    );
    const minimumFlightRemainingAtFrameStart = Math.max(
      safeDeltaMs,
      BATTLE_RULES.playerProjectileMinimumFlightMs - ageAtFrameStart,
    );
    const timedTravelY = Math.abs(targetDistanceY)
      * Math.min(1, safeDeltaMs / minimumFlightRemainingAtFrameStart);
    const travelY = ageAtFrameStart < BATTLE_RULES.playerProjectileMinimumFlightMs
      ? Math.min(physicalTravelY, timedTravelY)
      : physicalTravelY;
    const projectile = {
      ...originalProjectile,
      targetId: target?.id,
      x: target
        ? originalProjectile.x + (target.x - originalProjectile.x) * Math.min(
          1,
          safeDeltaMs / BATTLE_RULES.playerHomingMs,
        )
        : originalProjectile.x,
      y: target
        ? originalProjectile.y + Math.sign(targetDistanceY) * Math.min(
          Math.abs(targetDistanceY),
          travelY,
        )
        : originalProjectile.y - physicalTravelY,
    };
    const hitTarget = target
      && now - projectile.createdAt >= BATTLE_RULES.playerProjectileMinimumFlightMs
      && Math.abs(projectile.y - target.y) < BATTLE_RULES.playerHitToleranceY
      && Math.abs(projectile.x - target.x) < BATTLE_RULES.playerHitToleranceX;
    if (hitTarget) {
      const remainingHp = saturatingSubtract(target.hp, projectile.damage);
      const becameEnraged = remainingHp > 0
        && !target.enraged
        && remainingHp / target.maxHp <= BOSS_BEHAVIOR.enrageHealthRatio;
      enemies = enemies.map((enemy) => enemy.id === target.id
        ? { ...enemy, hp: remainingHp, enraged: enemy.enraged || becameEnraged }
        : enemy);
      if (remainingHp === 0) killedEnemies = saturatingAdd(killedEnemies, 1);
      if (becameEnraged) {
        notice = '보스 분노!';
        noticeUntil = saturatingAdd(now, BOSS_BEHAVIOR.enrageAnnouncementMs);
      }
      eventJournal = appendBattleEvent(
        eventJournal,
        remainingHp === 0
          ? 'enemyDefeated'
          : becameEnraged ? 'bossEnraged' : 'enemyHit',
        now,
        {
          amount: clampSafeInteger(Math.min(target.hp, projectile.damage)),
          x: target.x,
          y: target.y,
          attackSource: projectile.source,
        },
      );
    } else if (projectile.y >= BATTLE_RULES.playerProjectileEndY) {
      playerProjectiles.push(projectile);
    }
  }

  return {
    ...frame,
    ...eventJournal,
    enemies,
    playerProjectiles,
    killedEnemies,
    notice,
    noticeUntil,
  };
}

interface SpawnBotProjectilesOptions {
  bots: ActiveBot[];
  playerDisc: DiscLevelConfig;
  now: number;
  previousNow: number;
}

export function spawnBotProjectiles(
  frame: BattleFrame,
  { bots, playerDisc, now, previousNow }: SpawnBotProjectilesOptions,
): BattleFrame {
  const playerProjectiles = [...frame.playerProjectiles];
  const lastBotAttackAt = { ...frame.lastBotAttackAt };
  let eventJournal: BattleEventJournal = frame;

  for (const [botIndex, activeBot] of bots.entries()) {
    const botId = activeBot.config.id;
    const botSlot = BATTLE_RULES.botFormationSlots[
      botIndex % BATTLE_RULES.botFormationSlots.length
    ];
    const lastAttackAt = lastBotAttackAt[botId] ?? previousNow;
    const target = closestEnemyWithinRadius(
      frame.enemies,
      now,
      botSlot.x,
      botSlot.y,
      BATTLE_RULES.botAttackRadius,
    );
    if (!target || now - lastAttackAt < activeBot.config.attackIntervalMs) continue;

    playerProjectiles.push({
      id: `bot-disc-${botId}-${now}`,
      owner: 'player',
      source: 'bot',
      sourceBotId: botId,
      x: botSlot.x,
      y: botSlot.y,
      targetId: target.id,
      level: clampSafeInteger(playerDisc.level),
      damage: saturatingCombatProductInteger([
        playerDisc.damage,
        activeBot.config.discDamageMultiplier,
        activeBot.count,
      ]),
      size: calculateBotDiscSize(playerDisc),
      speed: clampSafeInteger(playerDisc.speed),
      createdAt: now,
    });
    lastBotAttackAt[botId] = now;
    eventJournal = appendBattleEvent(eventJournal, 'disc', now, {
      x: botSlot.x,
      y: botSlot.y,
      attackSource: 'bot',
    });
  }

  return {
    ...frame,
    ...eventJournal,
    playerProjectiles,
    lastBotAttackAt,
  };
}
