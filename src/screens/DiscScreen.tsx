import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISC, PRIMARY_BOT } from '../config';
import { BotImage } from '../components/BotImage';
import { DiscImage } from '../components/DiscImage';
import { GameButton } from '../components/GameButton';
import { Panel } from '../components/Panel';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber, formatSeconds } from '../utils/format';

export function DiscScreen() {
  const { state, buyDisc, upgradeDisc, buyBot, getBotCost } = useGame();
  const feedback = useFeedback();
  const current = DISC.levels.find((level) => level.level === state.discLevel) ?? DISC.levels[0];
  const next = DISC.levels.find((level) => level.level === state.discLevel + 1);
  const botCount = state.botCounts[PRIMARY_BOT.id] ?? 0;
  const botCost = getBotCost();

  const resultFeedback = (success: boolean) => {
    if (success) { feedback.play('upgrade'); feedback.success(); }
    else { feedback.play('blocked'); feedback.error(); }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Panel style={styles.discCard}>
        <View style={styles.artWrap}>
          <DiscImage size={112} />
          <View style={styles.permanentBadge}><Text style={styles.permanentText}>영구 사용</Text></View>
        </View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>전투 전용 무기</Text>
          <Text style={styles.title}>{DISC.name}</Text>
          <Text style={styles.description}>{DISC.description}</Text>
          {!state.discOwned ? (
            <GameButton
              title={`🍪 ${formatNumber(DISC.purchaseCost)}개로 구매`}
              onPress={() => resultFeedback(buyDisc())}
              disabled={state.cookies < DISC.purchaseCost}
              compact
            />
          ) : <View style={styles.owned}><MaterialCommunityIcons name="check-decagram" size={20} color={colors.greenDark} /><Text style={styles.ownedText}>구매 완료</Text></View>}
        </View>
      </Panel>

      {state.discOwned ? (
        <Panel>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>원반 강화</Text>
            <View style={styles.level}><Text style={styles.levelText}>Lv.{current.level}</Text></View>
          </View>
          <View style={styles.statGrid}>
            <View style={styles.stat}><Text style={styles.statLabel}>공격력</Text><Text style={styles.statValue}>{current.damage}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>크기</Text><Text style={styles.statValue}>{current.size}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>속도</Text><Text style={styles.statValue}>{current.speed}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>쿨타임</Text><Text style={styles.statValue}>{formatSeconds(current.cooldownMs)}</Text></View>
          </View>
          {next ? (
            <View style={styles.nextLine}>
              <Text style={styles.nextText}>다음: 공격력 {next.damage} · 쿨타임 {formatSeconds(next.cooldownMs)}</Text>
            </View>
          ) : null}
          <GameButton
            title={next ? `🍪 ${formatNumber(next.cost)}개로 강화` : '최고 레벨!'}
            onPress={() => resultFeedback(upgradeDisc())}
            disabled={!next || state.cookies < next.cost}
            variant="purple"
            compact
          />
        </Panel>
      ) : null}

      <Panel style={styles.botCard}>
        <View style={styles.botArt}>
          <Text style={styles.teamName}>아군</Text>
          <BotImage size={93} />
        </View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>자동 공격 아군</Text>
          <Text style={styles.title}>{PRIMARY_BOT.name} × {botCount}</Text>
          <Text style={styles.description}>{PRIMARY_BOT.description}</Text>
          <Text style={styles.botDamage}>한 번에 {PRIMARY_BOT.damage} 피해 · {PRIMARY_BOT.attackIntervalMs / 1000}초마다</Text>
          <GameButton
            title={`🍪 ${formatNumber(botCost)}개로 1대 구매`}
            onPress={() => resultFeedback(buyBot())}
            disabled={state.cookies < botCost}
            variant="blue"
            compact
          />
        </View>
      </Panel>

      <View style={styles.rules}>
        <MaterialCommunityIcons name="information" size={23} color={colors.blue} />
        <Text style={styles.rulesText}>원반과 쿠키봇은 전투 화면에서만 사용할 수 있어요. 원반은 화면에 하나만 존재하며, 사라지고 쿨타임이 끝나야 다시 던질 수 있어요.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 7, paddingBottom: 18, gap: 10 },
  discCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0CE' },
  artWrap: { width: 130, height: 130, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  permanentBadge: { position: 'absolute', bottom: 4, backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  permanentText: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white },
  info: { flex: 1, marginLeft: 13, gap: 3 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.orange },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  description: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, color: colors.muted, marginBottom: 5 },
  owned: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#E4F9EC', borderRadius: 12, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6 },
  ownedText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.greenDark },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  level: { backgroundColor: '#EEE5FF', borderRadius: 13, paddingHorizontal: 11, paddingVertical: 6 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.purple },
  statGrid: { flexDirection: 'row', gap: 5 },
  stat: { flex: 1, backgroundColor: colors.cream, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  statLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
  statValue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },
  nextLine: { marginVertical: 9, backgroundColor: '#F1EAFE', borderRadius: 11, padding: 7 },
  nextText: { fontFamily: fonts.bold, fontSize: 10, color: colors.purple, textAlign: 'center' },
  botCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blueSoft },
  botArt: { width: 116, height: 126, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.blue, marginBottom: -4 },
  botDamage: { fontFamily: fonts.bold, fontSize: 9, color: colors.blueDark, marginBottom: 4 },
  rules: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 8 },
  rulesText: { flex: 1, fontFamily: fonts.medium, fontSize: 10, lineHeight: 16, color: colors.muted },
});
