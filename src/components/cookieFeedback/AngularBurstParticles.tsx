import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface LightningBurstProps {
  progress: Animated.Value;
  size: number;
  branchCount: number;
  segmentCount: number;
  segmentLengthPixels: number;
  segmentWidthPixels: number;
  startDistancePixels: number;
  angleOffsetDegrees: number;
  segmentTurnDegrees: number;
  zigzagOffsetPixels: number;
  revealProgress: number;
  branchStaggerProgress: number;
  segmentStaggerProgress: number;
  fadeStartProgress: number;
  segmentStartScale: number;
  colors: string[];
}

export function LightningBurst({
  progress,
  size,
  branchCount,
  segmentCount,
  segmentLengthPixels,
  segmentWidthPixels,
  startDistancePixels,
  angleOffsetDegrees,
  segmentTurnDegrees,
  zigzagOffsetPixels,
  revealProgress,
  branchStaggerProgress,
  segmentStaggerProgress,
  fadeStartProgress,
  segmentStartScale,
  colors,
}: LightningBurstProps) {
  return Array.from({ length: branchCount }, (_, branchIndex) => {
    const branchAngle = angleOffsetDegrees + branchIndex / branchCount * 360;
    return (
      <View
        key={`lightning-${branchIndex}`}
        style={[
          styles.branch,
          { width: size, height: size, transform: [{ rotate: `${branchAngle}deg` }] },
        ]}
      >
        {Array.from({ length: segmentCount }, (_, segmentIndex) => {
          const direction = segmentIndex % 2 === 0 ? 1 : -1;
          const start = revealProgress
            + branchIndex * branchStaggerProgress
            + segmentIndex * segmentStaggerProgress;
          return (
            <Animated.View
              key={`lightning-${branchIndex}-${segmentIndex}`}
              style={[
                styles.lightningSegment,
                {
                  left: size / 2 - segmentWidthPixels / 2
                    + direction * zigzagOffsetPixels,
                  top: size / 2 - startDistancePixels
                    - (segmentIndex + 1) * segmentLengthPixels,
                  width: segmentWidthPixels,
                  height: segmentLengthPixels,
                  backgroundColor: colors[(branchIndex + segmentIndex) % colors.length],
                  opacity: progress.interpolate({
                    inputRange: [0, start, fadeStartProgress, 1],
                    outputRange: [0, 0, 1, 0],
                  }),
                  transform: [
                    { rotate: `${direction * segmentTurnDegrees}deg` },
                    { scaleY: progress.interpolate({
                      inputRange: [0, start, fadeStartProgress, 1],
                      outputRange: [segmentStartScale, segmentStartScale, 1, 1],
                    }) },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    );
  });
}

interface AngularShardBurstProps {
  progress: Animated.Value;
  size: number;
  count: number;
  startProgress: number;
  revealProgress: number;
  fadeStartProgress: number;
  startDistancePixels: number;
  endDistancePixels: number;
  minimumSizePixels: number;
  maximumSizePixels: number;
  rotationTurns: number;
  angleOffsetDegrees: number;
  colors: string[];
}

export function AngularShardBurst({
  progress,
  size,
  count,
  startProgress,
  revealProgress,
  fadeStartProgress,
  startDistancePixels,
  endDistancePixels,
  minimumSizePixels,
  maximumSizePixels,
  rotationTurns,
  angleOffsetDegrees,
  colors,
}: AngularShardBurstProps) {
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0 : index / (count - 1);
    const shardSize = minimumSizePixels
      + (maximumSizePixels - minimumSizePixels) * ratio;
    const angle = angleOffsetDegrees + index / count * 360;
    const direction = index % 2 === 0 ? 1 : -1;
    return (
      <Animated.View
        key={`shard-${index}`}
        style={[
          styles.shard,
          {
            left: size / 2 - shardSize / 2,
            top: size / 2 - shardSize / 2,
            width: shardSize,
            height: shardSize,
            backgroundColor: colors[index % colors.length],
            opacity: progress.interpolate({
              inputRange: [0, startProgress, revealProgress, fadeStartProgress, 1],
              outputRange: [0, 0, 1, 1, 0],
            }),
            transform: [
              { rotate: `${angle}deg` },
              { translateY: progress.interpolate({
                inputRange: [0, startProgress, 1],
                outputRange: [
                  -startDistancePixels,
                  -startDistancePixels,
                  -endDistancePixels,
                ],
              }) },
              { rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${direction * rotationTurns * 360}deg`],
              }) },
            ],
          },
        ]}
      />
    );
  });
}

const styles = StyleSheet.create({
  branch: { position: 'absolute' },
  lightningSegment: { position: 'absolute' },
  shard: { position: 'absolute' },
});
