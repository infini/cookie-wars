import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface MonsterSpriteProps {
  size?: number;
}

export function MonsterSprite({ size = 84 }: MonsterSpriteProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../assets/images/monster-body.png')}
        resizeMode="contain"
        style={styles.body}
      />
      <View style={styles.eyes}>
        <Image source={require('../../assets/images/monster-eye.png')} style={styles.eye} />
        <Image source={require('../../assets/images/monster-eye.png')} style={styles.eye} />
      </View>
      <Image source={require('../../assets/images/monster-mouth.png')} style={styles.mouth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  body: { position: 'absolute', width: '100%', height: '100%' },
  eyes: {
    position: 'absolute',
    top: '34%',
    left: '23%',
    width: '54%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: { width: '45%', aspectRatio: 1.1, resizeMode: 'contain' },
  mouth: {
    position: 'absolute',
    left: '31%',
    top: '60%',
    width: '38%',
    height: '13%',
    resizeMode: 'contain',
  },
});
