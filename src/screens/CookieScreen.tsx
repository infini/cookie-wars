import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COOKIES } from '../config';
import { getCookieEvolutionProgress } from '../domain/gameSelectors';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from '../components/CookieImage';
import { Panel } from '../components/Panel';

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.cookie} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function CookieScreen() {
  const { state, stats } = useGame();
  const evolution = getCookieEvolutionProgress(state);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Panel style={styles.heroCard}>
        <View style={styles.cookieHalo}><CookieImage imageKey={evolution.active.imageKey} size={116} /></View>
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>내 쿠키</Text>
          <Text style={styles.name}>{evolution.active.name}</Text>
          <Text style={styles.description}>{evolution.active.description}</Text>
        </View>
      </Panel>
      <Panel>
        <Text style={styles.sectionTitle}>쿠키 정보</Text>
        <InfoRow icon="cookie" label="현재 쿠키" value={`${formatNumber(state.cookies)}개`} />
        <InfoRow icon="gesture-tap" label="클릭당 획득" value={`${formatNumber(stats.clickPower)}개`} />
        <InfoRow icon="clock-fast" label="자동 획득" value={`${formatNumber(stats.autoProduction)}개/초`} />
        <InfoRow icon="star-circle" label="강화 레벨 합계" value={`Lv.${stats.totalUpgradeLevels}`} />
        <InfoRow icon="creation" label="현재 쿠키 보너스" value={`×${evolution.active.clickMultiplier.toFixed(2)}`} />
      </Panel>
      <Panel style={styles.evolutionPanel}>
        <View style={styles.evolutionHeader}>
          <MaterialCommunityIcons name={evolution.next ? 'arrow-up-bold-hexagon-outline' : 'crown'} size={31} color={colors.purple} />
          <View style={styles.futureText}>
            <Text style={styles.futureTitle}>{evolution.next ? `다음: ${evolution.next.name}` : '최고 쿠키 달성!'}</Text>
            <Text style={styles.futureDescription}>
              {evolution.next
                ? `강화 레벨 합계를 ${evolution.next.requiredTotalUpgradeLevels}까지 올려요. (${evolution.remainingLevels}레벨 남음)`
                : '모든 쿠키 진화를 완료했어요.'}
            </Text>
          </View>
        </View>
        <Text style={styles.levelRule}>
          별도 경험치 없이 클릭 힘·자동 생산·쿠키 성 체력을 강화하면 합계가 올라요. 저장된 이전 강화 레벨도 합계에 보존돼요.
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${evolution.progressRatio * 100}%` }]} />
        </View>
      </Panel>
      <Text style={styles.collectionTitle}>쿠키 진화 도감 · {COOKIES.length}종</Text>
      {COOKIES.map((cookie) => {
        const unlocked = evolution.totalUpgradeLevels >= cookie.requiredTotalUpgradeLevels;
        const active = cookie.id === evolution.active.id;
        return (
          <Panel key={cookie.id} style={[styles.cookieCard, active && styles.activeCookieCard, !unlocked && styles.lockedCookieCard]}>
            <CookieImage imageKey={cookie.imageKey} size={68} style={!unlocked ? styles.lockedImage : undefined} />
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName}>{cookie.name}</Text>
                <View style={[styles.stateBadge, active && styles.activeBadge]}>
                  <Text style={[styles.stateText, active && styles.activeStateText]}>
                    {active ? '현재 쿠키' : unlocked ? '진화 완료' : `총 Lv.${cookie.requiredTotalUpgradeLevels}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>{cookie.description}</Text>
              <Text style={styles.cardBonus}>클릭·자동 생산·성 체력 ×{cookie.clickMultiplier.toFixed(2)}</Text>
            </View>
          </Panel>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 6, gap: 10, paddingBottom: 16 },
  heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1CF' },
  cookieHalo: { width: 132, height: 132, borderRadius: 66, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, marginLeft: 14 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.orange },
  name: { fontFamily: fonts.display, fontSize: 23, lineHeight: 30, color: colors.ink },
  description: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 23, color: colors.ink, marginBottom: 8 },
  infoRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  infoValue: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
  evolutionPanel: { backgroundColor: '#F3ECFF' },
  evolutionHeader: { flexDirection: 'row', alignItems: 'center' },
  futureText: { flex: 1, marginLeft: 13 },
  futureTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.purple },
  futureDescription: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  levelRule: { fontFamily: fonts.medium, fontSize: 9, lineHeight: 13, color: colors.muted, marginTop: 9 },
  progressTrack: { height: 12, borderRadius: 6, backgroundColor: colors.white, overflow: 'hidden', marginTop: 11 },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: colors.purple },
  collectionTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, marginLeft: 4, marginTop: 3 },
  cookieCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white },
  activeCookieCard: { borderColor: colors.purple, backgroundColor: '#F8F3FF' },
  lockedCookieCard: { opacity: 0.65 },
  lockedImage: { opacity: 0.42 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { flex: 1, fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
  stateBadge: { borderRadius: 10, backgroundColor: colors.creamDeep, paddingHorizontal: 7, paddingVertical: 4 },
  activeBadge: { backgroundColor: colors.purple },
  stateText: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.cookieDark },
  activeStateText: { color: colors.white },
  cardDescription: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted, marginTop: 3 },
  cardBonus: { fontFamily: fonts.bold, fontSize: 9, color: colors.greenDark, marginTop: 3 },
});
