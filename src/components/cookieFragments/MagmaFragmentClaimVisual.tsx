import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';

const FX = COOKIE_FRAGMENTS.claimEffect;
const VOLCANO_ERUPTION = require(
  '../../../assets/images/cookie-fragments/magma-volcano-eruption.webp'
);

interface MagmaFragmentClaimVisualProps {
  progress: Animated.Value;
  size: number;
}

export const MagmaFragmentClaimVisual = React.memo(
  function MagmaFragmentClaimVisual({ progress, size }: MagmaFragmentClaimVisualProps) {
    return (
      <>
        <Animated.View
          style={[
            styles.volcano,
            {
              width: size * FX.magmaVolcanoSizeRatio,
              height: size * FX.magmaVolcanoSizeRatio,
              left: size * FX.magmaVolcanoLeftRatio,
              top: size * FX.magmaVolcanoTopRatio,
              opacity: progress.interpolate({
                inputRange: [0, FX.flashPeakProgress, FX.fadeStartProgress, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                { translateY: progress.interpolate({
                  inputRange: [0, FX.flashPeakProgress, 1],
                  outputRange: [size * FX.magmaVolcanoStartOffsetYRatio, 0,
                    size * FX.magmaVolcanoEndOffsetYRatio],
                }) },
                { scale: progress.interpolate({
                  inputRange: [0, FX.flashPeakProgress, FX.magmaVolcanoSettleProgress, 1],
                  outputRange: [FX.flashStartScale, FX.magmaVolcanoPeakScale, 1,
                    FX.flashEndScale],
                }) },
              ],
            },
          ]}
        >
          <Image source={VOLCANO_ERUPTION} resizeMode="contain" style={styles.fill} />
        </Animated.View>
        {Array.from({ length: FX.magmaStreamCount }, (_, index) => {
          const ratio = FX.magmaStreamCount === 1
            ? 0.5
            : index / (FX.magmaStreamCount - 1);
          const width = FX.magmaStreamMinimumWidthPixels
            + (FX.magmaStreamMaximumWidthPixels - FX.magmaStreamMinimumWidthPixels)
              * ((index * FX.magmaStreamWidthSequenceStep) % FX.magmaStreamCount)
              / Math.max(1, FX.magmaStreamCount - 1);
          const start = FX.magmaStreamRevealProgress
            + index * FX.magmaStreamStaggerProgress;
          const revealEnd = start + FX.magmaStreamRevealProgress;
          return (
            <Animated.View
              key={`magma-stream-${index}`}
              style={[
                styles.lavaStream,
                {
                  left: size * (
                    FX.magmaHorizontalInsetRatio
                    + ratio * (1 - FX.magmaHorizontalInsetRatio * 2)
                  ) - width / 2,
                  top: -size * FX.magmaStreamLengthRatio,
                  width,
                  height: size * FX.magmaStreamLengthRatio,
                  opacity: progress.interpolate({
                    inputRange: [0, start, revealEnd, FX.fadeStartProgress, 1],
                    outputRange: [0, 0, 1, 1, 0],
                  }),
                  transform: [{
                    translateY: progress.interpolate({
                      inputRange: [0, start, 1],
                      outputRange: [0, 0, size * FX.magmaFlowDistanceRatio],
                    }),
                  }],
                },
              ]}
            >
              <LinearGradient
                colors={FX.magmaColors as [string, string, ...string[]]}
                style={styles.fill}
              />
            </Animated.View>
          );
        })}
        {Array.from({ length: FX.magmaEmberCount }, (_, index) => {
          const ratio = index / Math.max(1, FX.magmaEmberCount - 1);
          const emberSize = FX.magmaEmberMinimumSizePixels
            + (FX.magmaEmberMaximumSizePixels - FX.magmaEmberMinimumSizePixels)
              * ((index * FX.magmaEmberSizeSequenceStep) % FX.magmaEmberCount)
              / Math.max(1, FX.magmaEmberCount - 1);
          const direction = index % 2 === 0 ? 1 : -1;
          return (
            <Animated.View
              key={`magma-ember-${index}`}
              style={[
                styles.ember,
                {
                  width: emberSize,
                  height: emberSize,
                  left: size * (
                    FX.magmaEmberHorizontalInsetRatio
                    + ratio * (1 - FX.magmaEmberHorizontalInsetRatio * 2)
                  ),
                  top: -FX.magmaEmberStartDistancePixels,
                  backgroundColor: FX.magmaColors[index % FX.magmaColors.length],
                  opacity: progress.interpolate({
                    inputRange: [0, FX.magmaEmberRevealProgress, FX.fadeStartProgress, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    { translateX: direction * FX.magmaEmberStartDistancePixels },
                    { translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, size * FX.magmaEmberFallDistanceRatio],
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
      </>
    );
  },
);

const styles = StyleSheet.create({
  volcano: { position: 'absolute' },
  lavaStream: { position: 'absolute', overflow: 'hidden', borderRadius: 22 },
  ember: { position: 'absolute', borderRadius: 4 },
  fill: { flex: 1 },
});
