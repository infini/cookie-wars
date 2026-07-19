import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { CookieCriticalEffect } from '../../components/CookieCriticalEffect';
import { CookieSuperCriticalEffect } from '../../components/CookieSuperCriticalEffect';
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

function recentIds(
  gains: CookieGainItem[],
  tier: CookieFeedbackTier,
  limit: number,
): Set<number> {
  return new Set(gains
    .filter((gain) => gain.feedbackTier === tier)
    .slice(-limit)
    .map((gain) => gain.id));
}

export function CookieGainFeedback({
  gains,
  onDone,
}: {
  gains: CookieGainItem[];
  onDone: (id: number) => void;
}) {
  const fullCriticalIds = recentIds(
    gains,
    'criticalFull',
    COOKIE_FEEDBACK.criticalEffect.maximumConcurrentFullEffects,
  );
  const compactCriticalIds = recentIds(
    gains,
    'criticalCompact',
    COOKIE_FEEDBACK.criticalEffect.maximumConcurrentCompactEffects,
  );
  const fullSuperIds = recentIds(
    gains,
    'superCriticalFull',
    COOKIE_FEEDBACK.superCriticalEffect.maximumConcurrentFullEffects,
  );
  const compactSuperIds = recentIds(
    gains,
    'superCriticalCompact',
    COOKIE_FEEDBACK.superCriticalEffect.maximumConcurrentCompactEffects,
  );
  const remove = useCallback((id: number) => onDone(id), [onDone]);
  return gains.map((gain) => (
    <React.Fragment key={gain.id}>
      {fullCriticalIds.has(gain.id) ? <CookieCriticalEffect mode="criticalFull" /> : null}
      {compactCriticalIds.has(gain.id) ? <CookieCriticalEffect mode="criticalCompact" /> : null}
      {fullSuperIds.has(gain.id) ? <CookieSuperCriticalEffect mode="superCriticalFull" /> : null}
      {compactSuperIds.has(gain.id) ? <CookieSuperCriticalEffect mode="superCriticalCompact" /> : null}
      <FloatingGain {...gain} onDone={remove} />
    </React.Fragment>
  ));
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
