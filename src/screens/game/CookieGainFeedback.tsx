import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COOKIE_FEEDBACK } from '../../config';
import { fonts } from '../../theme/typography';
import type { CookieClickKind, CookieFeedbackTier } from '../../types/game';
import { formatNumber } from '../../utils/format';

export interface CookieGainItem {
  id: number;
  amount: number;
  kind: CookieClickKind;
  feedbackTier: CookieFeedbackTier;
}

interface FloatingGainProps extends CookieGainItem {
  onDone: (id: number) => void;
}

function FloatingGain({ id, amount, kind, onDone }: FloatingGainProps) {
  const progress = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: COOKIE_FEEDBACK.floatingGain.durationMs,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onDone(id);
    });
    return () => animation.stop();
  }, [id, onDone, progress]);
  return (
    <Animated.Text
      style={[
        styles.floatingText,
        kind === 'critical' && styles.criticalFloatingText,
        kind === 'superCritical' && styles.superCriticalFloatingText,
        {
          opacity: progress.interpolate({
            inputRange: [0, COOKIE_FEEDBACK.floatingGain.holdUntilProgress, 1],
            outputRange: [1, 1, 0],
          }),
          transform: [
            { translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -COOKIE_FEEDBACK.floatingGain.risePixels],
            }) },
            { scale: progress.interpolate({
              inputRange: [0, COOKIE_FEEDBACK.floatingGain.peakAtProgress, 1],
              outputRange: [
                COOKIE_FEEDBACK.floatingGain.startScale,
                COOKIE_FEEDBACK.floatingGain.peakScale,
                COOKIE_FEEDBACK.floatingGain.endScale,
              ],
            }) },
          ],
        },
      ]}
    >
      {kind === 'superCritical'
        ? `슈퍼 크리티컬! +${formatNumber(amount)}`
        : kind === 'critical'
          ? `크리티컬! +${formatNumber(amount)}`
          : `+${formatNumber(amount)}`}
    </Animated.Text>
  );
}

export function CookieGainFeedback({
  gains,
  onDone,
}: {
  gains: CookieGainItem[];
  onDone: (id: number) => void;
}) {
  const remove = useCallback((id: number) => onDone(id), [onDone]);
  return gains.map((gain) => <FloatingGain key={gain.id} {...gain} onDone={remove} />);
}

const styles = StyleSheet.create({
  floatingText: {
    position: 'absolute', zIndex: 8, top: 98, fontFamily: fonts.regular,
    fontSize: COOKIE_FEEDBACK.floatingGain.normalFontSize,
    color: COOKIE_FEEDBACK.floatingGain.normalColor,
    textShadowColor: COOKIE_FEEDBACK.floatingGain.normalShadowColor,
    textShadowRadius: COOKIE_FEEDBACK.floatingGain.normalShadowRadius,
  },
  criticalFloatingText: {
    width: 280,
    textAlign: 'center',
    fontSize: COOKIE_FEEDBACK.floatingGain.criticalFontSize,
    color: COOKIE_FEEDBACK.floatingGain.criticalColor,
    textShadowColor: COOKIE_FEEDBACK.floatingGain.criticalShadowColor,
    textShadowRadius: COOKIE_FEEDBACK.floatingGain.criticalShadowRadius,
  },
  superCriticalFloatingText: {
    width: 310,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: COOKIE_FEEDBACK.floatingGain.superCriticalFontSize,
    color: COOKIE_FEEDBACK.floatingGain.superCriticalColor,
    textShadowColor: COOKIE_FEEDBACK.floatingGain.superCriticalShadowColor,
    textShadowRadius: COOKIE_FEEDBACK.floatingGain.superCriticalShadowRadius,
  },
});
