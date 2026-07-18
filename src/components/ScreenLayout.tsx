import { LinearGradient } from 'expo-linear-gradient';
import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '../theme/colors';
import { TabId } from '../types/game';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

interface ScreenLayoutProps {
  title: string;
  cookies: number;
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  onOpenSettings: () => void;
  hasNewMonster: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenLayout({
  children,
  title,
  cookies,
  activeTab,
  onChangeTab,
  onOpenSettings,
  hasNewMonster,
  contentStyle,
}: PropsWithChildren<ScreenLayoutProps>) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.app} style={styles.root}>
      <View style={[styles.safe, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 6) }]}>
        <TopBar title={title} cookies={cookies} onOpenSettings={onOpenSettings} />
        <View style={[styles.content, contentStyle]}>{children}</View>
        <BottomNav
          activeTab={activeTab}
          onChange={onChangeTab}
          hasNewMonster={hasNewMonster}
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
