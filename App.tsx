import { Jua_400Regular } from '@expo-google-fonts/jua/400Regular';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenLayout } from './src/components/ScreenLayout';
import { SettingsModal } from './src/components/SettingsModal';
import { BattleScreen } from './src/screens/BattleScreen';
import { BotScreen } from './src/screens/BotScreen';
import { CookieScreen } from './src/screens/CookieScreen';
import { DifficultyScreen } from './src/screens/DifficultyScreen';
import { DiscScreen } from './src/screens/DiscScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MonsterScreen } from './src/screens/MonsterScreen';
import { MiniGameScreen } from './src/screens/MiniGameScreen';
import { UpgradeScreen } from './src/screens/UpgradeScreen';
import { getCookie } from './src/config';
import {
  getScreenTitle,
  rememberMenuLeaf,
  resolveMainMenuTarget,
} from './src/navigation/model';
import type {
  MainMenuId,
  NavigationBadgeKey,
  RememberedMenuLeaves,
} from './src/navigation/types';
import { FeedbackProvider, useFeedback } from './src/services/FeedbackContext';
import { GameProvider, useGame } from './src/state/GameContext';
import { colors } from './src/theme/colors';
import { fonts } from './src/theme/typography';
import type { TabId } from './src/types/game';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={styles.loadingText}>쿠키를 굽는 중...</Text>
    </View>
  );
}

function GameShell() {
  const { state, stats, hydrated } = useGame();
  const feedback = useFeedback();
  const [activeTab, setActiveTab] = useState<TabId>('game');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rememberedLeaves = useRef<RememberedMenuLeaves>({});

  if (!hydrated) return <LoadingScreen />;

  const changeTab = (tab: TabId, withFeedback = true) => {
    rememberedLeaves.current = rememberMenuLeaf(rememberedLeaves.current, tab);
    feedback.stopCookieSounds();
    setActiveTab(tab);
    if (withFeedback) {
      feedback.play('menu');
      feedback.tap();
    }
  };

  const changeMainMenu = (menuId: MainMenuId) => {
    changeTab(resolveMainMenuTarget(menuId, rememberedLeaves.current));
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'game': return <GameScreen />;
      case 'miniGame': return <MiniGameScreen />;
      case 'battle': return <BattleScreen onReturnToGame={() => changeTab('game', false)} />;
      case 'cookie': return <CookieScreen />;
      case 'upgrade': return <UpgradeScreen />;
      case 'monster': return <MonsterScreen />;
      case 'difficulty': return <DifficultyScreen />;
      case 'disc': return <DiscScreen />;
      case 'bot': return <BotScreen />;
    }
  };
  const activeBadges: NavigationBadgeKey[] = state.newMonsterIds.length > 0
    ? ['newMonster']
    : [];

  return (
    <>
      <StatusBar style="dark" />
      <ScreenLayout
        title={getScreenTitle(activeTab)}
        cookies={state.cookies}
        activeCookieName={getCookie(stats.activeCookieId).name}
        activeTab={activeTab}
        onChangeMainMenu={changeMainMenu}
        onChangeTab={changeTab}
        onOpenSettings={() => setSettingsOpen(true)}
        activeBadges={activeBadges}
      >
        {renderScreen()}
      </ScreenLayout>
      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Jua_400Regular,
  });

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <GameProvider>
        <FeedbackProvider>
          <GameShell />
        </FeedbackProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  loadingText: { marginTop: 12, fontFamily: fonts.display, fontSize: 20, color: colors.cookieDark },
});
