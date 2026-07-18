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
};

export function getBattleMapImageSource(imageKey: string): ImageSourcePropType {
  return battleMapImages[imageKey] ?? battleMapImages['easy-sunny-meadow'];
}
