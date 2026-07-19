import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ImpactTimeline {
  peakProgress: number;
  fadeStartProgress: number;
}

interface ImpactFlashProps extends ImpactTimeline {
  progress: Animated.Value;
  size: number;
  color: string;
  maximumOpacity: number;
  startScale: number;
  endScale: number;
  rotationDegrees: number;
}

export function ImpactFlash({
  progress,
  size,
  color,
  maximumOpacity,
  startScale,
  endScale,
  rotationDegrees,
  peakProgress,
  fadeStartProgress,
}: ImpactFlashProps) {
  return (
    <Animated.View
      style={[
        styles.centered,
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity: progress.interpolate({
            inputRange: [0, peakProgress, fadeStartProgress, 1],
            outputRange: [0, maximumOpacity, 0, 0],
          }),
          transform: [
            { rotate: `${rotationDegrees}deg` },
            { scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [startScale, endScale],
            }) },
          ],
        },
      ]}
    />
  );
}

interface SlashBurstProps extends ImpactTimeline {
  progress: Animated.Value;
  size: number;
  count: number;
  lengthPixels: number;
  widthPixels: number;
  angleOffsetDegrees: number;
  angleStepDegrees: number;
  startScale: number;
  peakScale: number;
  endScale: number;
  gradientColors: string[];
  ghostColors?: string[];
  ghostOffsetPixels?: number;
}

export function SlashBurst({
  progress,
  size,
  count,
  lengthPixels,
  widthPixels,
  angleOffsetDegrees,
  angleStepDegrees,
  startScale,
  peakScale,
  endScale,
  gradientColors,
  ghostColors = [],
  ghostOffsetPixels = 0,
  peakProgress,
  fadeStartProgress,
}: SlashBurstProps) {
  const slashOpacity = progress.interpolate({
    inputRange: [0, peakProgress, fadeStartProgress, 1],
    outputRange: [0, 1, 1, 0],
  });
  const slashScale = progress.interpolate({
    inputRange: [0, peakProgress, 1],
    outputRange: [startScale, peakScale, endScale],
  });
  return Array.from({ length: count }, (_, slashIndex) => {
    const angle = angleOffsetDegrees + slashIndex * angleStepDegrees;
    return (
      <React.Fragment key={`slash-${slashIndex}`}>
        {ghostColors.map((color, ghostIndex) => {
          const centeredIndex = ghostIndex - (ghostColors.length - 1) / 2;
          const offset = centeredIndex * ghostOffsetPixels;
          return (
            <Animated.View
              key={`slash-${slashIndex}-ghost-${ghostIndex}`}
              style={[
                styles.slash,
                {
                  left: (size - lengthPixels) / 2 + offset,
                  top: (size - widthPixels) / 2 - offset,
                  width: lengthPixels,
                  height: widthPixels,
                  backgroundColor: color,
                  opacity: slashOpacity,
                  transform: [{ rotate: `${angle}deg` }, { scaleX: slashScale }],
                },
              ]}
            />
          );
        })}
        <Animated.View
          style={[
            styles.slash,
            {
              left: (size - lengthPixels) / 2,
              top: (size - widthPixels) / 2,
              width: lengthPixels,
              height: widthPixels,
              opacity: slashOpacity,
              transform: [{ rotate: `${angle}deg` }, { scaleX: slashScale }],
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            style={styles.fill}
          />
        </Animated.View>
      </React.Fragment>
    );
  });
}

const styles = StyleSheet.create({
  centered: { position: 'absolute' },
  slash: { position: 'absolute', overflow: 'hidden' },
  fill: { flex: 1 },
});
