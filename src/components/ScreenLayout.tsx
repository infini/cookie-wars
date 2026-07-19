import { LinearGradient } from 'expo-linear-gradient';
import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainMenuId, NavigationBadgeKey } from '../navigation/types';
import { gradients } from '../theme/colors';
import type { TabId } from '../types/game';
import type { CookieAmount } from '../types/game';
import { BottomNav } from './BottomNav';
import { SubmenuNav } from './SubmenuNav';
import { TopBar } from './TopBar';

interface ScreenLayoutProps {
  title: string;
  cookies: CookieAmount;
  activeCookieName: string;
  activeTab: TabId;
  onChangeMainMenu: (menuId: MainMenuId) => void;
  onChangeTab: (tab: TabId) => void;
  onOpenSettings: () => void;
  activeBadges: readonly NavigationBadgeKey[];
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenLayout({
  children,
  title,
  cookies,
  activeCookieName,
  activeTab,
  onChangeMainMenu,
  onChangeTab,
  onOpenSettings,
  activeBadges,
  contentStyle,
}: PropsWithChildren<ScreenLayoutProps>) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.app} style={styles.root}>
      <View style={[styles.safe, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 6) }]}>
        <TopBar
          title={title}
          cookies={cookies}
          activeCookieName={activeCookieName}
          gameScreen={activeTab === 'game'}
          onOpenSettings={onOpenSettings}
        />
        <SubmenuNav
          activeTab={activeTab}
          onChange={onChangeTab}
          activeBadges={activeBadges}
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
        <BottomNav
          activeTab={activeTab}
          onChange={onChangeMainMenu}
          activeBadges={activeBadges}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 10, gap: 8 },
  content: { flex: 1, minHeight: 0 },
});
