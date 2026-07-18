import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

const bossAnimationImages: Record<string, ImageSourcePropType> = {
  'boss-easy-crumb-knight-walk-1': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-walk-1.webp'),
  'boss-easy-crumb-knight-walk-2': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-walk-2.webp'),
  'boss-easy-crumb-knight-walk-3': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-walk-3.webp'),
  'boss-easy-crumb-knight-hammer-windup': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-hammer-windup.webp'),
  'boss-easy-crumb-knight-hammer-impact': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-hammer-impact.webp'),
  'boss-easy-crumb-knight-hammer-recovery': require('../../../assets/images/enemies/animations/boss-easy-crumb-knight-hammer-recovery.webp'),
  'boss-normal-caramel-general-walk-1': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-walk-1.webp'),
  'boss-normal-caramel-general-walk-2': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-walk-2.webp'),
  'boss-normal-caramel-general-walk-3': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-walk-3.webp'),
  'boss-normal-caramel-general-hammer-windup': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-hammer-windup.webp'),
  'boss-normal-caramel-general-hammer-impact': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-hammer-impact.webp'),
  'boss-normal-caramel-general-hammer-recovery': require('../../../assets/images/enemies/animations/boss-normal-caramel-general-hammer-recovery.webp'),
  'boss-hard-frost-viking-walk-1': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-walk-1.webp'),
  'boss-hard-frost-viking-walk-2': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-walk-2.webp'),
  'boss-hard-frost-viking-walk-3': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-walk-3.webp'),
  'boss-hard-frost-viking-hammer-windup': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-hammer-windup.webp'),
  'boss-hard-frost-viking-hammer-impact': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-hammer-impact.webp'),
  'boss-hard-frost-viking-hammer-recovery': require('../../../assets/images/enemies/animations/boss-hard-frost-viking-hammer-recovery.webp'),
  'boss-harder-jungle-golem-walk-1': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-walk-1.webp'),
  'boss-harder-jungle-golem-walk-2': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-walk-2.webp'),
  'boss-harder-jungle-golem-walk-3': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-walk-3.webp'),
  'boss-harder-jungle-golem-hammer-windup': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-hammer-windup.webp'),
  'boss-harder-jungle-golem-hammer-impact': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-hammer-impact.webp'),
  'boss-harder-jungle-golem-hammer-recovery': require('../../../assets/images/enemies/animations/boss-harder-jungle-golem-hammer-recovery.webp'),
  'boss-insane-storm-warden-walk-1': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-walk-1.webp'),
  'boss-insane-storm-warden-walk-2': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-walk-2.webp'),
  'boss-insane-storm-warden-walk-3': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-walk-3.webp'),
  'boss-insane-storm-warden-hammer-windup': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-hammer-windup.webp'),
  'boss-insane-storm-warden-hammer-impact': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-hammer-impact.webp'),
  'boss-insane-storm-warden-hammer-recovery': require('../../../assets/images/enemies/animations/boss-insane-storm-warden-hammer-recovery.webp'),
  'boss-easy-demon-ember-brute-walk-1': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-walk-1.webp'),
  'boss-easy-demon-ember-brute-walk-2': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-walk-2.webp'),
  'boss-easy-demon-ember-brute-walk-3': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-walk-3.webp'),
  'boss-easy-demon-ember-brute-hammer-windup': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-hammer-windup.webp'),
  'boss-easy-demon-ember-brute-hammer-impact': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-hammer-impact.webp'),
  'boss-easy-demon-ember-brute-hammer-recovery': require('../../../assets/images/enemies/animations/boss-easy-demon-ember-brute-hammer-recovery.webp'),
  'boss-medium-demon-marsh-witch-walk-1': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-walk-1.webp'),
  'boss-medium-demon-marsh-witch-walk-2': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-walk-2.webp'),
  'boss-medium-demon-marsh-witch-walk-3': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-walk-3.webp'),
  'boss-medium-demon-marsh-witch-hammer-windup': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-hammer-windup.webp'),
  'boss-medium-demon-marsh-witch-hammer-impact': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-hammer-impact.webp'),
  'boss-medium-demon-marsh-witch-hammer-recovery': require('../../../assets/images/enemies/animations/boss-medium-demon-marsh-witch-hammer-recovery.webp'),
  'boss-hard-demon-bone-king-walk-1': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-walk-1.webp'),
  'boss-hard-demon-bone-king-walk-2': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-walk-2.webp'),
  'boss-hard-demon-bone-king-walk-3': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-walk-3.webp'),
  'boss-hard-demon-bone-king-hammer-windup': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-hammer-windup.webp'),
  'boss-hard-demon-bone-king-hammer-impact': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-hammer-impact.webp'),
  'boss-hard-demon-bone-king-hammer-recovery': require('../../../assets/images/enemies/animations/boss-hard-demon-bone-king-hammer-recovery.webp'),
  'boss-insane-demon-blood-knight-walk-1': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-walk-1.webp'),
  'boss-insane-demon-blood-knight-walk-2': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-walk-2.webp'),
  'boss-insane-demon-blood-knight-walk-3': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-walk-3.webp'),
  'boss-insane-demon-blood-knight-hammer-windup': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-hammer-windup.webp'),
  'boss-insane-demon-blood-knight-hammer-impact': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-hammer-impact.webp'),
  'boss-insane-demon-blood-knight-hammer-recovery': require('../../../assets/images/enemies/animations/boss-insane-demon-blood-knight-hammer-recovery.webp'),
  'boss-extreme-demon-inferno-titan-walk-1': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-walk-1.webp'),
  'boss-extreme-demon-inferno-titan-walk-2': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-walk-2.webp'),
  'boss-extreme-demon-inferno-titan-walk-3': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-walk-3.webp'),
  'boss-extreme-demon-inferno-titan-hammer-windup': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-hammer-windup.webp'),
  'boss-extreme-demon-inferno-titan-hammer-impact': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-hammer-impact.webp'),
  'boss-extreme-demon-inferno-titan-hammer-recovery': require('../../../assets/images/enemies/animations/boss-extreme-demon-inferno-titan-hammer-recovery.webp'),
  'boss-easy-god-cloud-guardian-walk-1': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-walk-1.webp'),
  'boss-easy-god-cloud-guardian-walk-2': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-walk-2.webp'),
  'boss-easy-god-cloud-guardian-walk-3': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-walk-3.webp'),
  'boss-easy-god-cloud-guardian-hammer-windup': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-hammer-windup.webp'),
  'boss-easy-god-cloud-guardian-hammer-impact': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-hammer-impact.webp'),
  'boss-easy-god-cloud-guardian-hammer-recovery': require('../../../assets/images/enemies/animations/boss-easy-god-cloud-guardian-hammer-recovery.webp'),
  'boss-medium-god-crystal-seraph-walk-1': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-walk-1.webp'),
  'boss-medium-god-crystal-seraph-walk-2': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-walk-2.webp'),
  'boss-medium-god-crystal-seraph-walk-3': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-walk-3.webp'),
  'boss-medium-god-crystal-seraph-hammer-windup': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-hammer-windup.webp'),
  'boss-medium-god-crystal-seraph-hammer-impact': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-hammer-impact.webp'),
  'boss-medium-god-crystal-seraph-hammer-recovery': require('../../../assets/images/enemies/animations/boss-medium-god-crystal-seraph-hammer-recovery.webp'),
  'boss-hard-god-time-colossus-walk-1': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-walk-1.webp'),
  'boss-hard-god-time-colossus-walk-2': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-walk-2.webp'),
  'boss-hard-god-time-colossus-walk-3': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-walk-3.webp'),
  'boss-hard-god-time-colossus-hammer-windup': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-hammer-windup.webp'),
  'boss-hard-god-time-colossus-hammer-impact': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-hammer-impact.webp'),
  'boss-hard-god-time-colossus-hammer-recovery': require('../../../assets/images/enemies/animations/boss-hard-god-time-colossus-hammer-recovery.webp'),
  'boss-insane-god-thunder-titan-walk-1': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-walk-1.webp'),
  'boss-insane-god-thunder-titan-walk-2': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-walk-2.webp'),
  'boss-insane-god-thunder-titan-walk-3': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-walk-3.webp'),
  'boss-insane-god-thunder-titan-hammer-windup': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-hammer-windup.webp'),
  'boss-insane-god-thunder-titan-hammer-impact': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-hammer-impact.webp'),
  'boss-insane-god-thunder-titan-hammer-recovery': require('../../../assets/images/enemies/animations/boss-insane-god-thunder-titan-hammer-recovery.webp'),
  'boss-extreme-god-void-emperor-walk-1': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-walk-1.webp'),
  'boss-extreme-god-void-emperor-walk-2': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-walk-2.webp'),
  'boss-extreme-god-void-emperor-walk-3': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-walk-3.webp'),
  'boss-extreme-god-void-emperor-hammer-windup': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-hammer-windup.webp'),
  'boss-extreme-god-void-emperor-hammer-impact': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-hammer-impact.webp'),
  'boss-extreme-god-void-emperor-hammer-recovery': require('../../../assets/images/enemies/animations/boss-extreme-god-void-emperor-hammer-recovery.webp'),
};

export function hasBossAnimationImage(imageKey: string): boolean {
  return bossAnimationImages[imageKey] !== undefined;
}

export const BossAnimationSprite = React.memo(function BossAnimationSprite({
  imageKey,
  size,
}: {
  imageKey: string;
  size: number;
}) {
  const source = bossAnimationImages[imageKey];
  if (!source) return null;
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
});
