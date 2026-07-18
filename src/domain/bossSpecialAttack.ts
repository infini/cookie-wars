import { BOSS_SPECIAL_ATTACK } from '../config';

export interface BossSpecialAttackPose {
  pivotXRatio: number;
  pivotYRatio: number;
  rotationDeg: number;
  leanDeg: number;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  effectOpacity: number;
}

export function clampBattleAnimationProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function interpolate(from: number, to: number, phase: number): number {
  return from + (to - from) * clampBattleAnimationProgress(phase);
}

function easeOutCubic(progress: number): number {
  const clamped = clampBattleAnimationProgress(progress);
  return 1 - Math.pow(1 - clamped, 3);
}

function smoothStep(progress: number): number {
  const clamped = clampBattleAnimationProgress(progress);
  return clamped * clamped * (3 - 2 * clamped);
}

function createPose({
  rotationDeg,
  leanDeg,
  translateX,
  translateY,
  scaleX,
  scaleY,
  effectOpacity,
}: Omit<BossSpecialAttackPose, 'pivotXRatio' | 'pivotYRatio'>): BossSpecialAttackPose {
  return {
    pivotXRatio: BOSS_SPECIAL_ATTACK.spritePivotXRatio,
    pivotYRatio: BOSS_SPECIAL_ATTACK.spritePivotYRatio,
    rotationDeg,
    leanDeg,
    translateX,
    translateY,
    scaleX,
    scaleY,
    effectOpacity,
  };
}

export function getBossSpecialAttackPose(progress: number): BossSpecialAttackPose {
  const clamped = clampBattleAnimationProgress(progress);
  const windupPeak = BOSS_SPECIAL_ATTACK.windupPeakProgress;
  const slamPeak = BOSS_SPECIAL_ATTACK.slamPeakProgress;
  const recoveryPeak = BOSS_SPECIAL_ATTACK.recoveryPeakProgress;
  if (clamped <= windupPeak) {
    const phase = easeOutCubic(clamped / windupPeak);
    return createPose({
      rotationDeg: interpolate(0, BOSS_SPECIAL_ATTACK.windupRotationDeg, phase),
      leanDeg: interpolate(0, BOSS_SPECIAL_ATTACK.windupLeanDeg, phase),
      translateX: interpolate(0, BOSS_SPECIAL_ATTACK.windupTranslateXPixels, phase),
      translateY: interpolate(0, -BOSS_SPECIAL_ATTACK.windupLiftPixels, phase),
      scaleX: interpolate(1, BOSS_SPECIAL_ATTACK.windupScale, phase),
      scaleY: interpolate(1, BOSS_SPECIAL_ATTACK.windupScale, phase),
      effectOpacity: 0,
    });
  }
  if (clamped < slamPeak) {
    const phase = smoothStep((clamped - windupPeak) / (slamPeak - windupPeak));
    return createPose({
      rotationDeg: interpolate(
        BOSS_SPECIAL_ATTACK.windupRotationDeg,
        BOSS_SPECIAL_ATTACK.slamRotationDeg,
        phase,
      ),
      leanDeg: interpolate(
        BOSS_SPECIAL_ATTACK.windupLeanDeg,
        BOSS_SPECIAL_ATTACK.slamLeanDeg,
        phase,
      ),
      translateX: interpolate(
        BOSS_SPECIAL_ATTACK.windupTranslateXPixels,
        BOSS_SPECIAL_ATTACK.slamTranslateXPixels,
        phase,
      ),
      translateY: interpolate(
        -BOSS_SPECIAL_ATTACK.windupLiftPixels,
        BOSS_SPECIAL_ATTACK.slamDropPixels,
        phase,
      ),
      scaleX: interpolate(BOSS_SPECIAL_ATTACK.windupScale, BOSS_SPECIAL_ATTACK.slamScaleX, phase),
      scaleY: interpolate(BOSS_SPECIAL_ATTACK.windupScale, BOSS_SPECIAL_ATTACK.slamScaleY, phase),
      effectOpacity: 0,
    });
  }
  const fullRecovery = (clamped - slamPeak) / (1 - slamPeak);
  if (clamped <= recoveryPeak) {
    const phase = easeOutCubic((clamped - slamPeak) / (recoveryPeak - slamPeak));
    return createPose({
      rotationDeg: interpolate(
        BOSS_SPECIAL_ATTACK.slamRotationDeg,
        BOSS_SPECIAL_ATTACK.recoveryRotationDeg,
        phase,
      ),
      leanDeg: interpolate(
        BOSS_SPECIAL_ATTACK.slamLeanDeg,
        BOSS_SPECIAL_ATTACK.recoveryLeanDeg,
        phase,
      ),
      translateX: interpolate(
        BOSS_SPECIAL_ATTACK.slamTranslateXPixels,
        BOSS_SPECIAL_ATTACK.recoveryTranslateXPixels,
        phase,
      ),
      translateY: interpolate(
        BOSS_SPECIAL_ATTACK.slamDropPixels,
        BOSS_SPECIAL_ATTACK.recoveryTranslateYPixels,
        phase,
      ),
      scaleX: interpolate(
        BOSS_SPECIAL_ATTACK.slamScaleX,
        BOSS_SPECIAL_ATTACK.recoveryScaleX,
        phase,
      ),
      scaleY: interpolate(
        BOSS_SPECIAL_ATTACK.slamScaleY,
        BOSS_SPECIAL_ATTACK.recoveryScaleY,
        phase,
      ),
      effectOpacity: 1 - fullRecovery,
    });
  }
  const settle = smoothStep((clamped - recoveryPeak) / (1 - recoveryPeak));
  return createPose({
    rotationDeg: interpolate(BOSS_SPECIAL_ATTACK.recoveryRotationDeg, 0, settle),
    leanDeg: interpolate(BOSS_SPECIAL_ATTACK.recoveryLeanDeg, 0, settle),
    translateX: interpolate(BOSS_SPECIAL_ATTACK.recoveryTranslateXPixels, 0, settle),
    translateY: interpolate(BOSS_SPECIAL_ATTACK.recoveryTranslateYPixels, 0, settle),
    scaleX: interpolate(BOSS_SPECIAL_ATTACK.recoveryScaleX, 1, settle),
    scaleY: interpolate(BOSS_SPECIAL_ATTACK.recoveryScaleY, 1, settle),
    effectOpacity: 1 - fullRecovery,
  });
}

export function getBossSpecialAttackImpactProgress(progress: number): number | null {
  const clamped = clampBattleAnimationProgress(progress);
  if (clamped < BOSS_SPECIAL_ATTACK.slamPeakProgress) return null;
  return (clamped - BOSS_SPECIAL_ATTACK.slamPeakProgress)
    / (1 - BOSS_SPECIAL_ATTACK.slamPeakProgress);
}

export function getBossSpecialAttackProgress(
  lastSpecialAttackAt: number,
  spawnAt: number,
  now: number,
): number | null {
  const ageMs = now - lastSpecialAttackAt;
  if (
    lastSpecialAttackAt <= spawnAt
    || ageMs < 0
    || ageMs > BOSS_SPECIAL_ATTACK.animationDurationMs
  ) return null;
  return clampBattleAnimationProgress(ageMs / BOSS_SPECIAL_ATTACK.animationDurationMs);
}
