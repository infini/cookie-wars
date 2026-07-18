import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

const monsterImages: Record<string, ImageSourcePropType> = {
  'crumb-minion': require('../../assets/images/enemies/crumb-minion.png'),
  'sugar-guard': require('../../assets/images/enemies/sugar-guard.png'),
  'chocolate-brute': require('../../assets/images/enemies/chocolate-brute.png'),
  'wafer-sorcerer': require('../../assets/images/enemies/wafer-sorcerer.png'),
  'cookie-tyrant': require('../../assets/images/enemies/cookie-tyrant.png'),
};

interface MonsterSpriteProps {
  imageKey: string;
  size?: number;
}

export function MonsterSprite({ imageKey, size = 84 }: MonsterSpriteProps) {
  return (
    <Image
      source={monsterImages[imageKey] ?? monsterImages['crumb-minion']}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
