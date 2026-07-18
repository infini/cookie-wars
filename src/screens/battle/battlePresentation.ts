import { BATTLE_FEEDBACK, BOSS_SPECIAL_ATTACK } from '../../config';
import {
  getBossSpecialAttackImpactProgress,
  getBossSpecialAttackPose,
  getBossSpecialAttackProgress,
} from '../../domain/bossSpecialAttack';
import type { BattleEnemy, BattleEvent } from '../../engine/useBattleEngine';

interface BattlePresentationInput {
  now: number;
  enemies: BattleEnemy[];
  presentationEvent: BattleEvent | null;
}

export function getBattleScreenPresentation({
  now,
  enemies,
  presentationEvent,
}: BattlePresentationInput) {
  const presentationEventAgeMs = presentationEvent
    ? Math.max(0, now - presentationEvent.at)
    : Number.POSITIVE_INFINITY;
  const castleHitVisible = Boolean(
    presentationEvent?.kind === 'castleHit'
    && presentationEventAgeMs <= BATTLE_FEEDBACK.castleHitDurationMs,
  );
  const castleHitProgress = castleHitVisible
    ? Math.min(1, presentationEventAgeMs / BATTLE_FEEDBACK.castleHitDurationMs)
    : 1;
  const castleHitWave = castleHitVisible ? Math.sin(castleHitProgress * Math.PI) : 0;
  const castleHitShake = castleHitVisible
    ? Math.sin(
      castleHitProgress * Math.PI * BATTLE_FEEDBACK.enemyHitShakeCycles,
    ) * BATTLE_FEEDBACK.castleHitShakePixels * (1 - castleHitProgress)
    : 0;
  const specialAttackingBoss = enemies.find((enemy) => (
    getBossSpecialAttackProgress(
      enemy.lastSpecialAttackAt,
      enemy.spawnAt,
      now,
    ) !== null
  ));
  const bossSpecialAttackProgress = specialAttackingBoss
    ? getBossSpecialAttackProgress(
      specialAttackingBoss.lastSpecialAttackAt,
      specialAttackingBoss.spawnAt,
      now,
    )
    : null;
  const bossSpecialAttackFlashOpacity = bossSpecialAttackProgress === null
    ? 0
    : getBossSpecialAttackPose(bossSpecialAttackProgress).effectOpacity
      * BOSS_SPECIAL_ATTACK.screenFlashMaximumOpacity;
  const bossSpecialAttackImpactProgress = bossSpecialAttackProgress === null
    ? null
    : getBossSpecialAttackImpactProgress(bossSpecialAttackProgress);
  const bossSpecialAttackScreenShake = bossSpecialAttackImpactProgress === null
    ? 0
    : Math.sin(
      bossSpecialAttackImpactProgress
        * BOSS_SPECIAL_ATTACK.screenShakeCycles
        * Math.PI,
    )
      * BOSS_SPECIAL_ATTACK.screenShakePixels
      * (1 - bossSpecialAttackImpactProgress);

  return {
    presentationEvent,
    presentationEventAgeMs,
    castleHitVisible,
    castleHitWave,
    castleHitShake,
    bossSpecialAttackProgress,
    bossSpecialAttackFlashOpacity,
    bossSpecialAttackScreenShake,
    remainingEnemyCount: enemies.filter((enemy) => enemy.hp > 0).length,
    displayedBoss: enemies.find((enemy) => enemy.hp > 0) ?? enemies[0],
  };
}
