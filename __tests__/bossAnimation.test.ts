import { BATTLE_RULES, BOSS_ANIMATION } from '../src/config';
import {
  getBossAnimationFrame,
  getBossImpactEffectProgress,
  getBossWalkFrameIndex,
} from '../src/domain/bossAnimation';

const BOSS_ID = 'boss-easy-crumb-knight';

function frame(overrides: Partial<Parameters<typeof getBossAnimationFrame>[0]> = {}) {
  return getBossAnimationFrame({
    monsterId: BOSS_ID,
    fallbackImageKey: BOSS_ID,
    y: 0.2,
    moving: false,
    strongAttackWindupVisible: false,
    now: 1000,
    spawnAt: 1000,
    lastSpecialAttackAt: 1000,
    ...overrides,
  });
}

describe('보스 프레임 애니메이션', () => {
  test('이동 거리에 따라 왼발·통과·오른발 프레임을 반복한다', () => {
    const quarter = BOSS_ANIMATION.walkDistancePerCycle / 4;
    expect(getBossWalkFrameIndex(0.19)).toBe(BOSS_ANIMATION.walkFrameSequence[0]);
    expect(getBossWalkFrameIndex(0.19 + quarter * 1.001))
      .toBe(BOSS_ANIMATION.walkFrameSequence[1]);
    expect(getBossWalkFrameIndex(0.19 + quarter * 2.001))
      .toBe(BOSS_ANIMATION.walkFrameSequence[2]);
    expect(getBossWalkFrameIndex(0.19 + quarter * 3.001))
      .toBe(BOSS_ANIMATION.walkFrameSequence[3]);
    expect(getBossWalkFrameIndex(0.19 + BOSS_ANIMATION.walkDistancePerCycle * 1.001))
      .toBe(BOSS_ANIMATION.walkFrameSequence[0]);
  });

  test('실제 공격 판정과 같은 시각에 망치 내려찍기 프레임을 표시한다', () => {
    const attackAt = 2000;
    expect(frame({ strongAttackWindupVisible: true }).phase).toBe('hammerWindup');
    expect(frame({
      now: attackAt,
      lastSpecialAttackAt: attackAt,
    })).toMatchObject({ phase: 'hammerImpact', attackKind: 'special' });
    expect(frame({
      now: attackAt + BOSS_ANIMATION.impactHoldMs + 1,
      lastSpecialAttackAt: attackAt,
    }).phase).toBe('hammerRecovery');
    expect(frame({
      now: attackAt + BOSS_ANIMATION.impactHoldMs + BOSS_ANIMATION.recoveryMs + 1,
      lastSpecialAttackAt: attackAt,
    }).phase).toBe('idle');
  });

  test('공격 후 지면 충격 효과는 설정 시간 동안만 0에서 1로 진행한다', () => {
    const attackAt = 5000;
    expect(getBossImpactEffectProgress(null, attackAt)).toBeNull();
    expect(getBossImpactEffectProgress(attackAt, attackAt)).toBe(0);
    expect(getBossImpactEffectProgress(
      attackAt,
      attackAt + BOSS_ANIMATION.impactEffectDurationMs / 2,
    )).toBeCloseTo(0.5);
    expect(getBossImpactEffectProgress(
      attackAt,
      attackAt + BOSS_ANIMATION.impactEffectDurationMs + 1,
    )).toBeNull();
  });

  test('공격 중에는 걷기 프레임보다 망치 프레임이 우선한다', () => {
    expect(frame({
      moving: true,
      strongAttackWindupVisible: true,
      y: 0.4,
    }).phase).toBe('hammerWindup');
    expect(frame({
      moving: true,
      strongAttackWindupVisible: true,
      y: 0.4,
      now: 3000,
      lastSpecialAttackAt: 3000,
    }).phase).toBe('hammerImpact');
  });

  test('일반 원거리·근접 공격은 5초 강한 망치 동작을 재생하지 않는다', () => {
    expect(frame({ strongAttackWindupVisible: false }).phase).toBe('idle');
    expect(frame({
      now: 1500,
      lastSpecialAttackAt: 1000,
    }).phase).toBe('idle');
  });

  test('X3 마지막 서브스텝에서도 망치 충돌 핵심 프레임을 건너뛰지 않는다', () => {
    const attackAt = 9000;
    const maximumSkippedSimulationMs = BATTLE_RULES.maxDeltaMs
      * (Math.max(...BATTLE_RULES.battleSpeedMultipliers) - 1);
    expect(frame({
      now: attackAt + maximumSkippedSimulationMs,
      lastSpecialAttackAt: attackAt,
    }).phase).toBe('hammerImpact');
  });
});
