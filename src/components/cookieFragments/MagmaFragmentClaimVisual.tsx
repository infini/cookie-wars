import React from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';
import { MagmaEruptionDynamics } from './MagmaEruptionDynamics';

const FX = COOKIE_FRAGMENTS.claimEffect;
const VOLCANO_ERUPTION = require(
  '../../../assets/images/cookie-fragments/magma-volcano-eruption.webp'
);
export const MAGMA_FIRE_PLUME = require('../../../assets/images/vfx/magma-fire-plume.webp');

interface MagmaFragmentClaimVisualProps {
  progress: Animated.Value;
  size: number;
}

export const MagmaFragmentClaimVisual = React.memo(
  function MagmaFragmentClaimVisual({ progress, size }: MagmaFragmentClaimVisualProps) {
    const pulseSteps = FX.magmaPlumePulseCount * 2;
    const pulseInputRange = [0, FX.flashPeakProgress];
    const pulseScaleRange = [FX.magmaPlumeStartScaleY, FX.magmaPlumePeakScaleY];
    const pulseSwayRange = [0, 0];
    Array.from({ length: pulseSteps }, (_, index) => index + 1).forEach((step) => {
      pulseInputRange.push(
        FX.flashPeakProgress
          + (FX.magmaFadeStartProgress - FX.flashPeakProgress) * step / pulseSteps,
      );
      pulseScaleRange.push(
        1 + (step % 2 === 0 ? -1 : 1) * FX.magmaPlumePulseScaleDelta,
      );
      pulseSwayRange.push((step % 2 === 0 ? -1 : 1) * FX.magmaPlumeSwayPixels);
    });
    pulseInputRange.push(1);
    pulseScaleRange.push(FX.magmaPlumeEndScaleY);
    pulseSwayRange.push(0);
    const opacity = progress.interpolate({
      inputRange: [0, FX.flashPeakProgress, FX.magmaFadeStartProgress, 1],
      outputRange: [0, 1, 1, 0],
    });

    return (
      <>
        <Animated.Image
          source={MAGMA_FIRE_PLUME}
          resizeMode="contain"
          style={[
            styles.plume,
            {
              width: size * FX.magmaPlumeSizeRatio,
              height: size * FX.magmaPlumeSizeRatio,
              left: size * FX.magmaPlumeLeftRatio,
              top: size * FX.magmaPlumeTopRatio,
              opacity,
              transform: [
                { translateX: progress.interpolate({
                  inputRange: pulseInputRange,
                  outputRange: pulseSwayRange,
                }) },
                { translateY: progress.interpolate({
                  inputRange: [0, FX.flashPeakProgress, 1],
                  outputRange: [size * FX.magmaPlumeStartOffsetYRatio, 0, 0],
                }) },
                { scaleY: progress.interpolate({
                  inputRange: pulseInputRange,
                  outputRange: pulseScaleRange,
                }) },
              ],
            },
          ]}
        />
        <MagmaEruptionDynamics progress={progress} size={size} />
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
      </>
    );
  },
);

const styles = StyleSheet.create({
  volcano: { position: 'absolute' },
  plume: { position: 'absolute' },
  fill: { width: '100%', height: '100%' },
});
