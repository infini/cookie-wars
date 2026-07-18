import {
  BATTLE_RULES,
  BOT_ANIMATION,
  getBotAnimation,
} from '../config';
import type { BattleStatus } from '../engine/battleTypes';

export interface CombatPoint {
  x: number;
  y: number;
}

function clampNormalizedCoordinate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export type BotAnimationPhase =
  | 'idle'
  | 'run'
  | 'throwWindup'
  | 'throwRelease'
  | 'throwRecovery';

export interface BotAnimationFrame {
  phase: BotAnimationPhase;
  imageKey: string;
  positionTime: number;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function getPatrolProgress(botIndex: number, now: number): number {
  const phaseTime = now + botIndex * BOT_ANIMATION.patrolPhaseOffsetMs;
  return positiveModulo(phaseTime, BOT_ANIMATION.patrolCycleMs)
    / BOT_ANIMATION.patrolCycleMs;
}

export function getBotCombatPosition(
  botIndex: number,
  now: number,
  target?: CombatPoint,
  active = true,
): CombatPoint {
  const slot = BATTLE_RULES.botFormationSlots[
    botIndex % BATTLE_RULES.botFormationSlots.length
  ];
  if (!active || !target) return slot;
  const progress = getPatrolProgress(botIndex, now);
  const forwardWave = 1 - Math.abs(progress * 2 - 1);
  const targetOffsetX = (target.x - slot.x) * BOT_ANIMATION.targetFollowRatio;
  const targetOffsetY = (target.y - slot.y) * BOT_ANIMATION.targetFollowRatio;
  return {
    x: clampNormalizedCoordinate(slot.x
      + targetOffsetX
      + Math.sin(progress * Math.PI * 2) * BOT_ANIMATION.patrolHorizontalRadius),
    y: clampNormalizedCoordinate(slot.y
      + targetOffsetY
      - forwardWave * BOT_ANIMATION.patrolForwardDistance),
  };
}

export function getBotProjectileOrigin(position: CombatPoint): CombatPoint {
  return {
    x: clampNormalizedCoordinate(position.x + BOT_ANIMATION.projectileReleaseOffsetX),
    y: clampNormalizedCoordinate(position.y + BOT_ANIMATION.projectileReleaseOffsetY),
  };
}

export function isBotTargetInRange(
  position: CombatPoint,
  target: CombatPoint,
): boolean {
  const origin = getBotProjectileOrigin(position);
  return Math.hypot(target.x - origin.x, target.y - origin.y)
    <= BATTLE_RULES.botAttackRadius;
}

interface BotAnimationFrameInput {
  botId: string;
  botIndex: number;
  now: number;
  status: BattleStatus;
  targetInRange: boolean;
  attackIntervalMs: number;
  lastAttackAt: number;
  lastAttackPerformedAt?: number;
}

export function getBotAnimationFrame({
  botId,
  botIndex,
  now,
  status,
  targetInRange,
  attackIntervalMs,
  lastAttackAt,
  lastAttackPerformedAt,
}: BotAnimationFrameInput): BotAnimationFrame {
  const set = getBotAnimation(botId);
  if (!set) return { phase: 'idle', imageKey: botId, positionTime: now };

  if (lastAttackPerformedAt !== undefined) {
    const attackAgeMs = now - lastAttackPerformedAt;
    if (attackAgeMs >= 0 && attackAgeMs <= BOT_ANIMATION.throwReleaseHoldMs) {
      return {
        phase: 'throwRelease',
        imageKey: set.throwReleaseImageKey,
        positionTime: lastAttackPerformedAt,
      };
    }
    if (
      attackAgeMs > BOT_ANIMATION.throwReleaseHoldMs
      && attackAgeMs <= BOT_ANIMATION.throwReleaseHoldMs + BOT_ANIMATION.throwRecoveryMs
    ) {
      return {
        phase: 'throwRecovery',
        imageKey: set.throwRecoveryImageKey,
        positionTime: lastAttackPerformedAt,
      };
    }
  }

  const scheduledAttackAt = lastAttackAt + attackIntervalMs;
  const timeUntilAttackMs = scheduledAttackAt - now;
  if (
    status === 'active'
    && targetInRange
    && timeUntilAttackMs > 0
    && timeUntilAttackMs <= BOT_ANIMATION.throwWindupMs
  ) {
    return {
      phase: 'throwWindup',
      imageKey: set.throwWindupImageKey,
      positionTime: scheduledAttackAt,
    };
  }

  if (status !== 'active') {
    return {
      phase: 'idle',
      imageKey: set.throwRecoveryImageKey,
      positionTime: now,
    };
  }
  const progress = getPatrolProgress(botIndex, now);
  const sequenceIndex = Math.min(
    BOT_ANIMATION.runFrameSequence.length - 1,
    Math.floor(progress * BOT_ANIMATION.runFrameSequence.length),
  );
  const frameIndex = BOT_ANIMATION.runFrameSequence[sequenceIndex];
  return {
    phase: 'run',
    imageKey: set.runImageKeys[frameIndex],
    positionTime: now,
  };
}
