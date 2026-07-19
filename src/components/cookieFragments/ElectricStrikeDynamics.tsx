import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';

const FX = COOKIE_FRAGMENTS.claimEffect;

export function ElectricStrikeDynamics({
  progress,
  size,
}: {
  progress: Animated.Value;
  size: number;
}) {
  const pulseSize = size * FX.electricPulseSizeRatio;
  const centerLeft = (size - pulseSize) / 2;
  const centerTop = size * FX.electricCoreTopRatio
    + (size * FX.electricCoreSizeRatio - pulseSize) / 2;
  return (
    <View style={styles.fill}>
      {Array.from({ length: FX.electricPulseCount }, (_, index) => {
        const start = FX.flashPeakProgress + index * FX.electricPulseStaggerProgress;
        const reveal = start + FX.electricPulseStaggerProgress;
        return (
          <Animated.View
            key={`electric-pulse-${index}`}
            style={[
              styles.pulse,
              {
                left: centerLeft,
                top: centerTop,
                width: pulseSize,
                height: pulseSize,
                borderRadius: pulseSize * FX.electricPulseCornerRadiusRatio,
                borderWidth: FX.electricPulseBorderWidthPixels,
                borderColor: FX.electricColors[index % FX.electricColors.length],
                opacity: progress.interpolate({
                  inputRange: [0, start, reveal, FX.electricFadeStartProgress, 1],
                  outputRange: [0, 0, 1, 0, 0],
                }),
                transform: [
                  { rotate: `${FX.electricPulseRotationDegrees}deg` },
                  { scale: progress.interpolate({
                    inputRange: [0, start, FX.electricFadeStartProgress, 1],
                    outputRange: [1, 1, FX.electricPulseEndScale, FX.electricPulseEndScale],
                  }) },
                ],
              },
            ]}
          />
        );
      })}
      {Array.from({ length: FX.electricSparkCount }, (_, index) => {
        const pulseIndex = index % FX.electricPulseCount;
        const start = FX.flashPeakProgress
          + pulseIndex * FX.electricPulseStaggerProgress;
        const reveal = start + FX.electricPulseStaggerProgress;
        const angle = index / FX.electricSparkCount * Math.PI * 2;
        const endDistance = size * FX.electricSparkEndDistanceRatio;
        return (
          <Animated.View
            key={`electric-spark-${index}`}
            style={[
              styles.spark,
              {
                left: size / 2 - FX.electricSparkSizePixels / 2,
                top: size * (FX.electricCoreTopRatio + FX.electricCoreSizeRatio / 2)
                  - FX.electricSparkSizePixels / 2,
                width: FX.electricSparkSizePixels,
                height: FX.electricSparkSizePixels * FX.electricSparkHeightMultiplier,
                borderRadius: FX.electricSparkCornerRadiusPixels,
                backgroundColor: FX.electricColors[index % FX.electricColors.length],
                opacity: progress.interpolate({
                  inputRange: [0, start, reveal, FX.electricFadeStartProgress, 1],
                  outputRange: [0, 0, 1, 0, 0],
                }),
                transform: [
                  { translateX: progress.interpolate({
                    inputRange: [0, start, 1],
                    outputRange: [0, 0, Math.cos(angle) * endDistance],
                  }) },
                  { translateY: progress.interpolate({
                    inputRange: [0, start, 1],
                    outputRange: [0, 0, Math.sin(angle) * endDistance],
                  }) },
                  { rotate: `${angle}rad` },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFill,
  pulse: { position: 'absolute' },
  spark: { position: 'absolute' },
});
