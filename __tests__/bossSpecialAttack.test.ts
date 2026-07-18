import { BOSS_SPECIAL_ATTACK } from '../src/config';
import {
  getBossSpecialAttackImpactProgress,
  getBossSpecialAttackPose,
  getBossSpecialAttackProgress,
} from '../src/domain/bossSpecialAttack';

describe('보스 주기 강공격 연출', () => {
  test('공격 전에는 숨고 공격 시점부터 설정 시간 동안만 표시된다', () => {
    const spawnAt = 1000;
    expect(getBossSpecialAttackProgress(spawnAt, spawnAt, spawnAt)).toBeNull();

    const attackAt = spawnAt + BOSS_SPECIAL_ATTACK.intervalMs;
    expect(getBossSpecialAttackProgress(attackAt, spawnAt, attackAt)).toBe(0);
    expect(getBossSpecialAttackProgress(
      attackAt,
      spawnAt,
      attackAt + BOSS_SPECIAL_ATTACK.animationDurationMs / 2,
    )).toBeCloseTo(0.5);
    expect(getBossSpecialAttackProgress(
      attackAt,
      spawnAt,
      attackAt + BOSS_SPECIAL_ATTACK.animationDurationMs + 1,
    )).toBeNull();
  });

  test('망치를 들어 올렸다가 크게 내려찍은 뒤 원위치한다', () => {
    const start = getBossSpecialAttackPose(0);
    const windup = getBossSpecialAttackPose(BOSS_SPECIAL_ATTACK.windupPeakProgress);
    const slam = getBossSpecialAttackPose(BOSS_SPECIAL_ATTACK.slamPeakProgress);
    const recovery = getBossSpecialAttackPose(BOSS_SPECIAL_ATTACK.recoveryPeakProgress);
    const end = getBossSpecialAttackPose(1);

    expect(start.pivotXRatio).toBeCloseTo(BOSS_SPECIAL_ATTACK.spritePivotXRatio);
    expect(start.pivotYRatio).toBeCloseTo(BOSS_SPECIAL_ATTACK.spritePivotYRatio);
    expect(start.pivotYRatio).toBeGreaterThan(0.85);
    expect(start.rotationDeg).toBe(0);
    expect(start.leanDeg).toBe(0);
    expect(start.translateX).toBe(0);
    expect(windup.rotationDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.windupRotationDeg);
    expect(windup.leanDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.windupLeanDeg);
    expect(windup.translateX).toBeCloseTo(BOSS_SPECIAL_ATTACK.windupTranslateXPixels);
    expect(windup.translateY).toBeLessThan(0);
    expect(slam.rotationDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.slamRotationDeg);
    expect(slam.leanDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.slamLeanDeg);
    expect(slam.translateX).toBeCloseTo(BOSS_SPECIAL_ATTACK.slamTranslateXPixels);
    expect(slam.translateY).toBeGreaterThan(0);
    expect(slam.scaleX).toBeGreaterThan(1);
    expect(slam.scaleY).toBeLessThan(1);
    expect(Math.abs(slam.rotationDeg - windup.rotationDeg)).toBeGreaterThan(55);
    expect(slam.effectOpacity).toBe(1);
    expect(recovery.rotationDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryRotationDeg);
    expect(recovery.leanDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryLeanDeg);
    expect(recovery.translateX).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryTranslateXPixels);
    expect(recovery.translateY).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryTranslateYPixels);
    expect(recovery.scaleX).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryScaleX);
    expect(recovery.scaleY).toBeCloseTo(BOSS_SPECIAL_ATTACK.recoveryScaleY);
    expect(getBossSpecialAttackImpactProgress(
      BOSS_SPECIAL_ATTACK.slamPeakProgress - 0.01,
    )).toBeNull();
    expect(getBossSpecialAttackImpactProgress(
      BOSS_SPECIAL_ATTACK.slamPeakProgress,
    )).toBe(0);
    expect(end.rotationDeg).toBeCloseTo(0);
    expect(end.leanDeg).toBeCloseTo(0);
    expect(end.translateX).toBeCloseTo(0);
    expect(end.translateY).toBeCloseTo(0);
    expect(end.scaleX).toBeCloseTo(1);
    expect(end.scaleY).toBeCloseTo(1);
    expect(end.effectOpacity).toBeCloseTo(0);
  });

  test('포즈 진행도와 단계 경계를 안전하게 제한한다', () => {
    expect(BOSS_SPECIAL_ATTACK.windupPeakProgress)
      .toBeLessThan(BOSS_SPECIAL_ATTACK.slamPeakProgress);
    expect(BOSS_SPECIAL_ATTACK.slamPeakProgress)
      .toBeLessThan(BOSS_SPECIAL_ATTACK.recoveryPeakProgress);
    expect(BOSS_SPECIAL_ATTACK.recoveryPeakProgress).toBeLessThan(1);
    expect(getBossSpecialAttackPose(-1)).toEqual(getBossSpecialAttackPose(0));
    expect(getBossSpecialAttackPose(2)).toEqual(getBossSpecialAttackPose(1));
  });
});
