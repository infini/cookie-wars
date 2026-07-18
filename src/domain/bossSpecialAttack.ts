import { BOSS_SPECIAL_ATTACK } from '../config';

export interface BossSpecialAttackPose {
  rotationDeg: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  effectOpacity: number;
}

export function clampBattleAnimationProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function getBossSpecialAttackPose(progress: number): BossSpecialAttackPose {
  const clamped = clampBattleAnimationProgress(progress);
  const windupPeak = BOSS_SPECIAL_ATTACK.windupPeakProgress;
  const slamPeak = BOSS_SPECIAL_ATTACK.slamPeakProgress;
  const interpolate = (from: number, to: number, phase: number): number => (
    from + (to - from) * clampBattleAnimationProgress(phase)
  );
  if (clamped <= windupPeak) {
    const phase = clamped / windupPeak;
    return {
      rotationDeg: interpolate(0, BOSS_SPECIAL_ATTACK.windupRotationDeg, phase),
      translateY: interpolate(0, -BOSS_SPECIAL_ATTACK.windupLiftPixels, phase),
      scaleX: interpolate(1, BOSS_SPECIAL_ATTACK.windupScale, phase),
      scaleY: interpolate(1, BOSS_SPECIAL_ATTACK.windupScale, phase),
      effectOpacity: 0,
    };
  }
  if (clamped <= slamPeak) {
    const phase = (clamped - windupPeak) / (slamPeak - windupPeak);
    return {
      rotationDeg: interpolate(
        BOSS_SPECIAL_ATTACK.windupRotationDeg,
        BOSS_SPECIAL_ATTACK.slamRotationDeg,
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
    };
  }
  const recovery = (clamped - slamPeak) / (1 - slamPeak);
  return {
    rotationDeg: interpolate(BOSS_SPECIAL_ATTACK.slamRotationDeg, 0, recovery),
    translateY: interpolate(BOSS_SPECIAL_ATTACK.slamDropPixels, 0, recovery),
    scaleX: interpolate(BOSS_SPECIAL_ATTACK.slamScaleX, 1, recovery),
    scaleY: interpolate(BOSS_SPECIAL_ATTACK.slamScaleY, 1, recovery),
    effectOpacity: 1 - recovery,
  };
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
