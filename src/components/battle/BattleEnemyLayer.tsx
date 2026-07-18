import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BATTLE_FEEDBACK, BATTLE_RULES, BATTLE_UI } from '../../config';
import { getBossAnimationFrame } from '../../domain/bossAnimation';
import { selectEnemyCombatTiming } from '../../engine/enemyCombatSelector';
import type {
  BattleEnemy,
  BattleEvent,
  BattleProjectile,
  BattleStatus,
} from '../../engine/battleTypes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { BossHammerSmashEffect } from '../BossHammerSmashEffect';
import { MonsterSprite } from '../MonsterSprite';
import { BattleHealthBar } from './BattleHealthBar';
import {
  BossAnimationSprite,
  hasBossAnimationImage,
} from './BossAnimationSprite';
import { getPerspectiveScale } from './battleUnitLayout';

interface BattleEnemyLayerProps {
  enemies: BattleEnemy[];
  enemyProjectiles: BattleProjectile[];
  status: BattleStatus;
  now: number;
  enemyDiscCooldownMs: number;
  enemyDiscSpeed: number;
  presentationEvent: BattleEvent | null;
  presentationEventAgeMs: number;
}

export function BattleEnemyLayer({
  enemies,
  enemyProjectiles,
  status,
  now,
  enemyDiscCooldownMs,
  enemyDiscSpeed,
  presentationEvent,
  presentationEventAgeMs,
}: BattleEnemyLayerProps) {
  return (
    <>
      {enemies.map((enemy) => {
        if (enemy.hp <= 0 || enemy.spawnAt > now) return null;
        const renderSize = Math.max(
          BATTLE_UI.enemyMinimumRenderSize,
          Math.min(
            BATTLE_UI.enemyMaximumRenderSize,
            BATTLE_UI.enemyBaseRenderSize
              * enemy.sizeMultiplier
              * getPerspectiveScale(enemy.y),
          ),
        );
        const combatTiming = selectEnemyCombatTiming({
          enemy,
          enemyProjectiles,
          status,
          now,
          enemyDiscCooldownMs,
          enemyDiscSpeed,
        });
        const frame = getBossAnimationFrame({
          monsterId: enemy.monsterId,
          fallbackImageKey: enemy.imageKey,
          y: enemy.y,
          moving: status === 'active' && enemy.y < BATTLE_RULES.enemyStopY,
          strongAttackWindupVisible: combatTiming.specialWindupVisible,
          now,
          spawnAt: enemy.spawnAt,
          lastSpecialAttackAt: enemy.lastSpecialAttackAt,
        });
        const targetsThisEnemy = presentationEvent?.sourceEnemyId === enemy.id || (
          presentationEvent?.x !== undefined
          && presentationEvent.y !== undefined
          && Math.abs(presentationEvent.x - enemy.x) <= BATTLE_RULES.playerHitToleranceX
          && Math.abs(presentationEvent.y - enemy.y) <= BATTLE_RULES.playerHitToleranceY
        );
        const hitVisible = Boolean(
          targetsThisEnemy
          && ['enemyHit', 'bossEnraged', 'enemyDefeated'].includes(
            presentationEvent?.kind ?? '',
          )
          && presentationEventAgeMs <= BATTLE_FEEDBACK.enemyHitDurationMs,
        );
        const hitProgress = hitVisible
          ? Math.min(1, presentationEventAgeMs / BATTLE_FEEDBACK.enemyHitDurationMs)
          : 1;
        const hitWave = hitVisible ? Math.sin(hitProgress * Math.PI) : 0;
        const translateX = hitVisible
          ? Math.sin(hitProgress * Math.PI * BATTLE_FEEDBACK.enemyHitShakeCycles)
            * BATTLE_FEEDBACK.enemyHitShakePixels
            * (1 - hitProgress)
          : 0;
        const scale = hitVisible
          ? 1 - (1 - BATTLE_FEEDBACK.enemyHitScale) * hitWave
          : 1;
        const attacking = frame.phase.startsWith('hammer');
        const enragePulse = enemy.enraged
          ? 1 + Math.sin(
            now / BATTLE_FEEDBACK.enemyAttackDurationMs * Math.PI * 2,
          ) * BATTLE_FEEDBACK.enragePulseScale
          : 1;
        const auraSize = renderSize * BATTLE_FEEDBACK.auraSizeMultiplier;
        const hasAnimationFrame = hasBossAnimationImage(frame.imageKey);
        return (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                left: `${enemy.x * 100}%`,
                top: `${enemy.y * 100}%`,
                width: BATTLE_UI.enemyLabelWidth,
                marginLeft: -BATTLE_UI.enemyLabelWidth / 2,
                marginTop: -(renderSize + BATTLE_UI.enemyAnchorLabelOffset),
                zIndex: Math.round(enemy.y * 1000),
                transform: [{ translateX }, { scaleX: scale }, { scaleY: scale }],
              },
            ]}
          >
            <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
            <BattleHealthBar
              value={enemy.hp}
              max={enemy.maxHp}
              width={BATTLE_UI.enemyHealthWidth}
            />
            <View style={[styles.spriteFrame, { width: renderSize, height: renderSize }]}>
              <View
                pointerEvents="none"
                style={[
                  styles.groundShadow,
                  {
                    left: renderSize * (1 - BATTLE_UI.groundShadowWidthRatio) / 2,
                    bottom: renderSize * BATTLE_UI.groundShadowBottomRatio,
                    width: renderSize * BATTLE_UI.groundShadowWidthRatio,
                    height: renderSize * BATTLE_UI.groundShadowHeightRatio,
                    borderRadius: renderSize,
                    backgroundColor: BATTLE_UI.groundShadowColor,
                  },
                ]}
              />
              {enemy.enraged || attacking ? (
                <View
                  style={[
                    styles.attackAura,
                    {
                      width: auraSize,
                      height: auraSize,
                      left: (renderSize - auraSize) / 2,
                      top: (renderSize - auraSize) / 2,
                      borderWidth: BATTLE_FEEDBACK.attackAuraBorderWidth,
                      borderColor: enemy.enraged
                        ? BATTLE_FEEDBACK.enrageAuraBorderColor
                        : BATTLE_FEEDBACK.attackAuraBorderColor,
                      backgroundColor: enemy.enraged
                        ? BATTLE_FEEDBACK.enrageAuraColor
                        : BATTLE_FEEDBACK.attackAuraColor,
                      transform: [{ scale: enragePulse }],
                    },
                  ]}
                />
              ) : null}
              <View pointerEvents="none" style={styles.spriteMotion}>
                {hasAnimationFrame ? (
                  <BossAnimationSprite imageKey={frame.imageKey} size={renderSize} />
                ) : (
                  <MonsterSprite imageKey={enemy.imageKey} size={renderSize} />
                )}
              </View>
              {frame.impactEffectProgress !== null ? (
                <BossHammerSmashEffect
                  size={renderSize}
                  impactProgress={frame.impactEffectProgress}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  enemy: { position: 'absolute', alignItems: 'center' },
  spriteFrame: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  spriteMotion: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  groundShadow: { position: 'absolute' },
  attackAura: {
    position: 'absolute',
    borderRadius: 999,
    borderStyle: 'dashed',
    elevation: 5,
  },
  enemyName: {
    fontFamily: fonts.extraBold,
    fontSize: 7,
    color: colors.red,
    maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
});
