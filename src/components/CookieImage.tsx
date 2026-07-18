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
};

export function CookieImage({
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
}
