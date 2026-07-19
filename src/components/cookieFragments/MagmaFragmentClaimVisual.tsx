import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';
import { MAGMA_ERUPTION_FRAMES } from './externalVfxImages';

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
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setFrameIndex((current) => {
          if (current >= FX.magmaEruptionFrameCount - 1) {
            clearInterval(timer);
            return current;
          }
          return current + 1;
        });
      }, FX.magmaEruptionFrameIntervalMs);
      return () => clearInterval(timer);
    }, []);

    const opacity = progress.interpolate({
      inputRange: [0, FX.flashPeakProgress, FX.fadeStartProgress, 1],
      outputRange: [0, 1, 1, 0],
    });

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
              opacity,
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
        <Animated.Image
          source={MAGMA_ERUPTION_FRAMES[frameIndex]}
          resizeMode="contain"
          style={[
            styles.eruption,
            {
              width: size * FX.magmaEruptionSizeRatio,
              height: size * FX.magmaEruptionSizeRatio,
              left: size * FX.magmaEruptionLeftRatio,
              top: size * FX.magmaEruptionTopRatio,
              opacity,
            },
          ]}
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  volcano: { position: 'absolute' },
  eruption: { position: 'absolute' },
  fill: { flex: 1 },
});
