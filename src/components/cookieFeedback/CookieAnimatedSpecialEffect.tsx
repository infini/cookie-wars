import React from 'react';
import { Image, StyleSheet, useWindowDimensions } from 'react-native';
import { getCookieSpecialEffect } from '../../config';
import type { CookieFragmentKind, CookieSpecialEffectConfig } from '../../types/game';
import { getCookieFeedbackVfxSource } from './externalCookieFeedbackVfx';

export interface CookieSpecialEffectLayout {
  size: number;
  offsetX: number;
  offsetY: number;
}

export function resolveCookieSpecialEffectLayout(
  effect: CookieSpecialEffectConfig,
  viewportWidth: number,
  viewportHeight: number,
): CookieSpecialEffectLayout {
  return {
    size: Math.max(
      effect.minimumSizePixels,
      viewportWidth * effect.screenWidthRatio,
      viewportHeight * effect.screenHeightRatio,
    ),
    offsetX: viewportWidth * effect.offsetXScreenRatio,
    offsetY: viewportHeight * effect.offsetYScreenRatio,
  };
}

export const CookieAnimatedSpecialEffect = React.memo(
  function CookieAnimatedSpecialEffect({
    kind,
    compact = false,
  }: {
    kind: CookieFragmentKind;
    compact?: boolean;
  }) {
    const viewport = useWindowDimensions();
    const effect = getCookieSpecialEffect(kind);
    const layout = resolveCookieSpecialEffectLayout(effect, viewport.width, viewport.height);
    return (
      <Image
        source={getCookieFeedbackVfxSource(kind, compact)}
        resizeMode="contain"
        fadeDuration={0}
        style={[
          styles.effect,
          {
            width: layout.size,
            height: layout.size,
            marginLeft: -layout.size / 2,
            marginTop: -layout.size / 2,
            zIndex: effect.zIndex,
            transform: [
              { translateX: layout.offsetX },
              { translateY: layout.offsetY },
            ],
          },
        ]}
      />
    );
  },
);

const styles = StyleSheet.create({
  effect: { position: 'absolute', left: '50%', top: '50%' },
});
