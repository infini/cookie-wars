import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const discImages = {
  friendly: require('../../assets/images/flying-disc.png'),
  enemy: require('../../assets/images/enemy-disc.png'),
};

export function DiscImage({
  size = 60,
  style,
  team = 'friendly',
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
  team?: keyof typeof discImages;
}) {
  return (
    <Image
      source={discImages[team]}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
