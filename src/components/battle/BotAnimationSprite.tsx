import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

const botAnimationImages: Record<string, ImageSourcePropType> = {
  'choco-bot-run-1': require('../../../assets/images/bots/animations/choco-bot-run-1.webp'),
  'choco-bot-run-2': require('../../../assets/images/bots/animations/choco-bot-run-2.webp'),
  'choco-bot-run-3': require('../../../assets/images/bots/animations/choco-bot-run-3.webp'),
  'choco-bot-throw-windup': require('../../../assets/images/bots/animations/choco-bot-throw-windup.webp'),
  'choco-bot-throw-release': require('../../../assets/images/bots/animations/choco-bot-throw-release.webp'),
  'choco-bot-throw-recovery': require('../../../assets/images/bots/animations/choco-bot-throw-recovery.webp'),
  'milk-bot-run-1': require('../../../assets/images/bots/animations/milk-bot-run-1.webp'),
  'milk-bot-run-2': require('../../../assets/images/bots/animations/milk-bot-run-2.webp'),
  'milk-bot-run-3': require('../../../assets/images/bots/animations/milk-bot-run-3.webp'),
  'milk-bot-throw-windup': require('../../../assets/images/bots/animations/milk-bot-throw-windup.webp'),
  'milk-bot-throw-release': require('../../../assets/images/bots/animations/milk-bot-throw-release.webp'),
  'milk-bot-throw-recovery': require('../../../assets/images/bots/animations/milk-bot-throw-recovery.webp'),
  'mint-bot-run-1': require('../../../assets/images/bots/animations/mint-bot-run-1.webp'),
  'mint-bot-run-2': require('../../../assets/images/bots/animations/mint-bot-run-2.webp'),
  'mint-bot-run-3': require('../../../assets/images/bots/animations/mint-bot-run-3.webp'),
  'mint-bot-throw-windup': require('../../../assets/images/bots/animations/mint-bot-throw-windup.webp'),
  'mint-bot-throw-release': require('../../../assets/images/bots/animations/mint-bot-throw-release.webp'),
  'mint-bot-throw-recovery': require('../../../assets/images/bots/animations/mint-bot-throw-recovery.webp'),
  'rainbow-bot-run-1': require('../../../assets/images/bots/animations/rainbow-bot-run-1.webp'),
  'rainbow-bot-run-2': require('../../../assets/images/bots/animations/rainbow-bot-run-2.webp'),
  'rainbow-bot-run-3': require('../../../assets/images/bots/animations/rainbow-bot-run-3.webp'),
  'rainbow-bot-throw-windup': require('../../../assets/images/bots/animations/rainbow-bot-throw-windup.webp'),
  'rainbow-bot-throw-release': require('../../../assets/images/bots/animations/rainbow-bot-throw-release.webp'),
  'rainbow-bot-throw-recovery': require('../../../assets/images/bots/animations/rainbow-bot-throw-recovery.webp'),
  'royal-bot-run-1': require('../../../assets/images/bots/animations/royal-bot-run-1.webp'),
  'royal-bot-run-2': require('../../../assets/images/bots/animations/royal-bot-run-2.webp'),
  'royal-bot-run-3': require('../../../assets/images/bots/animations/royal-bot-run-3.webp'),
  'royal-bot-throw-windup': require('../../../assets/images/bots/animations/royal-bot-throw-windup.webp'),
  'royal-bot-throw-release': require('../../../assets/images/bots/animations/royal-bot-throw-release.webp'),
  'royal-bot-throw-recovery': require('../../../assets/images/bots/animations/royal-bot-throw-recovery.webp'),
};

export function hasBotAnimationImage(imageKey: string): boolean {
  return botAnimationImages[imageKey] !== undefined;
}

export const BotAnimationSprite = React.memo(function BotAnimationSprite({
  imageKey,
  size,
}: {
  imageKey: string;
  size: number;
}) {
  const source = botAnimationImages[imageKey];
  if (!source) return null;
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
});
