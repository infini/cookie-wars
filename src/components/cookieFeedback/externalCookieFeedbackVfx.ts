import type { ImageSourcePropType } from 'react-native';
import type { CookieFragmentKind } from '../../types/game';

interface CookieFeedbackVfxSources {
  full: ImageSourcePropType;
  compact?: ImageSourcePropType;
}

const VFX_SOURCES: Record<CookieFragmentKind, CookieFeedbackVfxSources> = {
  magma: {
    full: require('../../../assets/images/vfx/cookie-feedback/magma.webp'),
  },
  electric: {
    full: require('../../../assets/images/vfx/cookie-feedback/electric.webp'),
  },
};

export function getCookieFeedbackVfxSource(
  kind: CookieFragmentKind,
  compact: boolean,
): ImageSourcePropType {
  const sources = VFX_SOURCES[kind];
  return compact ? sources.compact ?? sources.full : sources.full;
}

export function hasCookieFeedbackVfxSource(kind: CookieFragmentKind): boolean {
  return VFX_SOURCES[kind]?.full !== undefined;
}
