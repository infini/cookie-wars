import { Jua_400Regular } from '@expo-google-fonts/jua/400Regular';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenLayout } from './src/components/ScreenLayout';
import { SettingsModal } from './src/components/SettingsModal';
import { BattleScreen } from './src/screens/BattleScreen';
import { CookieScreen } from './src/screens/CookieScreen';
import { DifficultyScreen } from './src/screens/DifficultyScreen';
import { DiscScreen } from './src/screens/DiscScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MonsterScreen } from './src/screens/MonsterScreen';
import { UpgradeScreen } from './src/screens/UpgradeScreen';
import { FeedbackProvider, useFeedback } from './src/services/FeedbackContext';
import { GameProvider, useGame } from './src/state/GameContext';
import { colors } from './src/theme/colors';
import { fonts } from './src/theme/typography';
import { TabId } from './src/types/game';

const titles: Record<TabId, string> = {
  game: '쿠키 모으기',
  battle: '전투',
  cookie: '쿠키 정보',
  upgrade: '쿠키 업그레이드',
  monster: '몬스터 도감',
  difficulty: '난이도 선택',
  disc: '원반과 쿠키봇',
};

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={styles.loadingText}>쿠키를 굽는 중...</Text>
    </View>
  );
}

function GameShell() {
  const { state, hydrated } = useGame();
  const feedback = useFeedback();
  const [activeTab, setActiveTab] = useState<TabId>('game');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!hydrated) return <LoadingScreen />;

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    feedback.play('menu');
    feedback.tap();
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'game': return <GameScreen onGoBattle={() => changeTab('battle')} />;
      case 'battle': return <BattleScreen onReturnToGame={() => setActiveTab('game')} />;
      case 'cookie': return <CookieScreen />;
      case 'upgrade': return <UpgradeScreen />;
      case 'monster': return <MonsterScreen />;
      case 'difficulty': return <DifficultyScreen />;
      case 'disc': return <DiscScreen />;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <ScreenLayout
        title={titles[activeTab]}
        cookies={state.cookies}
        activeTab={activeTab}
        onChangeTab={changeTab}
        onOpenSettings={() => setSettingsOpen(true)}
        hasNewMonster={state.newMonsterIds.length > 0}
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
