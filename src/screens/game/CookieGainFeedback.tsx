import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COOKIE_FEEDBACK } from '../../config';
import { colors } from '../../theme/colors';
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
    position: 'absolute', zIndex: 8, top: 98, fontFamily: fonts.display, fontSize: 34,
    color: colors.greenDark, textShadowColor: colors.white, textShadowRadius: 5,
  },
  criticalFloatingText: {
    width: 280, textAlign: 'center', fontSize: 29, color: '#F0182F',
    textShadowColor: '#FFD35A', textShadowRadius: 8,
  },
  superCriticalFloatingText: {
    width: 310, textAlign: 'center', fontSize: 25, color: '#FFFFFF',
    textShadowColor: '#9C2BFF', textShadowRadius: 12,
  },
});
