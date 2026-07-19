import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';
import { CookieFragmentImage } from '../CookieFragmentImage';
import { ELECTRIC_BOLT_IMAGES } from './externalVfxImages';
import { ElectricStrikeDynamics } from './ElectricStrikeDynamics';

const FX = COOKIE_FRAGMENTS.claimEffect;

interface ElectricFragmentClaimVisualProps {
  progress: Animated.Value;
  size: number;
}

export const ElectricFragmentClaimVisual = React.memo(
  function ElectricFragmentClaimVisual({ progress, size }: ElectricFragmentClaimVisualProps) {
    const coreSize = size * FX.electricCoreSizeRatio;
    return (
      <View style={styles.fill}>
        {Array.from({ length: FX.electricBoltCount }, (_, index) => {
          const position = FX.electricBoltCount === 1
            ? 0.5
            : index / (FX.electricBoltCount - 1);
          const centerX = size * (
            FX.electricHorizontalInsetRatio
            + position * (1 - FX.electricHorizontalInsetRatio * 2)
          );
          const start = FX.electricRevealProgress
            + index * FX.electricBoltStaggerProgress;
          const revealed = start + FX.electricRevealProgress;
          const hidden = start + FX.electricBoltVisibleProgress;
          const flicker = revealed
            + (hidden - revealed) * FX.electricBoltFlickerRatio;
          const echo = flicker
            + (hidden - flicker) * FX.electricBoltFlickerRatio;
          const rotation = (position * 2 - 1) * FX.electricBoltRotationDegrees;
          return (
            <Animated.Image
              key={`external-lightning-${index}`}
              source={ELECTRIC_BOLT_IMAGES[index % ELECTRIC_BOLT_IMAGES.length]}
              resizeMode="contain"
              style={[
                styles.bolt,
                {
                  left: centerX - size * FX.electricBoltWidthRatio / 2,
                  top: size * FX.electricTopRatio,
                  width: size * FX.electricBoltWidthRatio,
                  height: size * FX.electricBoltHeightRatio,
                  opacity: progress.interpolate({
                    inputRange: [
                      0,
                      start,
                      revealed,
                      flicker,
                      echo,
                      hidden,
                      FX.electricFadeStartProgress,
                      1,
                    ],
                    outputRange: [
                      0,
                      0,
                      1,
                      FX.electricBoltFlickerMinimumOpacity,
                      FX.electricBoltEchoOpacity,
                      0,
                      0,
                      0,
                    ],
                  }),
                  transform: [
                    { rotate: `${rotation}deg` },
                    { scaleY: progress.interpolate({
                      inputRange: [0, revealed, hidden, 1],
                      outputRange: [FX.electricBoltStartScale,
                        FX.electricBoltStartScale, 1, 1],
                    }) },
                  ],
                },
              ]}
            />
          );
        })}
        <ElectricStrikeDynamics progress={progress} size={size} />
        <Animated.View
          style={[
            styles.core,
            {
              left: (size - coreSize) / 2,
              top: size * FX.electricCoreTopRatio,
              width: coreSize,
              height: coreSize,
              opacity: progress.interpolate({
                inputRange: [
                  0,
                  FX.flashPeakProgress,
                  FX.electricFadeStartProgress,
                  1,
                ],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                { scale: progress.interpolate({
                  inputRange: [0, FX.flashPeakProgress, 1],
                  outputRange: [
                    FX.electricCoreStartScale,
                    FX.electricCorePeakScale,
                    FX.electricCoreEndScale,
                  ],
                }) },
                { rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${FX.electricCoreRotationTurns * 360}deg`],
                }) },
              ],
            },
          ]}
        >
          <CookieFragmentImage kind="electric" size={coreSize} />
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  bolt: { position: 'absolute' },
  core: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
