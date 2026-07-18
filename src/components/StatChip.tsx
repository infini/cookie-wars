import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface StatChipProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  tint?: string;
}

export function StatChip({ icon, label, value, tint = colors.cookie }: StatChipProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
        <MaterialCommunityIcons name={icon} size={21} color={tint} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: 9,
    gap: 7,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted },
  value: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
});
