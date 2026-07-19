import type { ImageSourcePropType } from 'react-native';

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
  index: number,
): boolean {
  return ELECTRIC_BOLT_IMAGES[index] !== undefined;
}
