import React from 'react';
import { Image, View } from 'react-native';
import { CookieImage } from './CookieImage';

export function BotImage({ size = 64, cookieImageKey = 'classic' }: { size?: number; cookieImageKey?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../../assets/images/cookie-bot.png')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <CookieImage
        imageKey={cookieImageKey}
        size={size * 0.38}
        style={{
          position: 'absolute',
          right: size * 0.02,
          bottom: size * 0.16,
          transform: [{ rotate: '-12deg' }],
        }}
      />
    </View>
  );
}
