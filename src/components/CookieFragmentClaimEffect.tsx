import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import {
  COOKIE_SPECIAL_EFFECTS,
  getCookieFragment,
  getCookieSpecialEffect,
} from '../config';
import { fonts } from '../theme/typography';
import type { CookieFragmentKind } from '../types/game';
import { formatNumber } from '../utils/format';
import {
  CookieAnimatedSpecialEffect,
  resolveCookieSpecialEffectLayout,
} from './cookieFeedback/CookieAnimatedSpecialEffect';

const REWARD = COOKIE_SPECIAL_EFFECTS.fragmentReward;

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
    const fragment = getCookieFragment(kind);
    const effect = getCookieSpecialEffect(kind);
    const layout = resolveCookieSpecialEffectLayout(effect, viewport.width, viewport.height);
    const fadeStartProgress = kind === 'magma'
      ? REWARD.magmaFadeStartProgress
      : REWARD.electricFadeStartProgress;
    const shakeDistance = kind === 'magma'
      ? REWARD.magmaShakeDistancePixels
      : REWARD.electricShakeDistancePixels;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: effect.durationMs,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [effect.durationMs, progress]);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          {
            zIndex: effect.zIndex,
            transform: [{
              translateX: progress.interpolate({
                inputRange: [0, REWARD.peakProgress, fadeStartProgress, 1],
                outputRange: [0, -shakeDistance, shakeDistance, 0],
              }),
            }],
          },
        ]}
      >
        <CookieAnimatedSpecialEffect kind={kind} />
        <Animated.Text
          style={[
            styles.reward,
            {
              left: '50%',
              top: '50%',
              width: layout.size,
              marginLeft: -layout.size / 2 + layout.offsetX,
              marginTop: layout.size * (REWARD.topRatio - 0.5) + layout.offsetY,
              zIndex: effect.zIndex + 1,
              color: fragment.labelColor,
              fontSize: REWARD.fontSize,
              textShadowColor: REWARD.shadowColor,
              textShadowRadius: REWARD.shadowRadius,
              opacity: progress.interpolate({
                inputRange: [0, REWARD.peakProgress, fadeStartProgress, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [{
                scale: progress.interpolate({
                  inputRange: [0, REWARD.peakProgress, 1],
                  outputRange: [REWARD.startScale, REWARD.peakScale, REWARD.endScale],
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
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  reward: { position: 'absolute', textAlign: 'center', fontFamily: fonts.extraBold },
});
