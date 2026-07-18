import React from 'react';
import { Image, View } from 'react-native';
import { BATTLE_UI } from '../config';

export const BotImage = React.memo(function BotImage({
  size = 64,
  grounded = false,
}: {
  size?: number;
  cookieImageKey?: string;
  grounded?: boolean;
}) {
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
        source={require('../../assets/images/cookie-bot.png')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
});
