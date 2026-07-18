import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CookieImage } from './CookieImage';

export function CookieCastle({
  size = 104,
  cookieImageKey = 'classic',
}: {
  size?: number;
  cookieImageKey?: string;
}) {
  return (
    <View style={{ width: size, height: size }}>
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
