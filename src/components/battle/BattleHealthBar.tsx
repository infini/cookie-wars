import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BATTLE_UI } from '../../config';

export function getHealthColor(value: number, max: number): string {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const hue = BATTLE_UI.healthBarLowHue
    + (BATTLE_UI.healthBarHighHue - BATTLE_UI.healthBarLowHue) * ratio;
  return `hsl(${Math.round(hue)}, ${BATTLE_UI.healthBarSaturationPercent}%, ${BATTLE_UI.healthBarLightnessPercent}%)`;
}

interface BattleHealthBarProps {
  value: number;
  max: number;
  width: number;
  height?: number;
}

export function BattleHealthBar({
  value,
  max,
  width,
  height = BATTLE_UI.healthBarHeight,
}: BattleHealthBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View
      style={[
        styles.healthTrack,
        {
          width,
          height,
          borderWidth: BATTLE_UI.healthBarOutlineWidth,
          borderColor: BATTLE_UI.healthBarOutlineColor,
          backgroundColor: BATTLE_UI.healthBarTrackColor,
        },
      ]}
    >
      <View
        style={[
          styles.healthFill,
          { width: `${ratio * 100}%`, backgroundColor: getHealthColor(value, max) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  healthTrack: { borderRadius: 4, overflow: 'hidden', marginVertical: 1 },
  healthFill: { height: '100%' },
});
