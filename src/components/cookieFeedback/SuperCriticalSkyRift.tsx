import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COOKIE_FEEDBACK } from '../../config';

const FX = COOKIE_FEEDBACK.superCriticalEffect;

export function SuperCriticalSkyRift({
  progress,
  size,
  compact,
}: {
  progress: Animated.Value;
  size: number;
  compact: boolean;
}) {
  const count = compact ? Math.ceil(FX.riftSegmentCount / 2) : FX.riftSegmentCount;
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    const direction = index % 2 === 0 ? 1 : -1;
    const start = FX.riftRevealProgress + index * FX.riftSegmentStaggerProgress;
    const opacity = progress.interpolate({
      inputRange: [0, start, start + FX.riftRevealProgress, FX.riftFadeStartProgress, 1],
      outputRange: [0, 0, 1, 1, 0],
    });
    const transform = [
      { rotate: `${direction * FX.riftTurnDegrees}deg` },
      { scaleX: progress.interpolate({
        inputRange: [0, start, FX.riftFadeStartProgress, 1],
        outputRange: [FX.riftStartScale, FX.riftStartScale, 1, FX.riftEndScale],
      }) },
    ];
    const left = size * (
      (1 - FX.riftHorizontalSpreadRatio) / 2
      + ratio * FX.riftHorizontalSpreadRatio
    ) - FX.riftSegmentLengthPixels / 2;
    const top = size * FX.riftTopRatio + direction * FX.riftZigzagPixels;
    const color = FX.riftColors[index % FX.riftColors.length];
    return (
      <React.Fragment key={`sky-rift-${index}`}>
        <Animated.View
          style={[
            styles.rift,
            {
              left,
              top,
              width: FX.riftSegmentLengthPixels,
              height: FX.riftSegmentWidthPixels * FX.riftGlowWidthMultiplier,
              backgroundColor: color,
              opacity: Animated.multiply(opacity, FX.riftGlowMaximumOpacity),
              transform,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rift,
            {
              left,
              top: top + FX.riftSegmentWidthPixels,
              width: FX.riftSegmentLengthPixels,
              height: FX.riftSegmentWidthPixels,
              opacity,
              transform,
            },
          ]}
        >
          <LinearGradient
            colors={FX.riftColors as [string, string, ...string[]]}
            style={styles.fill}
          />
        </Animated.View>
      </React.Fragment>
    );
  });
}

const styles = StyleSheet.create({
  rift: { position: 'absolute', overflow: 'hidden' },
  fill: { flex: 1 },
});
