import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FEEDBACK } from '../config';
import type { CookieFeedbackTier } from '../types/game';
import { fonts } from '../theme/typography';
import {
  AngularShardBurst,
  LightningBurst,
} from './cookieFeedback/AngularBurstParticles';
import {
  ImpactFlash,
  SlashBurst,
} from './cookieFeedback/AngularImpactPrimitives';

type SuperCriticalEffectMode = Extract<
  CookieFeedbackTier,
  'superCriticalFull' | 'superCriticalCompact'
>;

const FX = COOKIE_FEEDBACK.superCriticalEffect;

export const CookieSuperCriticalEffect = React.memo(
  function CookieSuperCriticalEffect({ mode }: { mode: SuperCriticalEffectMode }) {
    const progress = useRef(new Animated.Value(0)).current;
    const full = mode === 'superCriticalFull';
    const size = FX.sizePixels;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: full ? FX.durationMs : FX.compactDurationMs,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [full, progress]);

    const impactOpacity = progress.interpolate({
      inputRange: [0, FX.impactPeakProgress, FX.impactFadeStartProgress, 1],
      outputRange: [0, 1, 1, 0],
    });
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
        <Animated.View
          style={[
            styles.lightningColumn,
            {
              left: (size - FX.columnWidthPixels) / 2,
              top: (size - FX.columnLengthPixels) / 2,
              width: FX.columnWidthPixels,
              height: FX.columnLengthPixels,
              opacity: impactOpacity,
              transform: [{ scaleY: progress.interpolate({
                inputRange: [0, FX.impactPeakProgress, 1],
                outputRange: [FX.columnStartScale, FX.columnPeakScale, FX.columnEndScale],
              }) }],
            },
          ]}
        >
          <LinearGradient
            colors={FX.columnGradientColors as [string, string, ...string[]]}
            style={styles.fill}
          />
        </Animated.View>
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
          ghostColors={FX.ghostSlashColors}
          ghostOffsetPixels={FX.ghostSlashOffsetPixels}
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
        <AngularShardBurst
          progress={progress}
          size={size}
          count={full ? FX.shardCount : FX.compactShardCount}
          startProgress={FX.shardStartProgress}
          revealProgress={FX.shardRevealProgress}
          fadeStartProgress={FX.shardFadeStartProgress}
          startDistancePixels={FX.shardStartDistancePixels}
          endDistancePixels={FX.shardEndDistancePixels}
          minimumSizePixels={FX.shardMinimumSizePixels}
          maximumSizePixels={FX.shardMaximumSizePixels}
          rotationTurns={FX.shardRotationTurns}
          angleOffsetDegrees={FX.shardAngleOffsetDegrees}
          colors={FX.shardColors}
        />
        <Animated.Text
          style={[
            styles.label,
            {
              top: size * FX.labelTopRatio,
              width: size,
              color: FX.labelColor,
              fontSize: FX.labelFontSize,
              textShadowColor: FX.labelShadowColor,
              textShadowRadius: FX.labelShadowRadius,
              opacity: impactOpacity,
              transform: [{ scale: progress.interpolate({
                inputRange: [0, FX.impactPeakProgress, 1],
                outputRange: [FX.labelStartScale, FX.labelPeakScale, FX.labelEndScale],
              }) }],
            },
          ]}
        >
          슈퍼 크리티컬!
        </Animated.Text>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%', zIndex: 9 },
  lightningColumn: { position: 'absolute', overflow: 'hidden' },
  fill: { flex: 1 },
  label: { position: 'absolute', textAlign: 'center', fontFamily: fonts.display },
});
