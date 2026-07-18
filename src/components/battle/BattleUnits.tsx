import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BATTLE_FEEDBACK,
  BATTLE_RULES,
  BATTLE_UI,
} from '../../config';
import {
  getBossSpecialAttackPose,
  getBossSpecialAttackProgress,
} from '../../domain/bossSpecialAttack';
import type { ActiveBot } from '../../domain/gameSelectors';
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
import { BotImage } from '../BotImage';
import { MonsterSprite } from '../MonsterSprite';
import { BattleHealthBar } from './BattleHealthBar';

function getPerspectiveScale(y: number): number {
  const progress = Math.max(0, Math.min(1, (
    y - BATTLE_UI.unitPerspectiveFarY
  ) / (
    BATTLE_UI.unitPerspectiveNearY - BATTLE_UI.unitPerspectiveFarY
  )));
  return BATTLE_UI.unitPerspectiveFarScale
    + (BATTLE_UI.unitPerspectiveNearScale - BATTLE_UI.unitPerspectiveFarScale) * progress;
}

interface BattleBotFormationProps {
  bots: ActiveBot[];
}

export const BattleBotFormation = React.memo(function BattleBotFormation({
  bots,
}: BattleBotFormationProps) {
  return (
    <>
      {bots.map((bot, index) => {
        const slot = BATTLE_RULES.botFormationSlots[
          index % BATTLE_RULES.botFormationSlots.length
        ];
        return (
          <View
            key={bot.config.id}
            style={[
              styles.bot,
              {
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: BATTLE_UI.botLabelWidth,
                marginLeft: -BATTLE_UI.botLabelWidth / 2,
                marginTop: -(
                  BATTLE_UI.botRenderSize * getPerspectiveScale(slot.y)
                  + BATTLE_UI.enemyAnchorLabelOffset
                ),
                zIndex: Math.round(slot.y * 1000),
              },
            ]}
          >
            <Text style={[styles.allyName, styles.botName]} numberOfLines={1}>
              {bot.config.name}{bot.count > 1 ? ` ×${bot.count}` : ''}
            </Text>
            <BotImage size={BATTLE_UI.botRenderSize * getPerspectiveScale(slot.y)} grounded />
          </View>
        );
      })}
    </>
  );
});

interface BattleEnemyLayerProps {
  enemies: BattleEnemy[];
  enemyProjectiles: BattleProjectile[];
  status: BattleStatus;
  now: number;
  enemyDiscCooldownMs: number;
  presentationEvent: BattleEvent | null;
  presentationEventAgeMs: number;
}

export function BattleEnemyLayer({
  enemies,
  enemyProjectiles,
  status,
  now,
  enemyDiscCooldownMs,
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
        });
        const { windupVisible, windupProgress } = combatTiming;
        const specialAttackProgress = getBossSpecialAttackProgress(
          enemy.lastSpecialAttackAt,
          enemy.spawnAt,
          now,
        );
        const specialAttackVisible = specialAttackProgress !== null;
        const specialAttackPose = getBossSpecialAttackPose(specialAttackProgress ?? 1);
        const targetsThisEnemy = presentationEvent?.sourceEnemyId === enemy.id || (
          presentationEvent?.x !== undefined
          && presentationEvent.y !== undefined
          && Math.abs(
            presentationEvent.x - enemy.x,
          ) <= BATTLE_RULES.playerHitToleranceX
          && Math.abs(
            presentationEvent.y - enemy.y,
          ) <= BATTLE_RULES.playerHitToleranceY
        );
        const attackVisible = Boolean(
          targetsThisEnemy
          && (
            presentationEvent?.kind === 'enemyDisc'
            || (
              presentationEvent?.kind === 'castleHit'
              && presentationEvent.attackKind === 'melee'
            )
          )
          && presentationEventAgeMs <= BATTLE_FEEDBACK.enemyAttackDurationMs,
        );
        const attackProgress = attackVisible
          ? Math.min(
            1,
            presentationEventAgeMs / BATTLE_FEEDBACK.enemyAttackDurationMs,
          )
          : 1;
        const attackWave = attackVisible ? Math.sin(attackProgress * Math.PI) : 0;
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
          ? Math.sin(
            hitProgress * Math.PI * BATTLE_FEEDBACK.enemyHitShakeCycles,
          ) * BATTLE_FEEDBACK.enemyHitShakePixels * (1 - hitProgress)
          : attackVisible
            ? Math.sin(
              attackProgress * Math.PI * BATTLE_FEEDBACK.enemyAttackShakeCycles,
            ) * BATTLE_FEEDBACK.enemyAttackLungePixels * (1 - attackProgress)
            : 0;
        const translateY = specialAttackVisible
          ? 0
          : attackWave * BATTLE_FEEDBACK.enemyAttackLungePixels;
        const scaleX = specialAttackVisible
          ? 1
          : hitVisible
            ? 1 - (1 - BATTLE_FEEDBACK.enemyHitScale) * hitWave
            : attackVisible
              ? 1 + (BATTLE_FEEDBACK.enemyAttackScale - 1) * attackWave
              : 1 + (BATTLE_FEEDBACK.enemyAttackWindupScale - 1) * windupProgress;
        const scaleY = specialAttackVisible ? 1 : scaleX;
        const enragePulse = enemy.enraged
          ? 1 + Math.sin(
            now / BATTLE_FEEDBACK.enemyAttackDurationMs * Math.PI * 2,
          ) * BATTLE_FEEDBACK.enragePulseScale
          : 1;
        const auraSize = renderSize * BATTLE_FEEDBACK.auraSizeMultiplier;
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
                transform: [
                  { translateX },
                  { translateY },
                  { scaleX },
                  { scaleY },
                ],
              },
            ]}
          >
            <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
            <BattleHealthBar value={enemy.hp} max={enemy.maxHp} width={BATTLE_UI.enemyHealthWidth} />
            <View style={[styles.enemySpriteFrame, { width: renderSize, height: renderSize }]}>
              <View
                pointerEvents="none"
                style={[
                  styles.enemyGroundShadow,
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
              {enemy.enraged || windupVisible || attackVisible || specialAttackVisible ? (
                <View
                  style={[
                    styles.enemyAttackAura,
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
              <View
                pointerEvents="none"
                style={[
                  styles.enemySpriteMotion,
                  {
                    transformOrigin: [
                      renderSize * specialAttackPose.pivotXRatio,
                      renderSize * specialAttackPose.pivotYRatio,
                      0,
                    ],
                    transform: [
                      { translateX: specialAttackPose.translateX },
                      { translateY: specialAttackPose.translateY },
                      { rotate: `${specialAttackPose.rotationDeg}deg` },
                      { skewX: `${specialAttackPose.leanDeg}deg` },
                      { scaleX: specialAttackPose.scaleX },
                      { scaleY: specialAttackPose.scaleY },
                    ],
                  },
                ]}
              >
                <MonsterSprite imageKey={enemy.imageKey} size={renderSize} />
              </View>
              {specialAttackProgress !== null ? (
                <BossHammerSmashEffect size={renderSize} progress={specialAttackProgress} />
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
  enemySpriteFrame: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  enemySpriteMotion: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  enemyGroundShadow: { position: 'absolute' },
  enemyAttackAura: { position: 'absolute', borderRadius: 999, borderStyle: 'dashed', elevation: 5 },
  enemyName: { fontFamily: fonts.extraBold, fontSize: 7, color: colors.red, maxWidth: '100%', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 3, borderRadius: 4 },
  bot: { position: 'absolute', alignItems: 'center' },
  allyName: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.blue, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 4, borderRadius: 5 },
  botName: { maxWidth: '100%', fontSize: 6, paddingHorizontal: 2 },
});
