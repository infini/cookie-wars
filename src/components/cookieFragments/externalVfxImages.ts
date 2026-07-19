import type { ImageSourcePropType } from 'react-native';

export const MAGMA_ERUPTION_FRAMES: ImageSourcePropType[] = [
  require('../../../assets/images/vfx/magma-eruption-01.webp'),
  require('../../../assets/images/vfx/magma-eruption-02.webp'),
  require('../../../assets/images/vfx/magma-eruption-03.webp'),
  require('../../../assets/images/vfx/magma-eruption-04.webp'),
  require('../../../assets/images/vfx/magma-eruption-05.webp'),
  require('../../../assets/images/vfx/magma-eruption-06.webp'),
  require('../../../assets/images/vfx/magma-eruption-07.webp'),
  require('../../../assets/images/vfx/magma-eruption-08.webp'),
  require('../../../assets/images/vfx/magma-eruption-09.webp'),
  require('../../../assets/images/vfx/magma-eruption-10.webp'),
  require('../../../assets/images/vfx/magma-eruption-11.webp'),
  require('../../../assets/images/vfx/magma-eruption-12.webp'),
  require('../../../assets/images/vfx/magma-eruption-13.webp'),
  require('../../../assets/images/vfx/magma-eruption-14.webp'),
  require('../../../assets/images/vfx/magma-eruption-15.webp'),
  require('../../../assets/images/vfx/magma-eruption-16.webp'),
];

export const ELECTRIC_BOLT_IMAGES: ImageSourcePropType[] = [
  require('../../../assets/images/vfx/lightning-bolt-01.webp'),
  require('../../../assets/images/vfx/lightning-bolt-02.webp'),
  require('../../../assets/images/vfx/lightning-bolt-03.webp'),
  require('../../../assets/images/vfx/lightning-bolt-04.webp'),
  require('../../../assets/images/vfx/lightning-bolt-05.webp'),
  require('../../../assets/images/vfx/lightning-bolt-06.webp'),
  require('../../../assets/images/vfx/lightning-bolt-07.webp'),
  require('../../../assets/images/vfx/lightning-bolt-08.webp'),
  require('../../../assets/images/vfx/lightning-bolt-09.webp'),
  require('../../../assets/images/vfx/lightning-bolt-10.webp'),
  require('../../../assets/images/vfx/lightning-bolt-11.webp'),
];

export function hasCookieFragmentVfxImage(
  kind: 'magma' | 'electric',
  index: number,
): boolean {
  const registry = kind === 'magma' ? MAGMA_ERUPTION_FRAMES : ELECTRIC_BOLT_IMAGES;
  return registry[index] !== undefined;
}
