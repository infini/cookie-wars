import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export function CookieImage({ size, style }: { size: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/images/cookie.png')}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
