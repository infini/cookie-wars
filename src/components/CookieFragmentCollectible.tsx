import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { COOKIE_FRAGMENTS, getCookieFragment } from '../config';
import type { CookieFragmentKind } from '../types/game';
import { CookieFragmentImage } from './CookieFragmentImage';

const FX = COOKIE_FRAGMENTS.spawnEffect;

interface CookieFragmentCollectibleProps {
  id: number;
  kind: CookieFragmentKind;
  side: -1 | 1;
  rewardMultiplier: number;
  onClaim: (id: number, kind: CookieFragmentKind) => void;
  onExpire: (id: number) => void;
}

export function CookieFragmentCollectible({
  id,
  kind,
  side,
  rewardMultiplier,
  onClaim,
  onExpire,
}: CookieFragmentCollectibleProps) {
  const launch = useRef(new Animated.Value(0)).current;
  const lifetime = useRef(new Animated.Value(0)).current;
  const crumbs = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const claimed = useRef(false);
  const config = getCookieFragment(kind);

  useEffect(() => {
    const launchAnimation = Animated.timing(launch, {
      toValue: 1,
      duration: FX.launchDurationMs,
      useNativeDriver: true,
    });
    const lifetimeAnimation = Animated.sequence([
      Animated.delay(FX.launchDurationMs),
      Animated.timing(lifetime, {
        toValue: 1,
        duration: COOKIE_FRAGMENTS.lifetimeMs,
        useNativeDriver: true,
      }),
    ]);
    const crumbAnimation = Animated.timing(crumbs, {
      toValue: 1,
      duration: FX.crumbDurationMs,
      useNativeDriver: true,
    });
    const pulseAnimation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: FX.idlePulseDurationMs,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: FX.idlePulseDurationMs,
        useNativeDriver: true,
      }),
    ]));
    launchAnimation.start();
    crumbAnimation.start();
    pulseAnimation.start();
    lifetimeAnimation.start(({ finished }) => {
      if (finished && !claimed.current) onExpire(id);
    });
    return () => {
      launchAnimation.stop();
      crumbAnimation.stop();
      lifetimeAnimation.stop();
      pulseAnimation.stop();
    };
  }, [crumbs, id, launch, lifetime, onExpire, pulse]);

  const handlePress = () => {
    if (claimed.current) return;
    claimed.current = true;
    onClaim(id, kind);
  };
  const size = FX.spriteSizePixels;
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Animated.View
        style={[
          styles.collectible,
          {
            top: `${FX.anchorTopRatio * 100}%`,
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            transform: [
              { translateX: launch.interpolate({
                inputRange: [0, 1],
                outputRange: [0, side * FX.targetOffsetXPixels],
              }) },
              { translateY: launch.interpolate({
                inputRange: [0, FX.peakProgress, 1],
                outputRange: [0, -FX.launchRisePixels, FX.targetOffsetYPixels],
              }) },
              { rotate: launch.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  `${side * FX.startRotationDegrees}deg`,
                  `${side * FX.endRotationDegrees}deg`,
                ],
              }) },
              { scale: Animated.multiply(
                launch.interpolate({
                  inputRange: [0, FX.peakProgress, 1],
                  outputRange: [FX.startScale, FX.peakScale, FX.settledScale],
                }),
                pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, FX.idlePulseScale],
                }),
              ) },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.aura,
            {
              width: size * FX.auraSizeRatio,
              height: size * FX.auraSizeRatio,
              left: size * (1 - FX.auraSizeRatio) / 2,
              top: size * (1 - FX.auraSizeRatio) / 2,
              backgroundColor: config.glowColor,
              borderRadius: size * FX.auraSizeRatio * FX.auraCornerRadiusRatio,
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [FX.auraMaximumOpacity * 0.45, FX.auraMaximumOpacity],
              }),
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${config.name}, ${COOKIE_FRAGMENTS.lifetimeMs / 1000}초 안에 눌러서 쿠키 ${rewardMultiplier}배 받기`}
          hitSlop={FX.hitSlopPixels}
          onPress={handlePress}
          style={styles.pressable}
        >
          <CookieFragmentImage kind={kind} size={size} />
        </Pressable>
        <View
          pointerEvents="none"
          style={[
            styles.timerTrack,
            {
              width: FX.timerWidthPixels,
              height: FX.timerHeightPixels,
              left: (size - FX.timerWidthPixels) / 2,
              bottom: FX.timerBottomOffsetPixels,
              backgroundColor: FX.timerTrackColor,
              borderRadius: FX.timerHeightPixels / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.timerFill,
              {
                backgroundColor: FX.warningTimerColor,
                transform: [{ scaleX: lifetime.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.timerFill,
              {
                backgroundColor: FX.normalTimerColor,
                opacity: lifetime.interpolate({
                  inputRange: [0, 1 - FX.timerWarningRatio, 1],
                  outputRange: [1, 1, 0],
                }),
                transform: [{ scaleX: lifetime.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }) }],
              },
            ]}
          />
        </View>
      </Animated.View>
      {Array.from({ length: FX.crumbCount }, (_, index) => {
        const ratio = FX.crumbCount === 1 ? 0 : index / (FX.crumbCount - 1);
        const crumbSize = FX.crumbMinimumSizePixels
          + (FX.crumbMaximumSizePixels - FX.crumbMinimumSizePixels) * ratio;
        const angle = index / FX.crumbCount * Math.PI * 2;
        const travel = FX.crumbStartDistancePixels
          + (FX.crumbEndDistancePixels - FX.crumbStartDistancePixels) * ratio;
        return (
          <Animated.View
            key={`crumb-${id}-${index}`}
            style={[
              styles.crumb,
              {
                top: `${FX.anchorTopRatio * 100}%`,
                width: crumbSize,
                height: crumbSize,
                marginLeft: -crumbSize / 2,
                marginTop: -crumbSize / 2,
                backgroundColor: index % 2 === 0 ? config.accentColor : config.labelColor,
                opacity: crumbs.interpolate({
                  inputRange: [0, FX.peakProgress, 1],
                  outputRange: [1, 0.85, 0],
                }),
                transform: [
                  { translateX: crumbs.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      side * FX.crumbStartDistancePixels,
                      side * travel
                        + Math.cos(angle) * travel * FX.crumbHorizontalSpreadRatio,
                    ],
                  }) },
                  { translateY: crumbs.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      0,
                      Math.sin(angle) * travel * FX.crumbVerticalSpreadRatio
                        + FX.crumbFallPixels,
                    ],
                  }) },
                  { rotate: crumbs.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${FX.crumbRotationTurns * 360}deg`],
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
  layer: { ...StyleSheet.absoluteFill, zIndex: 30 },
  collectible: { position: 'absolute', left: '50%', zIndex: 2 },
  aura: { position: 'absolute', transform: [{ rotate: '45deg' }] },
  pressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  crumb: { position: 'absolute', left: '50%', borderRadius: 2 },
  timerTrack: { position: 'absolute', overflow: 'hidden' },
  timerFill: { ...StyleSheet.absoluteFill },
});
