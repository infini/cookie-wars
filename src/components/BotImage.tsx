import React from 'react';
import { Image } from 'react-native';

export function BotImage({ size = 64 }: { size?: number; cookieImageKey?: string }) {
  return (
    <Image
      source={require('../../assets/images/cookie-bot.png')}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
