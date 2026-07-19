import type { ImageSourcePropType } from 'react-native';
import type { CookieSpecialEffectKind } from '../../types/game';

interface CookieFeedbackVfxSources {
  full: ImageSourcePropType;
  compact?: ImageSourcePropType;
}

const VFX_SOURCES: Record<CookieSpecialEffectKind, CookieFeedbackVfxSources> = {
  critical: {
    full: require('../../../assets/images/vfx/cookie-feedback/critical.webp'),
    compact: require('../../../assets/images/vfx/cookie-feedback/critical-compact.webp'),
  },
  magma: {
    full: require('../../../assets/images/vfx/cookie-feedback/magma.webp'),
  },
  superCritical: {
    full: require('../../../assets/images/vfx/cookie-feedback/super-critical.webp'),
    compact: require('../../../assets/images/vfx/cookie-feedback/super-critical-compact.webp'),
  },
  electric: {
    full: require('../../../assets/images/vfx/cookie-feedback/electric.webp'),
  },
};

export function getCookieFeedbackVfxSource(
  kind: CookieSpecialEffectKind,
  compact: boolean,
): ImageSourcePropType {
  const sources = VFX_SOURCES[kind];
  return compact ? sources.compact ?? sources.full : sources.full;
}

export function hasCookieFeedbackVfxSource(kind: CookieSpecialEffectKind): boolean {
  return VFX_SOURCES[kind]?.full !== undefined;
}
