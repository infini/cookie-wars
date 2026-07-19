import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BotImage } from '../components/BotImage';
import { GameButton } from '../components/GameButton';
import { Panel } from '../components/Panel';
import { getCookie } from '../config';
import { getBotOffers, getTotalBotCount } from '../domain/gameSelectors';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber, formatSeconds } from '../utils/format';

export function BotScreen() {
  const { state, stats, buyBot } = useGame();
  const feedback = useFeedback();
  const botOffers = getBotOffers(state);
  const activeCookie = getCookie(stats.activeCookieId);
  const totalBots = getTotalBotCount(state);

  const buy = (botId: string) => {
    const success = buyBot(botId);
    if (success) {
      feedback.play('upgrade');
      feedback.success();
    } else {
      feedback.play('blocked');
      feedback.error();
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Panel style={styles.hero}>
        <View style={styles.heroArt}>
          <Text style={styles.teamName}>아군</Text>
          <BotImage size={96} cookieImageKey={activeCookie.imageKey} />
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.eyebrow}>자동 전투 부대 · {botOffers.length}종</Text>
          <Text style={styles.heroTitle}>쿠키봇 {formatNumber(totalBots)}대</Text>
          <Text style={styles.description}>구매한 쿠키봇만 전투에서 장착 원반을 자동으로 던져요.</Text>
        </View>
      </Panel>

      {botOffers.map((offer, index) => (
        <Panel
          key={offer.config.id}
          style={[styles.botCard, { borderColor: offer.config.accentColor }]}
        >
          <View style={[styles.botArt, { backgroundColor: `${offer.config.accentColor}18` }]}>
            <View style={[styles.rankBadge, { backgroundColor: offer.config.accentColor }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <BotImage size={82} cookieImageKey={activeCookie.imageKey} />
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.botName}>{offer.config.name}</Text>
              <Text style={[styles.count, { color: offer.config.accentColor }]}>× {formatNumber(offer.count)}</Text>
            </View>
            <Text style={styles.description}>{offer.config.description}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="sword" size={16} color={colors.red} />
                <Text style={styles.statLabel}>원반 피해</Text>
                <Text style={styles.statValue}>×{offer.config.discDamageMultiplier}</Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="timer-outline" size={16} color={colors.blue} />
                <Text style={styles.statLabel}>자동 발사</Text>
                <Text style={styles.statValue}>{formatSeconds(offer.config.attackIntervalMs)}</Text>
              </View>
            </View>
            <GameButton
              title={`🍪 ${formatNumber(offer.price)}개로 1대 구매`}
              onPress={() => buy(offer.config.id)}
              disabled={!offer.affordable}
              variant="blue"
              compact
            />
          </View>
        </Panel>
      ))}

      <View style={styles.rules}>
        <MaterialCommunityIcons name="information" size={23} color={colors.blue} />
        <Text style={styles.rulesText}>쿠키봇은 항상 자동 공격해요. 자동 전투를 켜면 쿠키 성도 자동으로 원반을 던져요.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 7, paddingBottom: 18, gap: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blueSoft },
  heroArt: { width: 124, height: 130, borderRadius: 30, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.blue, marginBottom: -5 },
  heroInfo: { flex: 1, marginLeft: 13, gap: 4 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.blue },
  heroTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  description: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, color: colors.muted },
  botCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white },
  botArt: { width: 108, height: 132, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rankBadge: { position: 'absolute', left: 7, top: 7, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.white },
  info: { flex: 1, marginLeft: 12, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  botName: { flex: 1, fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  count: { fontFamily: fonts.extraBold, fontSize: 14 },
  stats: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
  statValue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },
  rules: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 8 },
  rulesText: { flex: 1, fontFamily: fonts.medium, fontSize: 10, lineHeight: 16, color: colors.muted },
});
