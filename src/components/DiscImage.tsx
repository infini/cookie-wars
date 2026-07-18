import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export function DiscImage({ size = 60, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/images/flying-disc.png')}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
