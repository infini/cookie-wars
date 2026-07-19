import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FEEDBACK } from '../../config';

const FX = COOKIE_FEEDBACK.superCriticalEffect;

export function SuperCriticalMotionBurst({
  progress,
  size,
  compact,
}: {
  progress: Animated.Value;
  size: number;
  compact: boolean;
}) {
  const waveSize = FX.shockwaveSizePixels * (compact ? FX.compactScale : 1);
  return (
    <View style={styles.fill}>
      <Animated.View
        style={[
          styles.charge,
          {
            left: (size - waveSize) / 2,
            top: (size - waveSize) / 2,
            width: waveSize,
            height: waveSize,
            borderRadius: waveSize * FX.shockwaveCornerRadiusRatio,
            borderColor: FX.shockwaveColor,
            borderWidth: FX.shockwaveBorderWidthPixels,
            opacity: progress.interpolate({
              inputRange: [0, FX.chargeEndProgress, FX.impactPeakProgress, 1],
              outputRange: [0, 1, 0, 0],
            }),
            transform: [
              { rotate: `${FX.shockwaveRotationDegrees}deg` },
              { scale: progress.interpolate({
                inputRange: [0, FX.chargeEndProgress, FX.impactPeakProgress, 1],
                outputRange: [FX.shockwaveEndScale, FX.emblemStartScale, 1, 1],
              }) },
            ],
          },
        ]}
      />
      {Array.from({ length: compact ? 1 : FX.shockwaveCount }, (_, index) => {
        const start = FX.impactPeakProgress + index * FX.shockwaveStaggerProgress;
        const reveal = start + FX.shockwaveStaggerProgress;
        return (
          <Animated.View
            key={`super-shockwave-${index}`}
            style={[
              styles.wave,
              {
                left: (size - waveSize) / 2,
                top: (size - waveSize) / 2,
                width: waveSize,
                height: waveSize,
                borderRadius: waveSize * FX.shockwaveCornerRadiusRatio,
                borderColor: FX.shockwaveColor,
                borderWidth: FX.shockwaveBorderWidthPixels,
                opacity: progress.interpolate({
                  inputRange: [0, start, reveal, FX.impactFadeStartProgress, 1],
                  outputRange: [0, 0, 0.9, 0, 0],
                }),
                transform: [
                  { rotate: `${FX.shockwaveRotationDegrees}deg` },
                  { scale: progress.interpolate({
                    inputRange: [0, start, FX.impactFadeStartProgress, 1],
                    outputRange: [1, 1, FX.shockwaveEndScale, FX.shockwaveEndScale],
                  }) },
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
  charge: { position: 'absolute' },
  wave: { position: 'absolute' },
});
