import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';

const FX = COOKIE_FRAGMENTS.claimEffect;

export function MagmaEruptionDynamics({
  progress,
  size,
}: {
  progress: Animated.Value;
  size: number;
}) {
  const craterSize = size * FX.magmaCraterGlowSizeRatio;
  const craterLeft = size * FX.magmaCraterCenterXRatio - craterSize / 2;
  const craterTop = size * FX.magmaCraterCenterYRatio - craterSize / 2;
  const shockwaveWidth = size * FX.magmaShockwaveWidthRatio;
  const shockwaveHeight = size * FX.magmaShockwaveHeightRatio;
  const shockwaveLeft = size * FX.magmaCraterCenterXRatio - shockwaveWidth / 2;
  const shockwaveTop = size * FX.magmaCraterCenterYRatio - shockwaveHeight / 2;
  return (
    <View style={styles.fill}>
      <Animated.View
        style={[
          styles.craterGlow,
          {
            left: craterLeft,
            top: craterTop,
            width: craterSize,
            height: craterSize,
            borderRadius: craterSize,
            backgroundColor: FX.magmaColors[1],
            opacity: progress.interpolate({
              inputRange: [
                0,
                FX.flashPeakProgress,
                FX.magmaVolcanoSettleProgress,
                FX.magmaFadeStartProgress,
                1,
              ],
              outputRange: [0, 0.9, 0.25, 0, 0],
            }),
            transform: [{ scale: progress.interpolate({
              inputRange: [0, FX.flashPeakProgress, FX.magmaVolcanoSettleProgress, 1],
              outputRange: [FX.flashStartScale, 1, FX.magmaCraterGlowEndScale, 1],
            }) }],
          },
        ]}
      />
      {Array.from({ length: FX.magmaShockwaveCount }, (_, index) => {
        const start = FX.flashPeakProgress + index * FX.magmaShockwaveStaggerProgress;
        const reveal = start + FX.magmaShockwaveStaggerProgress;
        return (
          <Animated.View
            key={`magma-shockwave-${index}`}
            style={[
              styles.shockwave,
              {
                left: shockwaveLeft,
                top: shockwaveTop,
                width: shockwaveWidth,
                height: shockwaveHeight,
                borderRadius: shockwaveHeight,
                borderWidth: FX.magmaShockwaveBorderWidthPixels,
                borderColor: FX.magmaColors[index % FX.magmaColors.length],
                opacity: progress.interpolate({
                  inputRange: [0, start, reveal, FX.magmaFadeStartProgress, 1],
                  outputRange: [0, 0, 0.85, 0, 0],
                }),
                transform: [{ scale: progress.interpolate({
                  inputRange: [0, start, FX.magmaFadeStartProgress, 1],
                  outputRange: [1, 1, FX.magmaShockwaveEndScale, FX.magmaShockwaveEndScale],
                }) }],
              },
            ]}
          />
        );
      })}
      {Array.from({ length: FX.magmaEmberCount }, (_, index) => {
        const start = FX.flashPeakProgress + index * FX.magmaEmberStaggerProgress;
        const reveal = start + FX.magmaEmberStaggerProgress;
        const horizontalPosition = FX.magmaEmberCount === 1
          ? 0
          : index / (FX.magmaEmberCount - 1) * 2 - 1;
        const direction = index % 2 === 0 ? 1 : -1;
        return (
          <Animated.View
            key={`magma-ember-${index}`}
            style={[
              styles.ember,
              {
                left: size * FX.magmaCraterCenterXRatio - FX.magmaEmberSizePixels / 2,
                top: size * FX.magmaCraterCenterYRatio - FX.magmaEmberSizePixels / 2,
                width: FX.magmaEmberSizePixels,
                height: FX.magmaEmberSizePixels,
                borderRadius: FX.magmaEmberSizePixels,
                backgroundColor: FX.magmaColors[index % FX.magmaColors.length],
                opacity: progress.interpolate({
                  inputRange: [0, start, reveal, FX.magmaFadeStartProgress, 1],
                  outputRange: [0, 0, 1, 0, 0],
                }),
                transform: [
                  { translateX: progress.interpolate({
                    inputRange: [0, start, 1],
                    outputRange: [0, 0, size * FX.magmaEmberSpreadRatio
                      * horizontalPosition],
                  }) },
                  { translateY: progress.interpolate({
                    inputRange: [0, start, 1],
                    outputRange: [0, 0, -size * FX.magmaEmberRiseRatio],
                  }) },
                  { rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      '0deg',
                      `${direction * FX.magmaEmberRotationTurns * 360}deg`,
                    ],
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
  craterGlow: { position: 'absolute' },
  shockwave: { position: 'absolute' },
  ember: { position: 'absolute' },
});
