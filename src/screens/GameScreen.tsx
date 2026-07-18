import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from '../components/CookieImage';
import { GameButton } from '../components/GameButton';
import { StatChip } from '../components/StatChip';

interface FloatingGainProps {
  id: number;
  amount: number;
  onDone: (id: number) => void;
}

function FloatingGain({ id, amount, onDone }: FloatingGainProps) {
  const progress = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => onDone(id));
  }, [id, onDone, progress]);
  return (
    <Animated.Text
      style={[
        styles.floatingText,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -92] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.75, 1.18, 1] }) },
          ],
        },
      ]}
    >
      +{formatNumber(amount)}
    </Animated.Text>
  );
}

export function GameScreen({ onGoBattle }: { onGoBattle: () => void }) {
  const { state, stats, clickCookie } = useGame();
  const feedback = useFeedback();
  const scale = useRef(new Animated.Value(1)).current;
  const nextGainId = useRef(0);
  const [gains, setGains] = useState<{ id: number; amount: number }[]>([]);

  const handleCookiePress = () => {
    const amount = clickCookie();
    feedback.play('cookie');
    feedback.tap();
    const id = nextGainId.current++;
    setGains((current) => [...current.slice(-4), { id, amount }]);
    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.89, speed: 40, bounciness: 2, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 25, bounciness: 12, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.root}>
      <View style={styles.statsRow}>
        <StatChip icon="cookie" label="현재 쿠키" value={formatNumber(state.cookies)} />
        <StatChip icon="arrow-up-bold" label="쿠키 레벨" value={`Lv.${stats.cookieLevel}`} tint={colors.purple} />
        <StatChip icon="gesture-tap" label="한 번에" value={`+${formatNumber(stats.clickPower)}`} tint={colors.blue} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.guide}>쿠키를 눌러 보세요!</Text>
        <View style={styles.cookieStage}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          {gains.map((gain) => (
            <FloatingGain
              key={gain.id}
              {...gain}
              onDone={(id) => setGains((current) => current.filter((item) => item.id !== id))}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`쿠키 버튼, 누르면 쿠키 ${stats.clickPower}개 획득`}
            onPress={handleCookiePress}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <LinearGradient colors={gradients.cookieButton} style={styles.cookieButton}>
                <CookieImage size={Math.min(224, 190 * (stats.sizePercent / 100))} />
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>
        <Text style={styles.autoText}>
          자동 생산 {formatNumber(stats.autoProduction)}개/초
        </Text>
      </View>

      <GameButton title="⚔ 전투하러 가기" onPress={onGoBattle} variant="red" style={styles.battleButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingVertical: 4 },
  statsRow: { flexDirection: 'row', gap: 6 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  guide: { fontFamily: fonts.display, fontSize: 25, color: colors.cookieDark, marginBottom: 4 },
  cookieStage: { width: 286, height: 286, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute', width: 278, height: 278, borderRadius: 139,
    backgroundColor: 'rgba(255, 200, 61, 0.22)', borderWidth: 3, borderColor: 'rgba(255, 169, 61, 0.32)',
  },
  ringInner: {
    position: 'absolute', width: 244, height: 244, borderRadius: 122,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cookieButton: {
    width: 225, height: 225, borderRadius: 113, alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#FFD97A', shadowColor: colors.shadow, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  floatingText: {
    position: 'absolute', zIndex: 5, top: 98, fontFamily: fonts.display, fontSize: 34,
    color: colors.greenDark, textShadowColor: colors.white, textShadowRadius: 5,
  },
  autoText: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, marginTop: 2 },
  battleButton: { marginHorizontal: 10, marginBottom: 2 },
});
