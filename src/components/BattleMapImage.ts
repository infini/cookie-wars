import { ImageSourcePropType } from 'react-native';

const battleMapImages: Record<string, ImageSourcePropType> = {
  'medieval-meadow': require('../../assets/images/maps/battle-map-medieval.png'),
  'arctic-glacier': require('../../assets/images/maps/battle-map-glacier.png'),
  'desert-temple': require('../../assets/images/maps/battle-map-desert.png'),
  'volcanic-rift': require('../../assets/images/maps/battle-map-volcanic.png'),
};

export function getBattleMapImageSource(imageKey: string): ImageSourcePropType {
  return battleMapImages[imageKey] ?? battleMapImages['medieval-meadow'];
}
