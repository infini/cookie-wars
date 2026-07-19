import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { getCookieLineBurst, getCookieSpecialEffect } from '../../config';
import type { CookieLineBurstKind } from '../../types/game';
import { resolveCookieSpecialEffectLayout } from './CookieAnimatedSpecialEffect';

function MainLines({
  progress,
  size,
  kind,
  compact,
}: {
  progress: Animated.Value;
  size: number;
  kind: CookieLineBurstKind;
  compact: boolean;
}) {
  const config = getCookieLineBurst(kind);
  const lineCount = compact ? config.compactMainLineCount : config.mainLineCount;
  const length = size * config.mainLineLengthRatio;
  const opacity = progress.interpolate({
    inputRange: [0, config.impactPeakProgress, config.fadeStartProgress, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scaleX = progress.interpolate({
    inputRange: [0, config.impactPeakProgress, 1],
    outputRange: [config.flashStartScale, 1, config.flashEndScale],
  });
  return Array.from({ length: lineCount }, (_, lineIndex) => {
    const angle = config.mainAngleOffsetDegrees + lineIndex * config.mainAngleStepDegrees;
    return (
      <React.Fragment key={`main-${lineIndex}`}>
        {config.ghostColors.map((color, ghostIndex) => {
          const centeredIndex = ghostIndex - (config.ghostColors.length - 1) / 2;
          const offset = centeredIndex * config.ghostOffsetPixels;
          return (
            <Animated.View
              key={`main-${lineIndex}-ghost-${ghostIndex}`}
              style={[
                styles.line,
                {
                  left: (size - length) / 2 + offset,
                  top: (size - config.mainLineWidthPixels) / 2 - offset,
                  width: length,
                  height: config.mainLineWidthPixels,
                  backgroundColor: color,
                  opacity,
                  transform: [{ rotate: `${angle}deg` }, { scaleX }],
                },
              ]}
            />
          );
        })}
        <Animated.View
          style={[
            styles.line,
            {
              left: (size - length) / 2,
              top: (size - config.mainLineWidthPixels) / 2,
              width: length,
              height: config.mainLineWidthPixels,
              opacity,
              transform: [{ rotate: `${angle}deg` }, { scaleX }],
            },
          ]}
        >
          <LinearGradient
            colors={config.mainGradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fill}
          />
        </Animated.View>
      </React.Fragment>
    );
  });
}

function RadialLines({
  progress,
  size,
  kind,
  compact,
}: {
  progress: Animated.Value;
  size: number;
  kind: CookieLineBurstKind;
  compact: boolean;
}) {
  const config = getCookieLineBurst(kind);
  const lineCount = compact ? config.compactRadialLineCount : config.radialLineCount;
  const lineLength = size * config.radialLineLengthRatio;
  const startDistance = size * config.radialStartDistanceRatio;
  return Array.from({ length: lineCount }, (_, lineIndex) => {
    const angle = config.radialAngleOffsetDegrees + lineIndex / lineCount * 360;
    const reveal = config.radialRevealProgress + lineIndex * config.radialStaggerProgress;
    return (
      <View
        key={`radial-${lineIndex}`}
        style={[styles.radialLayer, { width: size, height: size, transform: [{ rotate: `${angle}deg` }] }]}
      >
        <Animated.View
          style={[
            styles.radialLine,
            {
              left: (size - config.radialLineWidthPixels) / 2,
              top: size / 2 - startDistance - lineLength,
              width: config.radialLineWidthPixels,
              height: lineLength,
              backgroundColor: config.radialColors[lineIndex % config.radialColors.length],
              opacity: progress.interpolate({
                inputRange: [0, reveal, config.radialFadeStartProgress, 1],
                outputRange: [0, 0, 1, 0],
              }),
              transform: [{ scaleY: progress.interpolate({
                inputRange: [0, reveal, config.radialFadeStartProgress, 1],
                outputRange: [config.flashStartScale, config.flashStartScale, 1, 1],
              }) }],
            },
          ]}
        />
      </View>
    );
  });
}

export const CookieLineBurstEffect = React.memo(function CookieLineBurstEffect({
  kind,
  compact,
}: {
  kind: CookieLineBurstKind;
  compact: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const viewport = useWindowDimensions();
  const effect = getCookieSpecialEffect(kind);
  const config = getCookieLineBurst(kind);
  const layout = resolveCookieSpecialEffectLayout(effect, viewport.width, viewport.height);
  const size = layout.size;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: compact ? effect.compactDurationMs : effect.durationMs,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [compact, effect.compactDurationMs, effect.durationMs, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.effect,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          zIndex: effect.zIndex,
          transform: [
            { translateX: layout.offsetX },
            { translateY: layout.offsetY },
            { scale: compact ? config.compactScale : 1 },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.flash,
          {
            width: size,
            height: size,
            backgroundColor: config.flashColor,
            opacity: progress.interpolate({
              inputRange: [0, config.impactPeakProgress, config.fadeStartProgress, 1],
              outputRange: [
                0,
                compact ? config.compactFlashMaximumOpacity : config.flashMaximumOpacity,
                0,
                0,
              ],
            }),
            transform: [
              { rotate: '45deg' },
              { scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [config.flashStartScale, config.flashEndScale],
              }) },
            ],
          },
        ]}
      />
      <MainLines progress={progress} size={size} kind={kind} compact={compact} />
      <RadialLines progress={progress} size={size} kind={kind} compact={compact} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%' },
  flash: { position: 'absolute' },
  line: { position: 'absolute', overflow: 'hidden' },
  radialLayer: { position: 'absolute' },
  radialLine: { position: 'absolute' },
  fill: { flex: 1 },
});
