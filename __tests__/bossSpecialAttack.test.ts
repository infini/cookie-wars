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
    const end = getBossSpecialAttackPose(1);

    expect(start.rotationDeg).toBe(0);
    expect(windup.rotationDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.windupRotationDeg);
    expect(windup.translateY).toBeLessThan(0);
    expect(slam.rotationDeg).toBeCloseTo(BOSS_SPECIAL_ATTACK.slamRotationDeg);
    expect(slam.translateY).toBeGreaterThan(0);
    expect(slam.scaleX).toBeGreaterThan(1);
    expect(slam.scaleY).toBeLessThan(1);
    expect(getBossSpecialAttackImpactProgress(
      BOSS_SPECIAL_ATTACK.slamPeakProgress - 0.01,
    )).toBeNull();
    expect(getBossSpecialAttackImpactProgress(
      BOSS_SPECIAL_ATTACK.slamPeakProgress,
    )).toBe(0);
    expect(end.rotationDeg).toBeCloseTo(0);
    expect(end.translateY).toBeCloseTo(0);
    expect(end.scaleX).toBeCloseTo(1);
    expect(end.scaleY).toBeCloseTo(1);
    expect(end.effectOpacity).toBeCloseTo(0);
  });
});
