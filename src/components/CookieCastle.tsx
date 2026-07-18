import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CookieImage } from './CookieImage';
import { BATTLE_UI } from '../config';

export function CookieCastle({
  size = 104,
  cookieImageKey = 'classic',
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
        source={require('../../assets/images/cookie-castle.png')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <View style={[styles.emblem, { left: size * 0.39, bottom: size * 0.16 }]}>
        <CookieImage imageKey={cookieImageKey} size={size * 0.23} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emblem: {
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
