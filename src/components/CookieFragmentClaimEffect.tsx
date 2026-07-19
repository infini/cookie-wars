import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { COOKIE_FRAGMENTS, getCookieFragment } from '../config';
import { fonts } from '../theme/typography';
import type { CookieFragmentKind } from '../types/game';
import { formatNumber } from '../utils/format';
import { ImpactFlash } from './cookieFeedback/AngularImpactPrimitives';
import { ElectricFragmentClaimVisual } from './cookieFragments/ElectricFragmentClaimVisual';
import { MagmaFragmentClaimVisual } from './cookieFragments/MagmaFragmentClaimVisual';

const FX = COOKIE_FRAGMENTS.claimEffect;

export const CookieFragmentClaimEffect = React.memo(
  function CookieFragmentClaimEffect({
    kind,
    amount,
    multiplier,
  }: {
    kind: CookieFragmentKind;
    amount: number;
    multiplier: number;
  }) {
    const progress = useRef(new Animated.Value(0)).current;
    const viewport = useWindowDimensions();
    const config = getCookieFragment(kind);
    const duration = kind === 'magma' ? FX.magmaDurationMs : FX.electricDurationMs;
    const shakeDistance = kind === 'magma'
      ? FX.magmaShakeDistancePixels
      : FX.electricShakeDistancePixels;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [duration, progress]);

    const opacity = progress.interpolate({
      inputRange: [0, FX.flashPeakProgress, FX.fadeStartProgress, 1],
      outputRange: [0, 1, 1, 0],
    });
    const size = Math.max(
      FX.sizePixels,
      viewport.width * FX.screenWidthRatio,
      viewport.height * FX.screenHeightRatio,
    );
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
            transform: [{
              translateX: progress.interpolate({
                inputRange: [0, FX.flashPeakProgress, FX.flashFadeProgress, 1],
                outputRange: [0, -shakeDistance, shakeDistance, 0],
              }),
            }],
          },
        ]}
      >
        <ImpactFlash
          progress={progress}
          size={size}
          color={kind === 'magma' ? config.glowColor : FX.electricColors[0]}
          maximumOpacity={FX.flashMaximumOpacity}
          startScale={FX.flashStartScale}
          endScale={FX.flashEndScale}
          rotationDegrees={kind === 'magma'
            ? FX.magmaFlashRotationDegrees
            : FX.electricFlashRotationDegrees}
          peakProgress={FX.flashPeakProgress}
          fadeStartProgress={FX.flashFadeProgress}
        />
        {kind === 'magma'
          ? <MagmaFragmentClaimVisual progress={progress} size={size} />
          : <ElectricFragmentClaimVisual progress={progress} size={size} />}
        <Animated.Text
          style={[
            styles.reward,
            {
              top: size * FX.rewardTopRatio,
              width: size,
              color: config.labelColor,
              fontSize: FX.rewardFontSize,
              textShadowColor: FX.rewardShadowColor,
              textShadowRadius: FX.rewardShadowRadius,
              opacity,
              transform: [{
                scale: progress.interpolate({
                  inputRange: [0, FX.flashPeakProgress, 1],
                  outputRange: [
                    FX.rewardStartScale,
                    FX.rewardPeakScale,
                    FX.rewardEndScale,
                  ],
                }),
              }],
            },
          ]}
        >
          +{formatNumber(amount)} · ×{formatNumber(multiplier)}
        </Animated.Text>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%', zIndex: 12 },
  reward: { position: 'absolute', textAlign: 'center', fontFamily: fonts.extraBold },
});
