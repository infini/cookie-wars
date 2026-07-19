import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { CLICKER_ROBOTS } from '../config';

const robotImage = require('../../assets/images/cookie-bot.png');
const hammerImage = require('../../assets/images/clicker-robots/clicker-hammer.webp');
const FORMATION = CLICKER_ROBOTS.formation;

interface RobotSlot {
  faceScaleX: -1 | 1;
  left: number;
  top: number;
}

function makeRobotSlots(count: number): RobotSlot[] {
  const center = FORMATION.stageSizePixels / 2;
  const quadrantAngleDegrees = 360 / CLICKER_ROBOTS.quadrantCount;
  return Array.from({ length: count }, (_, index) => {
    const quadrant = index % CLICKER_ROBOTS.quadrantCount;
    const slotInQuadrant = Math.floor(index / CLICKER_ROBOTS.quadrantCount);
    const angleDegrees = quadrant * quadrantAngleDegrees
      + (slotInQuadrant + 0.5) * quadrantAngleDegrees
        / CLICKER_ROBOTS.robotsPerQuadrant;
    const radians = angleDegrees * Math.PI / 180;
    return {
      faceScaleX: Math.cos(radians) >= 0 ? -1 : 1,
      left: center + Math.cos(radians) * FORMATION.orbitRadiusPixels
        - FORMATION.robotSizePixels / 2,
      top: center + Math.sin(radians) * FORMATION.orbitRadiusPixels
        - FORMATION.robotSizePixels / 2,
    };
  });
}

export const ClickerRobotFormation = React.memo(function ClickerRobotFormation({
  robotCount,
  clicksPerSecondPerRobot,
}: {
  robotCount: number;
  clicksPerSecondPerRobot: number;
}) {
  const strike = useRef(new Animated.Value(0)).current;
  const slots = useMemo(
    () => makeRobotSlots(Math.min(robotCount, CLICKER_ROBOTS.maximumRobotCount)),
    [robotCount],
  );

  useEffect(() => {
    if (slots.length === 0 || clicksPerSecondPerRobot <= 0) return undefined;
    const cycleMs = Math.max(
      FORMATION.minimumVisualCycleMs,
      Math.floor(1000 / clicksPerSecondPerRobot),
    );
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(strike, {
        toValue: 1,
        duration: Math.floor(cycleMs * FORMATION.strikeProgress),
        useNativeDriver: true,
      }),
      Animated.timing(strike, {
        toValue: 0,
        duration: Math.ceil(cycleMs * (1 - FORMATION.strikeProgress)),
        useNativeDriver: true,
      }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [clicksPerSecondPerRobot, slots.length, strike]);

  if (slots.length === 0) return null;
  const hammerRotation = strike.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `${FORMATION.hammerRaisedDegrees}deg`,
      `${FORMATION.hammerStrikeDegrees}deg`,
    ],
  });
  const bodyRecoil = strike.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FORMATION.bodyRecoilPixels],
  });

  return (
    <View pointerEvents="none" style={styles.layer}>
      {slots.map((slot, index) => (
        <View
          key={`clicker-${index}`}
          style={[
            styles.robotSlot,
            {
              left: slot.left,
              top: slot.top,
              width: FORMATION.robotSizePixels,
              height: FORMATION.robotSizePixels,
              transform: [{ scaleX: slot.faceScaleX }],
            },
          ]}
        >
          <Animated.Image
            source={robotImage}
            resizeMode="contain"
            style={{
              width: FORMATION.robotSizePixels,
              height: FORMATION.robotSizePixels,
              transform: [{ translateY: bodyRecoil }],
            }}
          />
          <Animated.Image
            source={hammerImage}
            resizeMode="contain"
            style={{
              position: 'absolute',
              width: FORMATION.hammerSizePixels,
              height: FORMATION.hammerSizePixels,
              left: FORMATION.hammerOffsetXPixels,
              top: FORMATION.hammerOffsetYPixels,
              transform: [{ rotate: hammerRotation }],
            }}
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 8 },
  robotSlot: { position: 'absolute' },
});
