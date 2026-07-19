import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FEEDBACK } from '../config';
import { CookieFeedbackTier } from '../types/game';
import {
  AngularShardBurst,
  LightningBurst,
} from './cookieFeedback/AngularBurstParticles';
import {
  ImpactFlash,
  SlashBurst,
} from './cookieFeedback/AngularImpactPrimitives';

type CriticalEffectMode = Extract<
  CookieFeedbackTier,
  'criticalFull' | 'criticalCompact'
>;

const FX = COOKIE_FEEDBACK.criticalEffect;

export const CookieCriticalEffect = React.memo(function CookieCriticalEffect({
  mode,
}: {
  mode: CriticalEffectMode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const full = mode === 'criticalFull';

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: full ? FX.durationMs : FX.compactDurationMs,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [full, progress]);

  const size = FX.sizePixels;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.effect,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transform: [{ scale: full ? 1 : FX.compactScale }],
        },
      ]}
    >
      <ImpactFlash
        progress={progress}
        size={size}
        color={FX.flashColor}
        maximumOpacity={full ? FX.flashMaximumOpacity : FX.compactFlashMaximumOpacity}
        startScale={FX.flashStartScale}
        endScale={FX.flashEndScale}
        rotationDegrees={FX.flashRotationDegrees}
        peakProgress={FX.impactPeakProgress}
        fadeStartProgress={FX.impactFadeStartProgress}
      />
      <SlashBurst
        progress={progress}
        size={size}
        count={full ? FX.slashCount : FX.compactSlashCount}
        lengthPixels={FX.slashLengthPixels}
        widthPixels={FX.slashWidthPixels}
        angleOffsetDegrees={FX.slashAngleOffsetDegrees}
        angleStepDegrees={FX.slashAngleStepDegrees}
        startScale={FX.slashStartScale}
        peakScale={FX.slashPeakScale}
        endScale={FX.slashEndScale}
        gradientColors={FX.slashGradientColors}
        peakProgress={FX.impactPeakProgress}
        fadeStartProgress={FX.slashFadeStartProgress}
      />
      <LightningBurst
        progress={progress}
        size={size}
        branchCount={full ? FX.lightningBranchCount : FX.compactLightningBranchCount}
        segmentCount={FX.lightningSegmentCount}
        segmentLengthPixels={FX.lightningSegmentLengthPixels}
        segmentWidthPixels={FX.lightningSegmentWidthPixels}
        startDistancePixels={FX.lightningStartDistancePixels}
        angleOffsetDegrees={FX.lightningAngleOffsetDegrees}
        segmentTurnDegrees={FX.lightningSegmentTurnDegrees}
        zigzagOffsetPixels={FX.lightningZigzagOffsetPixels}
        revealProgress={FX.lightningRevealProgress}
        branchStaggerProgress={FX.lightningBranchStaggerProgress}
        segmentStaggerProgress={FX.lightningSegmentStaggerProgress}
        fadeStartProgress={FX.lightningFadeStartProgress}
        segmentStartScale={FX.lightningSegmentStartScale}
        colors={FX.lightningColors}
      />
      {full ? (
        <AngularShardBurst
          progress={progress}
          size={size}
          count={FX.fragmentCount}
          startProgress={FX.fragmentStartProgress}
          revealProgress={FX.fragmentRevealProgress}
          fadeStartProgress={FX.fragmentFadeStartProgress}
          startDistancePixels={FX.fragmentStartDistancePixels}
          endDistancePixels={FX.fragmentEndDistancePixels}
          minimumSizePixels={FX.fragmentMinimumSizePixels}
          maximumSizePixels={FX.fragmentMaximumSizePixels}
          rotationTurns={FX.fragmentRotationTurns}
          angleOffsetDegrees={FX.fragmentAngleOffsetDegrees}
          colors={FX.fragmentColors}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%', zIndex: 7 },
});
