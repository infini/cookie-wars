import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDiscOffers, getDiscProgress } from '../domain/gameSelectors';
import { DiscImage } from '../components/DiscImage';
import { GameButton } from '../components/GameButton';
import { Panel } from '../components/Panel';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber, formatSeconds } from '../utils/format';

export function DiscScreen() {
  const { state, buyDisc, upgradeDisc, resetDisc, equipDisc } = useGame();
  const feedback = useFeedback();
  const discOffers = getDiscOffers(state);
  const selectedDisc = getDiscProgress(state);

  const resultFeedback = (success: boolean) => {
    if (success) { feedback.play('upgrade'); feedback.success(); }
    else { feedback.play('blocked'); feedback.error(); }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Panel style={styles.discCard}>
        <View style={styles.artWrap}>
          <DiscImage size={96} />
          <View style={styles.permanentBadge}><Text style={styles.permanentText}>영구 사용</Text></View>
        </View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>쿠키 원반 상점 · {discOffers.length}종</Text>
          <Text style={styles.title}>장착 원반</Text>
          <Text style={styles.selectedDiscName}>
            {selectedDisc.owned ? `${selectedDisc.config.name} Lv.${formatNumber(selectedDisc.current.level)}` : '아직 원반이 없어요'}
          </Text>
          <Text style={styles.description}>구매한 원반은 영구 보유하며, 하나를 골라 모든 쿠키봇과 쿠키 성이 사용해요.</Text>
        </View>
      </Panel>

      {discOffers.map((disc) => {
        const { current, next } = disc;
        const confirmReset = () => {
          Alert.alert(
            `${disc.config.name} 강화 초기화`,
            `구매한 원반은 그대로 보유하고 Lv.1로 돌아갑니다. 강화에 사용한 쿠키 ${formatNumber(disc.upgradeRefund)}개를 모두 돌려받을까요?`,
            [
              { text: '취소', style: 'cancel' },
              {
                text: '초기화하고 반환받기',
                style: 'destructive',
                onPress: () => resultFeedback(resetDisc(disc.config.id)),
              },
            ],
          );
        };
        return (
        <Panel key={disc.config.id} style={[styles.offerCard, disc.selected && styles.selectedOffer]}>
          <View style={styles.sectionHeader}>
            <View style={styles.offerTitleWrap}>
              <DiscImage size={50} />
              <View>
                <Text style={styles.sectionTitle}>{disc.config.name}</Text>
                <Text style={styles.offerDescription}>{disc.config.description}</Text>
              </View>
            </View>
            <View style={[styles.level, disc.selected && styles.selectedLevel]}>
              <Text style={[styles.levelText, disc.selected && styles.selectedLevelText]}>
                {disc.selected ? '장착 중' : `Lv.${formatNumber(current.level)}`}
              </Text>
            </View>
          </View>
          <View style={styles.statGrid}>
            <View style={styles.stat}><Text style={styles.statLabel}>공격력</Text><Text style={styles.statValue}>{formatNumber(current.damage)}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>크기</Text><Text style={styles.statValue}>{formatNumber(current.size)}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>속도</Text><Text style={styles.statValue}>{formatNumber(current.speed)}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>쿨타임</Text><Text style={styles.statValue}>{formatSeconds(current.cooldownMs)}</Text></View>
          </View>
          {disc.owned ? (
            <View style={styles.nextLine}>
              <Text style={styles.nextText}>
                {next
                  ? `다음: 공격력 ${formatNumber(next.damage)} · 쿨타임 ${formatSeconds(next.cooldownMs)}`
                  : '모든 강화 완료!'}
              </Text>
            </View>
          ) : null}
          <View style={styles.offerButtons}>
            {!disc.owned ? (
              <GameButton
                title={`🍪 ${formatNumber(disc.purchaseCost)} 구매`}
                onPress={() => resultFeedback(buyDisc(disc.config.id))}
                disabled={!disc.purchaseAffordable}
                compact
                style={styles.offerButton}
              />
            ) : !disc.selected ? (
              <GameButton
                title="이 원반 장착"
                onPress={() => resultFeedback(equipDisc(disc.config.id))}
                variant="blue"
                compact
                style={styles.offerButton}
              />
            ) : (
              <View style={styles.owned}><MaterialCommunityIcons name="check-decagram" size={20} color={colors.greenDark} /><Text style={styles.ownedText}>현재 장착</Text></View>
            )}
            {disc.owned ? (
              <GameButton
                title={next ? `🍪 ${formatNumber(next.cost)} 강화` : '최고 레벨'}
                onPress={() => resultFeedback(upgradeDisc(disc.config.id))}
                disabled={!next || !disc.upgradeAffordable}
                variant="purple"
                compact
                style={styles.offerButton}
              />
            ) : null}
          </View>
          {disc.resettable ? (
            <GameButton
              title={`강화 초기화 · 🍪 ${formatNumber(disc.upgradeRefund)} 반환`}
              onPress={confirmReset}
              variant="red"
              compact
              style={styles.resetButton}
            />
          ) : null}
        </Panel>
        );
      })}

      <View style={styles.rules}>
        <MaterialCommunityIcons name="information" size={23} color={colors.blue} />
        <Text style={styles.rulesText}>원반은 전투 화면에서만 사용해요. 이전 원반이 날아가는 중이어도 쿨타임이 끝나면 다음 원반을 던질 수 있어요.</Text>
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
  selectedDiscName: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.purple },
  description: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, color: colors.muted, marginBottom: 5 },
  owned: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#E4F9EC', borderRadius: 12, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6 },
  ownedText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.greenDark },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  offerCard: { backgroundColor: colors.white },
  selectedOffer: { borderColor: colors.blue, backgroundColor: '#F1F8FF' },
  offerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  offerDescription: { maxWidth: 220, fontFamily: fonts.regular, fontSize: 9, color: colors.muted },
  level: { backgroundColor: '#EEE5FF', borderRadius: 13, paddingHorizontal: 11, paddingVertical: 6 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.purple },
  selectedLevel: { backgroundColor: colors.blue },
  selectedLevelText: { color: colors.white },
  statGrid: { flexDirection: 'row', gap: 5 },
  stat: { flex: 1, backgroundColor: colors.cream, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  statLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
  statValue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },
  nextLine: { marginVertical: 9, backgroundColor: '#F1EAFE', borderRadius: 11, padding: 7 },
  nextText: { fontFamily: fonts.bold, fontSize: 10, color: colors.purple, textAlign: 'center' },
  offerButtons: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  offerButton: { flex: 1 },
  resetButton: { marginTop: 7 },
  rules: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 8 },
  rulesText: { flex: 1, fontFamily: fonts.medium, fontSize: 10, lineHeight: 16, color: colors.muted },
});
