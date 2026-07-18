import { BATTLE_RULES, BOT_ANIMATION } from '../src/config';
import {
  getBotAnimationFrame,
  getBotCombatPosition,
  getBotProjectileOrigin,
  isBotTargetInRange,
} from '../src/domain/botCombatMotion';

describe('쿠키봇 자동 이동과 투척 애니메이션', () => {
  test('전투 중에는 대상을 향해 순찰하고 전투 밖에서는 편성 위치에 선다', () => {
    const slot = BATTLE_RULES.botFormationSlots[0];
    const target = { x: 0.5, y: 0.4 };
    expect(getBotCombatPosition(0, 1000, target, false)).toEqual(slot);
    expect(getBotCombatPosition(0, 1000, target, true)).not.toEqual(slot);
    const later = getBotCombatPosition(0, 1000 + BOT_ANIMATION.patrolCycleMs / 4, target, true);
    expect(later).not.toEqual(getBotCombatPosition(0, 1000, target, true));
  });

  test('원반은 봇의 발이 아니라 데이터로 정한 손 높이에서 출발한다', () => {
    const feet = { x: 0.4, y: 0.72 };
    expect(getBotProjectileOrigin(feet)).toEqual({
      x: feet.x + BOT_ANIMATION.projectileReleaseOffsetX,
      y: feet.y + BOT_ANIMATION.projectileReleaseOffsetY,
    });
    expect(getBotProjectileOrigin(feet).y).toBeLessThan(feet.y);
  });

  test('화면 투척 준비와 엔진 발사 사거리는 같은 손 좌표를 사용한다', () => {
    const feet = { x: 0.5, y: 0.72 };
    const origin = getBotProjectileOrigin(feet);
    const target = {
      x: origin.x,
      y: origin.y - BATTLE_RULES.botAttackRadius + 0.001,
    };
    expect(isBotTargetInRange(feet, target)).toBe(true);
    expect(Math.hypot(target.x - feet.x, target.y - feet.y))
      .toBeGreaterThan(BATTLE_RULES.botAttackRadius);
  });

  test('쿨타임 직전에는 팔을 들고 실제 발사 시각에는 놓는 프레임을 표시한다', () => {
    const lastAttackAt = 1000;
    const attackIntervalMs = 1800;
    const scheduledAt = lastAttackAt + attackIntervalMs;
    const windup = getBotAnimationFrame({
      botId: 'choco-bot',
      botIndex: 0,
      now: scheduledAt - BOT_ANIMATION.throwWindupMs,
      status: 'active',
      targetInRange: true,
      attackIntervalMs,
      lastAttackAt,
    });
    expect(windup.phase).toBe('throwWindup');
    expect(windup.positionTime).toBe(scheduledAt);

    const release = getBotAnimationFrame({
      botId: 'choco-bot',
      botIndex: 0,
      now: scheduledAt,
      status: 'active',
      targetInRange: true,
      attackIntervalMs,
      lastAttackAt: scheduledAt,
      lastAttackPerformedAt: scheduledAt,
    });
    expect(release.phase).toBe('throwRelease');
    expect(release.positionTime).toBe(scheduledAt);
  });

  test('발사 프레임 뒤에는 복귀하고 다시 달리기를 계속한다', () => {
    const attackAt = 4000;
    const base = {
      botId: 'mint-bot',
      botIndex: 2,
      status: 'active' as const,
      targetInRange: true,
      attackIntervalMs: 1000,
      lastAttackAt: attackAt,
      lastAttackPerformedAt: attackAt,
    };
    expect(getBotAnimationFrame({
      ...base,
      now: attackAt + BOT_ANIMATION.throwReleaseHoldMs + 1,
    }).phase).toBe('throwRecovery');
    expect(getBotAnimationFrame({
      ...base,
      now: attackAt
        + BOT_ANIMATION.throwReleaseHoldMs
        + BOT_ANIMATION.throwRecoveryMs
        + 1,
      targetInRange: false,
    }).phase).toBe('run');
  });

  test('X3 마지막 서브스텝에서도 원반을 놓는 핵심 프레임을 건너뛰지 않는다', () => {
    const attackAt = 7000;
    const maximumSkippedSimulationMs = BATTLE_RULES.maxDeltaMs
      * (Math.max(...BATTLE_RULES.battleSpeedMultipliers) - 1);
    expect(getBotAnimationFrame({
      botId: 'choco-bot',
      botIndex: 0,
      now: attackAt + maximumSkippedSimulationMs,
      status: 'active',
      targetInRange: true,
      attackIntervalMs: 1000,
      lastAttackAt: attackAt,
      lastAttackPerformedAt: attackAt,
    }).phase).toBe('throwRelease');
  });
});
