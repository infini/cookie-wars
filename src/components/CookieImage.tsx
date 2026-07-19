import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

const cookieImages: Record<string, ImageSourcePropType> = {
  classic: require('../../assets/images/cookies/classic.webp'),
  fortune: require('../../assets/images/cookies/fortune.webp'),
  donut: require('../../assets/images/cookies/donut.webp'),
  waffle: require('../../assets/images/cookies/waffle.webp'),
  cupcake: require('../../assets/images/cookies/cupcake.webp'),
  'strawberry-cake': require('../../assets/images/cookies/strawberry-cake.webp'),
  mooncake: require('../../assets/images/cookies/mooncake.webp'),
  'party-cake': require('../../assets/images/cookies/party-cake.webp'),
  'rice-cracker': require('../../assets/images/cookies/rice-cracker.webp'),
  chocolate: require('../../assets/images/cookies/chocolate.webp'),
  candy: require('../../assets/images/cookies/candy.webp'),
  lollipop: require('../../assets/images/cookies/lollipop.webp'),
  custard: require('../../assets/images/cookies/custard.webp'),
  shortcake: require('../../assets/images/cookies/shortcake.webp'),
  dango: require('../../assets/images/cookies/dango.webp'),
  'shaved-ice': require('../../assets/images/cookies/shaved-ice.webp'),
  honey: require('../../assets/images/cookies/honey.webp'),
  pie: require('../../assets/images/cookies/pie.webp'),
  gem: require('../../assets/images/cookies/gem.webp'),
  crown: require('../../assets/images/cookies/crown.webp'),
  'aurora-gem': require('../../assets/images/cookies/aurora-gem.webp'),
  'deepsea-pearl': require('../../assets/images/cookies/deepsea-pearl.webp'),
  'solar-flare': require('../../assets/images/cookies/solar-flare.webp'),
  'lunar-empress': require('../../assets/images/cookies/lunar-empress.webp'),
  clockwork: require('../../assets/images/cookies/clockwork.webp'),
  'dimension-rift': require('../../assets/images/cookies/dimension-rift.webp'),
  'dragon-scale': require('../../assets/images/cookies/dragon-scale.webp'),
  nebula: require('../../assets/images/cookies/nebula.webp'),
  'genesis-crystal': require('../../assets/images/cookies/genesis-crystal.webp'),
  'infinite-cosmos': require('../../assets/images/cookies/infinite-cosmos.webp'),
  'comet-tail': require('../../assets/images/cookies/comet-tail.webp'),
  'polar-compass': require('../../assets/images/cookies/polar-compass.webp'),
  'world-tree-leaf': require('../../assets/images/cookies/world-tree-leaf.webp'),
  'phoenix-feather': require('../../assets/images/cookies/phoenix-feather.webp'),
  'thunder-drum': require('../../assets/images/cookies/thunder-drum.webp'),
  'dream-cloud': require('../../assets/images/cookies/dream-cloud.webp'),
  'spirit-lantern': require('../../assets/images/cookies/spirit-lantern.webp'),
  'ancient-rune': require('../../assets/images/cookies/ancient-rune.webp'),
  'sky-island': require('../../assets/images/cookies/sky-island.webp'),
  'stellar-forge': require('../../assets/images/cookies/stellar-forge.webp'),
  'eternity-hourglass': require('../../assets/images/cookies/eternity-hourglass.webp'),
  'cosmic-lotus': require('../../assets/images/cookies/cosmic-lotus.webp'),
  'destiny-mirror': require('../../assets/images/cookies/destiny-mirror.webp'),
  'celestial-harp': require('../../assets/images/cookies/celestial-harp.webp'),
  'rainbow-prism': require('../../assets/images/cookies/rainbow-prism.webp'),
  'twilight-seal': require('../../assets/images/cookies/twilight-seal.webp'),
  'miracle-chalice': require('../../assets/images/cookies/miracle-chalice.webp'),
  'primordial-egg': require('../../assets/images/cookies/primordial-egg.webp'),
  'world-gate': require('../../assets/images/cookies/world-gate.webp'),
  'kingdom-heart': require('../../assets/images/cookies/kingdom-heart.webp'),
  'crystal-dragon-egg': require('../../assets/images/cookies/crystal-dragon-egg.webp'),
  'solar-lion': require('../../assets/images/cookies/solar-lion.webp'),
  'moon-rabbit': require('../../assets/images/cookies/moon-rabbit.webp'),
  'star-whale': require('../../assets/images/cookies/star-whale.webp'),
  'storm-pegasus': require('../../assets/images/cookies/storm-pegasus.webp'),
  'desert-sphinx': require('../../assets/images/cookies/desert-sphinx.webp'),
  'deepsea-trident': require('../../assets/images/cookies/deepsea-trident.webp'),
  'volcano-heart': require('../../assets/images/cookies/volcano-heart.webp'),
  'ice-palace': require('../../assets/images/cookies/ice-palace.webp'),
  'emerald-guardian-tree': require('../../assets/images/cookies/emerald-guardian-tree.webp'),
  'candy-mecha-dragon': require('../../assets/images/cookies/candy-mecha-dragon.webp'),
  'time-library': require('../../assets/images/cookies/time-library.webp'),
  'dream-butterfly': require('../../assets/images/cookies/dream-butterfly.webp'),
  'aurora-castle': require('../../assets/images/cookies/aurora-castle.webp'),
  'thunder-crown': require('../../assets/images/cookies/thunder-crown.webp'),
  'phoenix-crown': require('../../assets/images/cookies/phoenix-crown.webp'),
  'world-tree-crown': require('../../assets/images/cookies/world-tree-crown.webp'),
  'fate-star-map': require('../../assets/images/cookies/fate-star-map.webp'),
  'creation-compass': require('../../assets/images/cookies/creation-compass.webp'),
  'void-beacon': require('../../assets/images/cookies/void-beacon.webp'),
  'galaxy-key': require('../../assets/images/cookies/galaxy-key.webp'),
  'celestial-dragon': require('../../assets/images/cookies/celestial-dragon.webp'),
  'dimension-cube': require('../../assets/images/cookies/dimension-cube.webp'),
  'eternity-throne': require('../../assets/images/cookies/eternity-throne.webp'),
  'cosmic-ark': require('../../assets/images/cookies/cosmic-ark.webp'),
  'genesis-clock': require('../../assets/images/cookies/genesis-clock.webp'),
  'infinity-sanctuary': require('../../assets/images/cookies/infinity-sanctuary.webp'),
  'multiverse-gem': require('../../assets/images/cookies/multiverse-gem.webp'),
  'transcendence-crown': require('../../assets/images/cookies/transcendence-crown.webp'),
  'cookie-universe-core': require('../../assets/images/cookies/cookie-universe-core.webp'),
};

export function hasCookieImage(imageKey: string): boolean {
  return cookieImages[imageKey] !== undefined;
}

export const CookieImage = React.memo(function CookieImage({
  size,
  imageKey = 'classic',
  style,
}: {
  size: number;
  imageKey?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={cookieImages[imageKey] ?? cookieImages.classic}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
});
