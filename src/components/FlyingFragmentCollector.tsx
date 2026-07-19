import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { CLICKER_ROBOTS, COOKIE_FRAGMENTS } from '../config';
import type { CookieFragmentKind } from '../types/game';

const robotImage = require('../../assets/images/cookie-bot.png');
const COLLECTOR = CLICKER_ROBOTS.flyingFragmentCollector;
const SPAWN = COOKIE_FRAGMENTS.spawnEffect;

interface FragmentMission {
  id: number;
  kind: CookieFragmentKind;
  side: -1 | 1;
}

export function FlyingFragmentCollector({
  mission,
  onCollect,
}: {
  mission?: FragmentMission;
  onCollect: (id: number, kind: CookieFragmentKind) => void;
}) {
  const translateX = useRef(new Animated.Value(COLLECTOR.homeOffsetXPixels)).current;
  const translateY = useRef(new Animated.Value(COLLECTOR.homeOffsetYPixels)).current;
  const hover = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hoverAnimation = Animated.loop(Animated.sequence([
      Animated.timing(hover, {
        toValue: 1,
        duration: COLLECTOR.hoverDurationMs,
        useNativeDriver: true,
      }),
      Animated.timing(hover, {
        toValue: 0,
        duration: COLLECTOR.hoverDurationMs,
        useNativeDriver: true,
      }),
    ]));
    hoverAnimation.start();
    return () => hoverAnimation.stop();
  }, [hover]);

  useEffect(() => {
    translateX.stopAnimation();
    translateY.stopAnimation();
    if (!mission) {
      const returnAnimation = Animated.parallel([
        Animated.timing(translateX, {
          toValue: COLLECTOR.homeOffsetXPixels,
          duration: COLLECTOR.returnDurationMs,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: COLLECTOR.homeOffsetYPixels,
          duration: COLLECTOR.returnDurationMs,
          useNativeDriver: true,
        }),
      ]);
      returnAnimation.start();
      return () => returnAnimation.stop();
    }
    const flight = Animated.sequence([
      Animated.delay(COLLECTOR.dispatchDelayMs),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: mission.side * SPAWN.targetOffsetXPixels,
          duration: COLLECTOR.travelDurationMs,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SPAWN.targetOffsetYPixels,
          duration: COLLECTOR.travelDurationMs,
          useNativeDriver: true,
        }),
      ]),
    ]);
    flight.start(({ finished }) => {
      if (finished) onCollect(mission.id, mission.kind);
    });
    return () => flight.stop();
  }, [mission, onCollect, translateX, translateY]);

  if (COLLECTOR.freeCount <= 0) return null;
  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.collector,
          {
            top: `${SPAWN.anchorTopRatio * 100}%`,
            width: COLLECTOR.robotSizePixels,
            height: COLLECTOR.robotSizePixels,
            marginLeft: -COLLECTOR.robotSizePixels / 2,
            marginTop: -COLLECTOR.robotSizePixels / 2,
            transform: [
              { translateX },
              { translateY: Animated.add(
                translateY,
                hover.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-COLLECTOR.hoverDistancePixels, COLLECTOR.hoverDistancePixels],
                }),
              ) },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="fan"
          size={COLLECTOR.propellerSizePixels}
          color="#4DDCFF"
          style={styles.propeller}
        />
        <Image
          source={robotImage}
          resizeMode="contain"
          style={{ width: COLLECTOR.robotSizePixels, height: COLLECTOR.robotSizePixels }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 31 },
  collector: { position: 'absolute', left: '50%' },
  propeller: {
    position: 'absolute',
    left: '50%',
    top: -8,
    marginLeft: -15,
    zIndex: -1,
    textShadowColor: '#FFFFFF',
    textShadowRadius: 4,
  },
});
