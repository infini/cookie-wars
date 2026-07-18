import {
  BOSS_ANIMATION,
  BATTLE_RULES,
  getBossAnimation,
} from '../config';
import type { BattleAttackKind } from '../engine/battleTypes';

export type BossAnimationPhase =
  | 'idle'
  | 'walk'
  | 'hammerWindup'
  | 'hammerImpact'
  | 'hammerRecovery';

export interface BossAnimationFrame {
  phase: BossAnimationPhase;
  imageKey: string;
  attackKind: BattleAttackKind | null;
  impactEffectProgress: number | null;
}

interface BossAnimationFrameInput {
  monsterId: string;
  fallbackImageKey: string;
  y: number;
  moving: boolean;
  strongAttackWindupVisible: boolean;
  now: number;
  spawnAt: number;
  lastSpecialAttackAt: number;
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function getBossImpactEffectProgress(
  attackAt: number | null,
  now: number,
): number | null {
  if (attackAt === null) return null;
  const ageMs = now - attackAt;
  if (ageMs < 0 || ageMs > BOSS_ANIMATION.impactEffectDurationMs) return null;
  return clampProgress(ageMs / BOSS_ANIMATION.impactEffectDurationMs);
}

export function getBossWalkFrameIndex(y: number): number {
  const distance = Math.max(0, y - BATTLE_RULES.enemyStartY);
  const cycleProgress = (distance / BOSS_ANIMATION.walkDistancePerCycle) % 1;
  const sequenceIndex = Math.min(
    BOSS_ANIMATION.walkFrameSequence.length - 1,
    Math.floor(cycleProgress * BOSS_ANIMATION.walkFrameSequence.length),
  );
  return BOSS_ANIMATION.walkFrameSequence[sequenceIndex];
}

export function getBossAnimationFrame({
  monsterId,
  fallbackImageKey,
  y,
  moving,
  strongAttackWindupVisible,
  now,
  spawnAt,
  lastSpecialAttackAt,
}: BossAnimationFrameInput): BossAnimationFrame {
  const set = getBossAnimation(monsterId);
  const strongAttackAt = lastSpecialAttackAt > spawnAt
    ? lastSpecialAttackAt
    : null;
  const impactEffectProgress = getBossImpactEffectProgress(
    strongAttackAt,
    now,
  );
  if (!set) {
    return {
      phase: moving ? 'walk' : 'idle',
      imageKey: fallbackImageKey,
      attackKind: strongAttackAt === null ? null : 'special',
      impactEffectProgress,
    };
  }

  if (strongAttackAt !== null) {
    const attackAgeMs = now - strongAttackAt;
    if (attackAgeMs >= 0 && attackAgeMs <= BOSS_ANIMATION.impactHoldMs) {
      return {
        phase: 'hammerImpact',
        imageKey: set.hammerImpactImageKey,
        attackKind: 'special',
        impactEffectProgress,
      };
    }
    if (
      attackAgeMs > BOSS_ANIMATION.impactHoldMs
      && attackAgeMs <= BOSS_ANIMATION.impactHoldMs + BOSS_ANIMATION.recoveryMs
    ) {
      return {
        phase: 'hammerRecovery',
        imageKey: set.hammerRecoveryImageKey,
        attackKind: 'special',
        impactEffectProgress,
      };
    }
  }

  if (strongAttackWindupVisible) {
    return {
      phase: 'hammerWindup',
      imageKey: set.hammerWindupImageKey,
      attackKind: null,
      impactEffectProgress,
    };
  }

  if (moving) {
    const walkFrameIndex = getBossWalkFrameIndex(y);
    return {
      phase: 'walk',
      imageKey: set.walkImageKeys[walkFrameIndex],
      attackKind: null,
      impactEffectProgress,
    };
  }

  return {
    phase: 'idle',
    imageKey: fallbackImageKey,
    attackKind: null,
    impactEffectProgress,
  };
}
