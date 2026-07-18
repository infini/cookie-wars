import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BATTLE_FEEDBACK } from '../../config';
import type { BattleEvent } from '../../engine/useBattleEngine';
import { fonts } from '../../theme/typography';
import { formatNumber } from '../../utils/format';

interface BattleImpactEffectProps {
  event: BattleEvent | null;
  now: number;
}

export function BattleImpactEffect({ event, now }: BattleImpactEffectProps) {
  if (
    !event
    || event.x === undefined
    || event.y === undefined
    || !['enemyHit', 'castleHit', 'bossEnraged', 'enemyDefeated'].includes(event.kind)
  ) return null;
  const ageMs = Math.max(0, now - event.at);
  if (ageMs > BATTLE_FEEDBACK.impactEffectDurationMs) return null;

  const isCastleImpact = event.kind === 'castleHit';
  const overallProgress = Math.min(
    1,
    ageMs / BATTLE_FEEDBACK.impactEffectDurationMs,
  );
  const fieldProgress = Math.min(
    1,
    ageMs / BATTLE_FEEDBACK.fieldShockwaveDurationMs,
  );
  const fieldScale = BATTLE_FEEDBACK.fieldShockwaveStartScale + (
    BATTLE_FEEDBACK.fieldShockwaveEndScale
    - BATTLE_FEEDBACK.fieldShockwaveStartScale
  ) * fieldProgress;
  const showFieldShockwave = !isCastleImpact
    && (event.attackSource === 'castle' || event.attackSource === 'giant');

  return (
    <View
      pointerEvents="none"
      style={[
        styles.impactEffect,
        {
          left: `${event.x * 100}%`,
          top: `${event.y * 100}%`,
          width: BATTLE_FEEDBACK.impactEffectSize,
          height: BATTLE_FEEDBACK.impactEffectSize,
          marginLeft: -BATTLE_FEEDBACK.impactEffectSize / 2,
          marginTop: -BATTLE_FEEDBACK.impactEffectSize / 2,
        },
      ]}
    >
      {showFieldShockwave ? (
        <View style={[
          styles.fieldShockwave,
          {
            width: BATTLE_FEEDBACK.fieldShockwaveSize,
            height: BATTLE_FEEDBACK.fieldShockwaveSize
              * BATTLE_FEEDBACK.fieldShockwaveHeightRatio,
            left: (
              BATTLE_FEEDBACK.impactEffectSize - BATTLE_FEEDBACK.fieldShockwaveSize
            ) / 2,
            top: (
              BATTLE_FEEDBACK.impactEffectSize
              - BATTLE_FEEDBACK.fieldShockwaveSize
                * BATTLE_FEEDBACK.fieldShockwaveHeightRatio
            ) / 2,
            borderColor: BATTLE_FEEDBACK.impactOuterColor,
            borderWidth: BATTLE_FEEDBACK.fieldShockwaveBorderWidth,
            opacity: BATTLE_FEEDBACK.fieldShockwaveMaximumOpacity * (1 - fieldProgress),
            transform: [{ scale: fieldScale }],
          },
        ]} />
      ) : null}

      {BATTLE_FEEDBACK.impactBursts.map((burst, burstIndex) => {
        const burstAgeMs = ageMs - burst.delayMs;
        if (burstAgeMs < 0 || burstAgeMs > BATTLE_FEEDBACK.impactBurstDurationMs) {
          return null;
        }
        const progress = Math.min(
          1,
          burstAgeMs / BATTLE_FEEDBACK.impactBurstDurationMs,
        );
        const scale = (
          BATTLE_FEEDBACK.impactStartScale + (
            BATTLE_FEEDBACK.impactEndScale - BATTLE_FEEDBACK.impactStartScale
          ) * progress
        ) * burst.scale;
        const primaryColor = isCastleImpact
          ? BATTLE_FEEDBACK.castleImpactSparkColor
          : BATTLE_FEEDBACK.impactSparkColor;
        const secondaryColor = isCastleImpact
          ? BATTLE_FEEDBACK.castleImpactSecondaryColor
          : BATTLE_FEEDBACK.impactSecondaryColor;
        return (
          <View
            key={`impact-burst-${burstIndex}`}
            style={[
              styles.impactBurst,
              {
                opacity: 1 - progress,
                transform: [
                  { translateX: burst.xRatio * BATTLE_FEEDBACK.impactEffectSize },
                  { translateY: burst.yRatio * BATTLE_FEEDBACK.impactEffectSize },
                  { rotate: `${burst.rotationDeg}deg` },
                  { scale },
                ],
              },
            ]}
          >
            <View style={[
              styles.impactOuter,
              {
                borderColor: isCastleImpact
                  ? BATTLE_FEEDBACK.castleImpactOuterColor
                  : BATTLE_FEEDBACK.impactOuterColor,
                borderWidth: BATTLE_FEEDBACK.impactRingBorderWidth,
              },
            ]} />
            {Array.from({ length: BATTLE_FEEDBACK.impactSparkCount }, (_, index) => {
              const angle = index * 360 / BATTLE_FEEDBACK.impactSparkCount;
              return (
                <View
                  key={`impact-spark-${index}`}
                  style={[
                    styles.impactSpark,
                    {
                      width: BATTLE_FEEDBACK.impactSparkWidth,
                      height: BATTLE_FEEDBACK.impactSparkLength,
                      left: (
                        BATTLE_FEEDBACK.impactEffectSize
                        - BATTLE_FEEDBACK.impactSparkWidth
                      ) / 2,
                      top: (
                        BATTLE_FEEDBACK.impactEffectSize
                        - BATTLE_FEEDBACK.impactSparkLength
                      ) / 2,
                      backgroundColor: index % 2 === 0 ? primaryColor : secondaryColor,
                      transform: [
                        { rotate: `${angle}deg` },
                        {
                          translateY: -(
                            BATTLE_FEEDBACK.impactSparkTravelPixels * progress
                          ),
                        },
                        {
                          scaleY: 1 - (
                            1 - BATTLE_FEEDBACK.impactSparkEndScale
                          ) * progress,
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
            <View style={[
              styles.impactInner,
              {
                width: `${BATTLE_FEEDBACK.impactInnerScale * 100}%`,
                height: `${BATTLE_FEEDBACK.impactInnerScale * 100}%`,
                backgroundColor: isCastleImpact
                  ? BATTLE_FEEDBACK.castleImpactInnerColor
                  : BATTLE_FEEDBACK.impactInnerColor,
              },
            ]} />
          </View>
        );
      })}

      {event.amount ? (
        <Text numberOfLines={1} style={[
          styles.damageText,
          {
            color: BATTLE_FEEDBACK.damageTextColor,
            fontSize: BATTLE_FEEDBACK.damageTextFontSize,
            width: BATTLE_FEEDBACK.damageTextWidth,
            left: (
              BATTLE_FEEDBACK.impactEffectSize - BATTLE_FEEDBACK.damageTextWidth
            ) / 2,
            opacity: 1 - overallProgress,
            textShadowColor: BATTLE_FEEDBACK.damageTextOutlineColor,
            textShadowRadius: BATTLE_FEEDBACK.impactRingBorderWidth,
            transform: [{
              translateY: -BATTLE_FEEDBACK.damageTextRisePixels * overallProgress,
            }],
          },
        ]}>-{formatNumber(event.amount)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  impactEffect: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 2450 },
  impactBurst: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  fieldShockwave: { position: 'absolute', borderRadius: 999 },
  impactOuter: { ...StyleSheet.absoluteFill, borderRadius: 999 },
  impactSpark: { position: 'absolute', borderRadius: 999 },
  impactInner: { borderRadius: 999 },
  damageText: { position: 'absolute', top: 0, fontFamily: fonts.display, textAlign: 'center', zIndex: 3 },
});
