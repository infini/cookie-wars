import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { BATTLE_UI } from '../config';

const monsterImages: Record<string, ImageSourcePropType> = {
  'crumb-minion': require('../../assets/images/enemies/crumb-minion.png'),
  'sugar-guard': require('../../assets/images/enemies/sugar-guard.png'),
  'chocolate-brute': require('../../assets/images/enemies/chocolate-brute.png'),
  'wafer-sorcerer': require('../../assets/images/enemies/wafer-sorcerer.png'),
  'boss-easy-crumb-knight': require('../../assets/images/enemies/boss-easy-crumb-knight.webp'),
  'boss-normal-caramel-general': require('../../assets/images/enemies/boss-normal-caramel-general.webp'),
  'boss-hard-frost-viking': require('../../assets/images/enemies/boss-hard-frost-viking.webp'),
  'boss-harder-jungle-golem': require('../../assets/images/enemies/boss-harder-jungle-golem.webp'),
  'boss-insane-storm-warden': require('../../assets/images/enemies/boss-insane-storm-warden.webp'),
  'boss-easy-demon-ember-brute': require('../../assets/images/enemies/boss-easy-demon-ember-brute.webp'),
  'boss-medium-demon-marsh-witch': require('../../assets/images/enemies/boss-medium-demon-marsh-witch.webp'),
  'boss-hard-demon-bone-king': require('../../assets/images/enemies/boss-hard-demon-bone-king.webp'),
  'boss-insane-demon-blood-knight': require('../../assets/images/enemies/boss-insane-demon-blood-knight.webp'),
  'boss-extreme-demon-inferno-titan': require('../../assets/images/enemies/boss-extreme-demon-inferno-titan.webp'),
  'boss-easy-god-cloud-guardian': require('../../assets/images/enemies/boss-easy-god-cloud-guardian.webp'),
  'boss-medium-god-crystal-seraph': require('../../assets/images/enemies/boss-medium-god-crystal-seraph.webp'),
  'boss-hard-god-time-colossus': require('../../assets/images/enemies/boss-hard-god-time-colossus.webp'),
  'boss-insane-god-thunder-titan': require('../../assets/images/enemies/boss-insane-god-thunder-titan.webp'),
  'boss-extreme-god-void-emperor': require('../../assets/images/enemies/boss-extreme-god-void-emperor.webp'),
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
