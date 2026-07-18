import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COOKIE_CRITICAL } from '../config';

export const CookieCriticalEffect = React.memo(function CookieCriticalEffect() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: COOKIE_CRITICAL.effectDurationMs,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const size = COOKIE_CRITICAL.effectSizePixels;
  const fade = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const particles = Array.from(
    { length: COOKIE_CRITICAL.particleCount },
    (_, index) => index,
  );
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
        },
      ]}
    >
      <Animated.View
        style={[
          styles.flash,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: COOKIE_CRITICAL.flashColor,
            opacity: Animated.multiply(fade, COOKIE_CRITICAL.flashMaximumOpacity),
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [COOKIE_CRITICAL.coreStartScale, COOKIE_CRITICAL.coreEndScale],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: COOKIE_CRITICAL.ringBorderWidth,
            borderColor: COOKIE_CRITICAL.ringColor,
            opacity: fade,
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [COOKIE_CRITICAL.ringStartScale, COOKIE_CRITICAL.ringEndScale],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size * COOKIE_CRITICAL.coreSizeRatio,
            height: size * COOKIE_CRITICAL.coreSizeRatio,
            left: size * (1 - COOKIE_CRITICAL.coreSizeRatio) / 2,
            top: size * (1 - COOKIE_CRITICAL.coreSizeRatio) / 2,
            borderRadius: size,
            backgroundColor: COOKIE_CRITICAL.coreColor,
            borderColor: COOKIE_CRITICAL.coreHighlightColor,
            opacity: fade,
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [COOKIE_CRITICAL.coreStartScale, COOKIE_CRITICAL.coreEndScale],
              }),
            }],
          },
        ]}
      />
      {particles.map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: size / 2 - COOKIE_CRITICAL.particleWidthPixels / 2,
              top: size / 2 - COOKIE_CRITICAL.particleHeightPixels / 2,
              width: COOKIE_CRITICAL.particleWidthPixels,
              height: COOKIE_CRITICAL.particleHeightPixels,
              borderRadius: COOKIE_CRITICAL.particleWidthPixels,
              backgroundColor: index % 2 === 0
                ? COOKIE_CRITICAL.particleColor
                : COOKIE_CRITICAL.particleHighlightColor,
              opacity: fade,
              transform: [
                { rotate: `${index / COOKIE_CRITICAL.particleCount * 360}deg` },
                { translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    -COOKIE_CRITICAL.particleStartDistancePixels,
                    -COOKIE_CRITICAL.particleEndDistancePixels,
                  ],
                }) },
                { scaleY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, COOKIE_CRITICAL.coreStartScale],
                }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  effect: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    zIndex: 7,
  },
  flash: { position: 'absolute' },
  ring: { position: 'absolute', backgroundColor: 'transparent' },
  core: { position: 'absolute', borderWidth: COOKIE_CRITICAL.coreBorderWidth },
  particle: { position: 'absolute' },
});
