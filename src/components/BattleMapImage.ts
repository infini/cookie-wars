import { ImageSourcePropType } from 'react-native';

const battleMapImages: Record<string, ImageSourcePropType> = {
  'easy-sunny-meadow': require('../../assets/images/maps/battle-map-easy-sunny-meadow.jpg'),
  'normal-caramel-vale': require('../../assets/images/maps/battle-map-normal-caramel-vale.jpg'),
  'hard-frostpine': require('../../assets/images/maps/battle-map-hard-frostpine.jpg'),
  'harder-jungle-ruins': require('../../assets/images/maps/battle-map-harder-jungle-ruins.jpg'),
  'insane-stormcliff': require('../../assets/images/maps/battle-map-insane-stormcliff.jpg'),
  'easy-demon-ember-gate': require('../../assets/images/maps/battle-map-easy-demon-ember-gate.jpg'),
  'medium-demon-toxic-marsh': require('../../assets/images/maps/battle-map-medium-demon-toxic-marsh.jpg'),
  'hard-demon-catacomb': require('../../assets/images/maps/battle-map-hard-demon-catacomb.jpg'),
  'insane-demon-blood-moon': require('../../assets/images/maps/battle-map-insane-demon-blood-moon.jpg'),
  'extreme-demon-inferno': require('../../assets/images/maps/battle-map-extreme-demon-inferno.jpg'),
  'easy-god-cloud-sanctuary': require('../../assets/images/maps/battle-map-easy-god-cloud-sanctuary.jpg'),
  'medium-god-crystal-temple': require('../../assets/images/maps/battle-map-medium-god-crystal-temple.jpg'),
  'hard-god-time-observatory': require('../../assets/images/maps/battle-map-hard-god-time-observatory.jpg'),
  'insane-god-thunder-titan': require('../../assets/images/maps/battle-map-insane-god-thunder-titan.jpg'),
  'extreme-god-divine-void': require('../../assets/images/maps/battle-map-extreme-god-divine-void.jpg'),
  'easy-titan-crystal-mine': require('../../assets/images/maps/battle-map-easy-titan-crystal-mine.jpg'),
  'medium-titan-mushroom-forest': require('../../assets/images/maps/battle-map-medium-titan-mushroom-forest.jpg'),
  'hard-titan-steam-foundry': require('../../assets/images/maps/battle-map-hard-titan-steam-foundry.jpg'),
  'insane-titan-coral-city': require('../../assets/images/maps/battle-map-insane-titan-coral-city.jpg'),
  'extreme-titan-meteor-crater': require('../../assets/images/maps/battle-map-extreme-titan-meteor-crater.jpg'),
  'easy-creator-toy-workshop': require('../../assets/images/maps/battle-map-easy-creator-toy-workshop.jpg'),
  'medium-creator-magic-library': require('../../assets/images/maps/battle-map-medium-creator-magic-library.jpg'),
  'hard-creator-shadow-theater': require('../../assets/images/maps/battle-map-hard-creator-shadow-theater.jpg'),
  'insane-creator-alchemy-greenhouse': require('../../assets/images/maps/battle-map-insane-creator-alchemy-greenhouse.jpg'),
  'extreme-creator-nebula-studio': require('../../assets/images/maps/battle-map-extreme-creator-nebula-studio.jpg'),
  'easy-infinity-mirror-labyrinth': require('../../assets/images/maps/battle-map-easy-infinity-mirror-labyrinth.jpg'),
  'medium-infinity-fractal-canyon': require('../../assets/images/maps/battle-map-medium-infinity-fractal-canyon.jpg'),
  'hard-infinity-inverted-city': require('../../assets/images/maps/battle-map-hard-infinity-inverted-city.jpg'),
  'insane-infinity-eternal-clock': require('../../assets/images/maps/battle-map-insane-infinity-eternal-clock.jpg'),
  'extreme-infinity-multiverse-rift': require('../../assets/images/maps/battle-map-extreme-infinity-multiverse-rift.jpg'),
};

export function hasBattleMapImage(imageKey: string): boolean {
  return battleMapImages[imageKey] !== undefined;
}

export function getBattleMapImageSource(imageKey: string): ImageSourcePropType {
  return battleMapImages[imageKey] ?? battleMapImages['easy-sunny-meadow'];
}
