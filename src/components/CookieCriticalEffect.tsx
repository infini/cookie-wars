import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FEEDBACK } from '../config';
import { CookieFeedbackTier } from '../types/game';

type CriticalEffectMode = Exclude<CookieFeedbackTier, 'normal'>;

const FX = COOKIE_FEEDBACK.criticalEffect;
const FULL_FRAGMENTS = Array.from({ length: FX.fragmentCount }, (_, index) => index);
const FULL_SPARKLES = Array.from({ length: FX.sparkleCount }, (_, index) => index);
const COMPACT_SPARKLES = Array.from(
  { length: FX.compactSparkleCount },
  (_, index) => index,
);

export const CookieCriticalEffect = React.memo(function CookieCriticalEffect({
  mode,
}: {
  mode: CriticalEffectMode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const full = mode === 'criticalFull';
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: full ? FX.durationMs : FX.compactDurationMs,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [full, progress]);

  const size = FX.sizePixels;
  const effectScale = full ? 1 : FX.compactScale;
  const ringOpacity = progress.interpolate({
    inputRange: [0, FX.ringFadeStartProgress, 1],
    outputRange: [1, 1, 0],
  });
  const coreOpacity = progress.interpolate({
    inputRange: [0, FX.corePeakProgress, FX.coreFadeStartProgress, 1],
    outputRange: [0, 1, 1, 0],
  });
  const sparkleIndices = full ? FULL_SPARKLES : COMPACT_SPARKLES;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.effect,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transform: [{ scale: effectScale }],
        },
      ]}
    >
      {full ? (
        <Animated.View
          style={[
            styles.centeredCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: FX.flashColor,
              opacity: progress.interpolate({
                inputRange: [0, FX.corePeakProgress, FX.coreFadeStartProgress, 1],
                outputRange: [0, FX.flashMaximumOpacity, 0, 0],
              }),
              transform: [{
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [FX.flashStartScale, FX.flashEndScale],
                }),
              }],
            },
          ]}
        />
      ) : null}

      <Animated.View
        style={[
          styles.centeredCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: FX.firstRingBorderWidth,
            borderColor: FX.firstRingColor,
            opacity: ringOpacity,
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [FX.firstRingStartScale, FX.firstRingEndScale],
              }),
            }],
          },
        ]}
      />

      {full ? (
        <Animated.View
          style={[
            styles.centeredCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: FX.secondRingBorderWidth,
              borderColor: FX.secondRingColor,
              opacity: progress.interpolate({
                inputRange: [0, FX.secondRingStartProgress, FX.ringFadeStartProgress, 1],
                outputRange: [0, 0, 1, 0],
              }),
              transform: [{
                scale: progress.interpolate({
                  inputRange: [0, FX.secondRingStartProgress, 1],
                  outputRange: [
                    FX.secondRingStartScale,
                    FX.secondRingStartScale,
                    FX.secondRingEndScale,
                  ],
                }),
              }],
            },
          ]}
        />
      ) : null}

      <Animated.View
        style={[
          styles.core,
          {
            width: size * FX.coreSizeRatio,
            height: size * FX.coreSizeRatio,
            left: size * (1 - FX.coreSizeRatio) / 2,
            top: size * (1 - FX.coreSizeRatio) / 2,
            borderRadius: size,
            borderWidth: FX.coreBorderWidth,
            borderColor: FX.secondRingColor,
            opacity: coreOpacity,
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, FX.corePeakProgress, 1],
                outputRange: [FX.coreStartScale, FX.corePeakScale, FX.coreEndScale],
              }),
            }],
          },
        ]}
      >
        <LinearGradient
          colors={[FX.coreColorStart, FX.coreColorEnd]}
          style={styles.coreGradient}
        />
      </Animated.View>

      {full ? FULL_FRAGMENTS.map((index) => {
        const ratio = FX.fragmentCount === 1 ? 0 : index / (FX.fragmentCount - 1);
        const fragmentSize = FX.fragmentMinimumSizePixels
          + (FX.fragmentMaximumSizePixels - FX.fragmentMinimumSizePixels) * ratio;
        const angle = FX.fragmentAngleOffsetDegrees + index / FX.fragmentCount * 360;
        const direction = index % 2 === 0 ? 1 : -1;
        const chipSize = fragmentSize * FX.fragmentChipSizeRatio;
        return (
          <Animated.View
            key={`fragment-${index}`}
            style={[
              styles.fragment,
              {
                left: size / 2 - fragmentSize / 2,
                top: size / 2 - fragmentSize / 2,
                width: fragmentSize,
                height: fragmentSize,
                borderRadius: fragmentSize * FX.fragmentCornerRadiusRatio,
                borderWidth: FX.fragmentBorderWidth,
                borderColor: FX.fragmentEdgeColor,
                backgroundColor: FX.fragmentColor,
                opacity: progress.interpolate({
                  inputRange: [
                    0,
                    FX.fragmentStartProgress,
                    FX.fragmentRevealProgress,
                    FX.fragmentFadeStartProgress,
                    1,
                  ],
                  outputRange: [0, 0, 1, 1, 0],
                }),
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: progress.interpolate({
                    inputRange: [0, FX.fragmentStartProgress, 1],
                    outputRange: [
                      -FX.fragmentStartDistancePixels,
                      -FX.fragmentStartDistancePixels,
                      -FX.fragmentEndDistancePixels,
                    ],
                  }) },
                  { rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${direction * FX.fragmentRotationTurns * 360}deg`],
                  }) },
                ],
              },
            ]}
          >
            <View
              style={{
                width: chipSize,
                height: chipSize,
                borderRadius: chipSize / 2,
                backgroundColor: FX.fragmentChipColor,
              }}
            />
          </Animated.View>
        );
      }) : null}

      {sparkleIndices.map((index) => {
        const sparkleStart = FX.sparkleStartProgress + index * FX.sparkleStaggerProgress;
        const angle = FX.sparkleAngleOffsetDegrees + index / sparkleIndices.length * 360;
        const thickness = FX.sparkleSizePixels * FX.sparkleThicknessRatio;
        const color = index % 2 === 0 ? FX.sparkleColor : FX.sparkleHighlightColor;
        return (
          <Animated.View
            key={`sparkle-${index}`}
            style={[
              styles.sparkle,
              {
                left: size / 2 - FX.sparkleSizePixels / 2,
                top: size / 2 - FX.sparkleSizePixels / 2,
                width: FX.sparkleSizePixels,
                height: FX.sparkleSizePixels,
                opacity: progress.interpolate({
                  inputRange: [0, sparkleStart, FX.sparkleFadeStartProgress, 1],
                  outputRange: [0, 0, 1, 0],
                }),
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: progress.interpolate({
                    inputRange: [0, sparkleStart, 1],
                    outputRange: [
                      -FX.sparkleStartDistancePixels,
                      -FX.sparkleStartDistancePixels,
                      -FX.sparkleEndDistancePixels,
                    ],
                  }) },
                  { rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${FX.sparkleRotationTurns * 360}deg`],
                  }) },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.sparkleBar,
                {
                  left: (FX.sparkleSizePixels - thickness) / 2,
                  width: thickness,
                  height: FX.sparkleSizePixels,
                  borderRadius: thickness / 2,
                  backgroundColor: color,
                },
              ]}
            />
            <View
              style={[
                styles.sparkleBar,
                {
                  top: (FX.sparkleSizePixels - thickness) / 2,
                  width: FX.sparkleSizePixels,
                  height: thickness,
                  borderRadius: thickness / 2,
                  backgroundColor: color,
                },
              ]}
            />
          </Animated.View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%', zIndex: 7 },
  centeredCircle: { position: 'absolute', backgroundColor: 'transparent' },
  core: { position: 'absolute', overflow: 'hidden' },
  coreGradient: { flex: 1 },
  fragment: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute' },
  sparkleBar: { position: 'absolute' },
});
