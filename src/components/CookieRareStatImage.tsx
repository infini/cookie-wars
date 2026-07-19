import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

export type CookieRareStatKind = 'critical' | 'superCritical';

const COOKIE_RARE_STAT_IMAGES: Record<CookieRareStatKind, ImageSourcePropType> = {
  critical: require('../../assets/images/ui/critical-stat-icon.webp'),
  superCritical: require('../../assets/images/ui/super-critical-stat-icon.webp'),
};

export function hasCookieRareStatImage(kind: string): kind is CookieRareStatKind {
  return kind in COOKIE_RARE_STAT_IMAGES;
}

export const CookieRareStatImage = React.memo(function CookieRareStatImage({
  kind,
  size,
}: {
  kind: CookieRareStatKind;
  size: number;
}) {
  return (
    <Image
      source={COOKIE_RARE_STAT_IMAGES[kind]}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
});
