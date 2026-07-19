import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';
import { ELECTRIC_BOLT_IMAGES } from './externalVfxImages';

const FX = COOKIE_FRAGMENTS.claimEffect;

interface ElectricFragmentClaimVisualProps {
  progress: Animated.Value;
  size: number;
}

export const ElectricFragmentClaimVisual = React.memo(
  function ElectricFragmentClaimVisual({ progress, size }: ElectricFragmentClaimVisualProps) {
    return (
      <>
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
                    inputRange: [0, start, revealed, hidden, FX.fadeStartProgress, 1],
                    outputRange: [0, 0, 1, 1, 0, 0],
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
      </>
    );
  },
);

const styles = StyleSheet.create({
  bolt: { position: 'absolute' },
});
