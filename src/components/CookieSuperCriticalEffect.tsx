import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FEEDBACK } from '../config';
import type { CookieFeedbackTier } from '../types/game';
import { fonts } from '../theme/typography';

type SuperCriticalEffectMode = Extract<
  CookieFeedbackTier,
  'superCriticalFull' | 'superCriticalCompact'
>;

const FX = COOKIE_FEEDBACK.superCriticalEffect;
const FULL_RAYS = Array.from({ length: FX.rayCount }, (_, index) => index);
const COMPACT_RAYS = Array.from({ length: FX.compactRayCount }, (_, index) => index);
const RINGS = Array.from({ length: FX.ringCount }, (_, index) => index);
const FULL_SPARKLES = Array.from({ length: FX.sparkleCount }, (_, index) => index);
const COMPACT_SPARKLES = Array.from(
  { length: FX.compactSparkleCount },
  (_, index) => index,
);

export const CookieSuperCriticalEffect = React.memo(
  function CookieSuperCriticalEffect({ mode }: { mode: SuperCriticalEffectMode }) {
    const progress = useRef(new Animated.Value(0)).current;
    const full = mode === 'superCriticalFull';
    const size = FX.sizePixels;
    const rays = full ? FULL_RAYS : COMPACT_RAYS;
    const sparkles = full ? FULL_SPARKLES : COMPACT_SPARKLES;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: full ? FX.durationMs : FX.compactDurationMs,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [full, progress]);

    const burstOpacity = progress.interpolate({
      inputRange: [0, FX.corePeakProgress, FX.coreFadeStartProgress, 1],
      outputRange: [0, 1, 1, 0],
    });
    const burstScale = progress.interpolate({
      inputRange: [0, FX.corePeakProgress, 1],
      outputRange: [FX.coreStartScale, FX.corePeakScale, FX.coreEndScale],
    });

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
            transform: [{ scale: full ? 1 : FX.compactScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.centered,
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

        {rays.map((index) => {
          const angle = index / rays.length * 360;
          return (
            <Animated.View
              key={`ray-${index}`}
              style={[
                styles.ray,
                {
                  left: size / 2 - FX.rayWidthPixels / 2,
                  top: size / 2 - FX.rayLengthPixels,
                  width: FX.rayWidthPixels,
                  height: FX.rayLengthPixels,
                  borderRadius: FX.rayWidthPixels / 2,
                  backgroundColor: FX.rayColor,
                  opacity: burstOpacity,
                  transformOrigin: `center ${FX.rayLengthPixels}px`,
                  transform: [
                    { rotate: `${angle}deg` },
                    { scaleY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [FX.rayStartScale, FX.rayEndScale],
                    }) },
                    { rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${FX.rayRotationTurns * 360}deg`],
                    }) },
                  ],
                },
              ]}
            />
          );
        })}

        {RINGS.slice(0, full ? RINGS.length : 1).map((index) => {
          const start = (index + 1) * FX.ringStaggerProgress;
          return (
            <Animated.View
              key={`ring-${index}`}
              style={[
                styles.centered,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: FX.ringBorderWidth,
                  borderColor: FX.ringColors[index % FX.ringColors.length],
                  opacity: progress.interpolate({
                    inputRange: [0, start, FX.ringFadeStartProgress, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [{
                    scale: progress.interpolate({
                      inputRange: [0, start, 1],
                      outputRange: [FX.ringStartScale, FX.ringStartScale, FX.ringEndScale],
                    }),
                  }],
                },
              ]}
            />
          );
        })}

        <Animated.View
          style={[
            styles.core,
            {
              width: size * FX.coreSizeRatio,
              height: size * FX.coreSizeRatio,
              left: size * (1 - FX.coreSizeRatio) / 2,
              top: size * (1 - FX.coreSizeRatio) / 2,
              borderRadius: size,
              opacity: burstOpacity,
              transform: [{ scale: burstScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[FX.coreColorStart, FX.coreColorEnd]}
            style={styles.fill}
          />
        </Animated.View>

        {sparkles.map((index) => {
          const start = FX.sparkleStartProgress + index * FX.sparkleStaggerProgress;
          const angle = index / sparkles.length * 360;
          const color = FX.sparkleColors[index % FX.sparkleColors.length];
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
                    inputRange: [0, start, FX.sparkleFadeStartProgress, 1],
                    outputRange: [0, 0, 1, 0],
                  }),
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: progress.interpolate({
                      inputRange: [0, start, 1],
                      outputRange: [
                        -FX.sparkleStartDistancePixels,
                        -FX.sparkleStartDistancePixels,
                        -FX.sparkleEndDistancePixels,
                      ],
                    }) },
                    { scale: burstScale },
                  ],
                },
              ]}
            >
              <View style={[
                styles.sparkleBar,
                {
                  width: FX.sparkleSizePixels * FX.sparkleThicknessRatio,
                  height: FX.sparkleSizePixels,
                  backgroundColor: color,
                },
              ]} />
              <View style={[
                styles.sparkleBar,
                {
                  width: FX.sparkleSizePixels,
                  height: FX.sparkleSizePixels * FX.sparkleThicknessRatio,
                  backgroundColor: color,
                },
              ]} />
            </Animated.View>
          );
        })}

        <Animated.Text
          style={[
            styles.label,
            {
              top: size * FX.labelTopRatio,
              width: size,
              color: FX.labelColor,
              fontSize: FX.labelFontSize,
              textShadowColor: FX.labelShadowColor,
              opacity: burstOpacity,
              transform: [{ scale: burstScale }],
            },
          ]}
        >
          슈퍼 크리티컬!
        </Animated.Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%', zIndex: 9 },
  centered: { position: 'absolute', backgroundColor: 'transparent' },
  core: { position: 'absolute', overflow: 'hidden' },
  fill: { flex: 1 },
  ray: { position: 'absolute' },
  sparkle: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sparkleBar: { position: 'absolute', borderRadius: 8 },
  label: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.display,
    textShadowRadius: 12,
  },
});
