import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_FRAGMENTS } from '../../config';
import { AngularShardBurst } from '../cookieFeedback/AngularBurstParticles';

const FX = COOKIE_FRAGMENTS.claimEffect;

interface ElectricFragmentClaimVisualProps {
  progress: Animated.Value;
  size: number;
}

export const ElectricFragmentClaimVisual = React.memo(
  function ElectricFragmentClaimVisual({ progress, size }: ElectricFragmentClaimVisualProps) {
    return (
      <>
        {Array.from({ length: FX.electricBoltCount }, (_, boltIndex) => {
          const boltRatio = FX.electricBoltCount === 1
            ? 0.5
            : boltIndex / (FX.electricBoltCount - 1);
          const boltX = size * (
            FX.electricHorizontalInsetRatio
            + boltRatio * (1 - FX.electricHorizontalInsetRatio * 2)
          );
          const boltStart = FX.electricRevealProgress
            + boltIndex * FX.electricBoltStaggerProgress;
          return (
            <React.Fragment key={`electric-bolt-${boltIndex}`}>
              <Animated.View
                style={[
                  styles.lightningColumn,
                  {
                    left: boltX - FX.electricSegmentWidthPixels * 2,
                    top: size * FX.electricTopRatio,
                    width: FX.electricSegmentWidthPixels * FX.electricColumnWidthMultiplier,
                    height: size * FX.electricColumnHeightRatio,
                    backgroundColor: FX.electricColors[2],
                    opacity: progress.interpolate({
                      inputRange: [
                        0,
                        boltStart,
                        boltStart + FX.electricColumnRevealProgress,
                        FX.fadeStartProgress,
                        1,
                      ],
                      outputRange: [
                        0,
                        0,
                        FX.electricColumnMaximumOpacity,
                        FX.electricColumnFadeOpacity,
                        0,
                      ],
                    }),
                  },
                ]}
              />
              {Array.from({ length: FX.electricSegmentCount }, (_, segmentIndex) => {
                const segmentStart = boltStart
                  + segmentIndex * FX.electricSegmentStaggerProgress;
                const direction = (boltIndex + segmentIndex) % 2 === 0 ? 1 : -1;
                return (
                  <Animated.View
                    key={`electric-bolt-${boltIndex}-segment-${segmentIndex}`}
                    style={[
                      styles.lightningSegment,
                      {
                        left: boltX
                          + direction * FX.electricZigzagPixels
                          - FX.electricSegmentWidthPixels / 2,
                        top: size * FX.electricTopRatio
                          + segmentIndex * FX.electricSegmentLengthPixels
                            * FX.electricSegmentSpacingRatio,
                        width: FX.electricSegmentWidthPixels,
                        height: FX.electricSegmentLengthPixels,
                        backgroundColor: FX.electricColors[
                          (boltIndex + segmentIndex) % FX.electricColors.length
                        ],
                        opacity: progress.interpolate({
                          inputRange: [
                            0,
                            segmentStart,
                            segmentStart + FX.electricRevealProgress,
                            FX.fadeStartProgress,
                            1,
                          ],
                          outputRange: [0, 0, 1, 1, 0],
                        }),
                        transform: [
                          { rotate: `${direction * FX.electricTurnDegrees}deg` },
                          { scaleY: progress.interpolate({
                            inputRange: [0, segmentStart, FX.fadeStartProgress, 1],
                            outputRange: [
                              FX.electricSegmentStartScale,
                              FX.electricSegmentStartScale,
                              1,
                              FX.electricSegmentEndScale,
                            ],
                          }) },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.lightningCore,
                        {
                          width: `${FX.electricCoreWidthRatio * 100}%`,
                          backgroundColor: FX.electricColors[0],
                        },
                      ]}
                    />
                  </Animated.View>
                );
              })}
            </React.Fragment>
          );
        })}
        <AngularShardBurst
          progress={progress}
          size={size}
          count={FX.electricShardCount}
          startProgress={FX.electricRevealProgress}
          revealProgress={FX.electricShardRevealProgress}
          fadeStartProgress={FX.fadeStartProgress}
          startDistancePixels={FX.electricShardStartDistancePixels}
          endDistancePixels={FX.electricShardEndDistancePixels * size / FX.sizePixels}
          minimumSizePixels={FX.electricShardMinimumSizePixels}
          maximumSizePixels={FX.electricShardMaximumSizePixels}
          rotationTurns={FX.electricShardRotationTurns}
          angleOffsetDegrees={FX.electricShardAngleOffsetDegrees}
          colors={FX.electricColors}
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  lightningColumn: { position: 'absolute', borderRadius: 30 },
  lightningSegment: { position: 'absolute', borderRadius: 8, overflow: 'hidden' },
  lightningCore: {
    alignSelf: 'center', height: '100%', borderRadius: 8,
  },
});
