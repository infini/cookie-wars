import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

const cookieImages: Record<string, ImageSourcePropType> = {
  classic: require('../../assets/images/cookies/classic.png'),
  fortune: require('../../assets/images/cookies/fortune.png'),
  donut: require('../../assets/images/cookies/donut.png'),
  waffle: require('../../assets/images/cookies/waffle.png'),
  cupcake: require('../../assets/images/cookies/cupcake.png'),
  'strawberry-cake': require('../../assets/images/cookies/strawberry-cake.png'),
  mooncake: require('../../assets/images/cookies/mooncake.png'),
  'party-cake': require('../../assets/images/cookies/party-cake.png'),
  'rice-cracker': require('../../assets/images/cookies/rice-cracker.png'),
  chocolate: require('../../assets/images/cookies/chocolate.png'),
  candy: require('../../assets/images/cookies/candy.png'),
  lollipop: require('../../assets/images/cookies/lollipop.png'),
  custard: require('../../assets/images/cookies/custard.png'),
  shortcake: require('../../assets/images/cookies/shortcake.png'),
  dango: require('../../assets/images/cookies/dango.png'),
  'shaved-ice': require('../../assets/images/cookies/shaved-ice.png'),
  honey: require('../../assets/images/cookies/honey.png'),
  pie: require('../../assets/images/cookies/pie.png'),
  gem: require('../../assets/images/cookies/gem.png'),
  crown: require('../../assets/images/cookies/crown.png'),
  'aurora-gem': require('../../assets/images/cookies/aurora-gem.png'),
  'deepsea-pearl': require('../../assets/images/cookies/deepsea-pearl.png'),
  'solar-flare': require('../../assets/images/cookies/solar-flare.png'),
  'lunar-empress': require('../../assets/images/cookies/lunar-empress.png'),
  clockwork: require('../../assets/images/cookies/clockwork.png'),
  'dimension-rift': require('../../assets/images/cookies/dimension-rift.png'),
  'dragon-scale': require('../../assets/images/cookies/dragon-scale.png'),
  nebula: require('../../assets/images/cookies/nebula.png'),
  'genesis-crystal': require('../../assets/images/cookies/genesis-crystal.png'),
  'infinite-cosmos': require('../../assets/images/cookies/infinite-cosmos.png'),
};

export function hasCookieImage(imageKey: string): boolean {
  return cookieImages[imageKey] !== undefined;
}

export const CookieImage = React.memo(function CookieImage({
  size,
  imageKey = 'classic',
  style,
}: {
  size: number;
  imageKey?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={cookieImages[imageKey] ?? cookieImages.classic}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
});
