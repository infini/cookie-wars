import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { BATTLE_UI } from '../config';

const monsterImages: Record<string, ImageSourcePropType> = {
  'crumb-minion': require('../../assets/images/enemies/crumb-minion.png'),
  'sugar-guard': require('../../assets/images/enemies/sugar-guard.png'),
  'chocolate-brute': require('../../assets/images/enemies/chocolate-brute.png'),
  'wafer-sorcerer': require('../../assets/images/enemies/wafer-sorcerer.png'),
  'cookie-tyrant': require('../../assets/images/enemies/cookie-tyrant-hammer.png'),
};

interface MonsterSpriteProps {
  imageKey: string;
  size?: number;
  grounded?: boolean;
}

export const MonsterSprite = React.memo(function MonsterSprite({
  imageKey,
  size = 84,
  grounded = false,
}: MonsterSpriteProps) {
  return (
    <View style={{ width: size, height: size }}>
      {grounded ? (
        <View style={{
          position: 'absolute',
          left: size * (1 - BATTLE_UI.groundShadowWidthRatio) / 2,
          bottom: size * BATTLE_UI.groundShadowBottomRatio,
          width: size * BATTLE_UI.groundShadowWidthRatio,
          height: size * BATTLE_UI.groundShadowHeightRatio,
          borderRadius: size,
          backgroundColor: BATTLE_UI.groundShadowColor,
        }} />
      ) : null}
      <Image
        source={monsterImages[imageKey] ?? monsterImages['crumb-minion']}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
});
