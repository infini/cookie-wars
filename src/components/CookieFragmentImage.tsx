import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import type { CookieFragmentKind } from '../types/game';

const FRAGMENT_IMAGES: Record<CookieFragmentKind, ImageSourcePropType> = {
  magma: require('../../assets/images/cookie-fragments/magma-cookie-fragment.webp'),
  electric: require('../../assets/images/cookie-fragments/electric-cookie-fragment.webp'),
};

export function hasCookieFragmentImage(kind: string): kind is CookieFragmentKind {
  return kind in FRAGMENT_IMAGES;
}

export const CookieFragmentImage = React.memo(function CookieFragmentImage({
  kind,
  size,
}: {
  kind: CookieFragmentKind;
  size: number;
}) {
  return (
    <Image
      source={FRAGMENT_IMAGES[kind]}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
});
