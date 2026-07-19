import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CookieFragmentImage } from '../../components/CookieFragmentImage';
import { CookieRareStatImage } from '../../components/CookieRareStatImage';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface CookieRareStatsProps {
  criticalChance: string;
  criticalMultiplier: string;
  superCriticalChance: string;
  superCriticalMultiplier: string;
  magmaChance: string;
  magmaMultiplier: string;
  electricChance: string;
  electricMultiplier: string;
}

function RareStatItem({
  icon,
  label,
  chance,
  multiplier,
  color,
}: {
  icon: ReactNode;
  label: string;
  chance: string;
  multiplier: string;
  color: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} 확률 ${chance}퍼센트, 획득 ${multiplier}배`}
      style={styles.item}
    >
      {icon}
      <Text numberOfLines={1} style={[styles.value, { color }]}>
        {chance}% · ×{multiplier}
      </Text>
    </View>
  );
}

export function CookieRareStats(props: CookieRareStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <RareStatItem
          icon={<CookieRareStatImage kind="critical" size={34} />}
          label="크리티컬"
          chance={props.criticalChance}
          multiplier={props.criticalMultiplier}
          color={colors.red}
        />
        <RareStatItem
          icon={<CookieRareStatImage kind="superCritical" size={34} />}
          label="슈퍼 크리티컬"
          chance={props.superCriticalChance}
          multiplier={props.superCriticalMultiplier}
          color={colors.purple}
        />
      </View>
      <View style={styles.row}>
        <RareStatItem
          icon={<CookieFragmentImage kind="magma" size={34} />}
          label="마그마 조각"
          chance={props.magmaChance}
          multiplier={props.magmaMultiplier}
          color={colors.cookieDark}
        />
        <RareStatItem
          icon={<CookieFragmentImage kind="electric" size={34} />}
          label="전기 조각"
          chance={props.electricChance}
          multiplier={props.electricMultiplier}
          color={colors.blue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  item: { minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  value: { fontFamily: fonts.extraBold, fontSize: 12, textAlign: 'center' },
});
