import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from './CookieImage';

interface TopBarProps {
  title: string;
  cookies: number;
  onOpenSettings: () => void;
}

export function TopBar({ title, cookies, onOpenSettings }: TopBarProps) {
  return (
    <LinearGradient colors={gradients.header} style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.gameTitle}>쿠키전쟁</Text>
        <Text style={styles.screenTitle}>{title}</Text>
      </View>
      <View style={styles.cookiePill}>
        <CookieImage size={28} />
        <Text style={styles.cookieCount}>{formatNumber(cookies)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="설정 열기"
        onPress={onOpenSettings}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="cog" size={27} color={colors.ink} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 74,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  titleWrap: { flex: 1 },
  gameTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  screenTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.chocolate },
  cookiePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 112,
  },
  cookieCount: { fontFamily: fonts.extraBold, color: colors.ink, fontSize: 14, marginLeft: 4 },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.94 }] },
});
