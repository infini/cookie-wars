import { BATTLE_FEEDBACK, BOSS_SPECIAL_ATTACK } from '../../config';
import { getBossImpactEffectProgress } from '../../domain/bossAnimation';
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
    enemy.lastSpecialAttackAt > enemy.spawnAt
    && getBossImpactEffectProgress(enemy.lastSpecialAttackAt, now) !== null
  ));
  const bossSpecialAttackProgress = specialAttackingBoss
    ? getBossImpactEffectProgress(specialAttackingBoss.lastSpecialAttackAt, now)
    : null;
  const bossSpecialAttackFlashOpacity = bossSpecialAttackProgress === null
    ? 0
    : (1 - bossSpecialAttackProgress) * BOSS_SPECIAL_ATTACK.screenFlashMaximumOpacity;
  const bossSpecialAttackScreenShake = bossSpecialAttackProgress === null
    ? 0
    : Math.sin(
      bossSpecialAttackProgress
        * BOSS_SPECIAL_ATTACK.screenShakeCycles
        * Math.PI,
    )
      * BOSS_SPECIAL_ATTACK.screenShakePixels
      * (1 - bossSpecialAttackProgress);

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
