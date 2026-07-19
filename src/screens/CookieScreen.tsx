import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BATTLE_REWARDS, COOKIES, DIFFICULTIES } from '../config';
import {
  getBattleMedalBonuses,
  getCookieEvolutionProgress,
  getDifficultyProgress,
} from '../domain/gameSelectors';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from '../components/CookieImage';
import { Panel } from '../components/Panel';
import { formatCriticalChancePercent } from '../domain/cookieCritical';
import { formatSuperCriticalChancePercent } from '../domain/cookieSuperCritical';

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
  const medalBonuses = getBattleMedalBonuses(state);
  const nextMedalBattle = DIFFICULTIES
    .map((difficulty) => ({
      difficulty,
      progress: getDifficultyProgress(state, difficulty.id),
    }))
    .find(({ progress }) => !progress.completed);
  return (
    <FlatList
      data={COOKIES}
      keyExtractor={(cookie) => cookie.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={(
        <View style={styles.header}>
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
            <InfoRow icon="bomb" label="쿠키 크리티컬" value={`${formatCriticalChancePercent(stats.criticalChanceUnits)}% · ×${formatNumber(stats.criticalRewardMultiplier)}`} />
            <InfoRow icon="star-four-points-circle" label="슈퍼 크리티컬" value={`${formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}% · ×${formatNumber(stats.superCriticalRewardMultiplier)}`} />
            <InfoRow icon="clock-fast" label="자동 획득" value={`${formatNumber(stats.autoProduction)}개/초`} />
            <InfoRow icon="star-circle" label="진화 레벨" value={`Lv.${formatNumber(stats.totalUpgradeLevels)}`} />
            <InfoRow icon="creation" label="현재 쿠키 보너스" value={`×${evolution.active.clickMultiplier.toFixed(2)}`} />
          </Panel>
          <Panel style={styles.medalPanel}>
            <View style={styles.medalHeader}>
              <MaterialCommunityIcons name="medal" size={31} color={colors.purple} />
              <View style={styles.medalTextGroup}>
                <Text style={styles.medalTitle}>전투 훈장 {formatNumber(medalBonuses.battleMedals)}개</Text>
                <Text style={styles.medalDescription}>
                  {nextMedalBattle
                    ? `다음 획득: ${nextMedalBattle.difficulty.name} ${nextMedalBattle.progress.currentBattleNumber}번째 전투 최초 승리`
                    : '모든 전투 훈장을 획득했어요!'}
                </Text>
              </View>
            </View>
            <Text style={styles.medalSectionTitle}>현재 영구 효과</Text>
            <InfoRow icon="gesture-tap" label="클릭 힘" value={`+${formatNumber(medalBonuses.clickPowerBonusPercent)}% · ×${medalBonuses.clickPowerMultiplier.toFixed(2)}`} />
            <InfoRow icon="clock-fast" label="자동 생산" value={`+${formatNumber(medalBonuses.autoProductionBonusPercent)}% · ×${medalBonuses.autoProductionMultiplier.toFixed(2)}`} />
            <InfoRow icon="castle" label="쿠키 성 최대 체력" value={`+${formatNumber(medalBonuses.castleHealthBonusPercent)}% · ×${medalBonuses.castleHealthMultiplier.toFixed(2)}`} />
            <View style={styles.medalFormulaBox}>
              <Text style={styles.medalFormula}>
                최종 능력치 = 강화 능력 × 쿠키 진화 배율 × 전투 훈장 배율
              </Text>
              <Text style={styles.medalExplanation}>
                훈장 1개마다 클릭 +{BATTLE_REWARDS.clickPowerBonusPercentPerMedal}%, 자동 생산 +{BATTLE_REWARDS.autoProductionBonusPercentPerMedal}%, 성 체력 +{BATTLE_REWARDS.castleHealthBonusPercentPerMedal}%예요. 크리티컬·슈퍼 크리티컬·마그마·전기 조각도 최종 클릭 힘으로 보상을 계산해요.
              </Text>
              <Text style={styles.medalRewardRule}>
                미완료 스테이지 최초 승리마다 +{BATTLE_REWARDS.battleMedalsPerStageClear}개 · 완료한 전투 재도전은 추가 지급 없음
              </Text>
            </View>
          </Panel>
          <Panel style={styles.evolutionPanel}>
            <View style={styles.evolutionHeader}>
              <MaterialCommunityIcons name={evolution.next ? 'arrow-up-bold-hexagon-outline' : 'crown'} size={31} color={colors.purple} />
              <View style={styles.futureText}>
                <Text style={styles.futureTitle}>{evolution.next ? `다음 쿠키 · ${evolution.next.name}` : '최고 쿠키 진화 완료!'}</Text>
                <Text style={styles.futureDescription}>
                  {evolution.next
                    ? `현재 진화 Lv.${formatNumber(evolution.totalUpgradeLevels)} / 필요 Lv.${formatNumber(evolution.next.requiredTotalUpgradeLevels)} · ${formatNumber(evolution.remainingLevels)}번 남음`
                    : `현재 진화 Lv.${formatNumber(evolution.totalUpgradeLevels)} · 모든 쿠키 진화를 완료했어요!`}
                </Text>
              </View>
            </View>
            <Text style={styles.levelRule}>
              강화 화면의 쿠키 관련 7종을 강화할 때마다 진화 레벨이 올라요.
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${evolution.progressRatio * 100}%` }]} />
            </View>
          </Panel>
          <Text style={styles.collectionTitle}>쿠키 진화 도감 · {COOKIES.length}종</Text>
        </View>
      )}
      renderItem={({ item: cookie }) => {
        const unlocked = evolution.totalUpgradeLevels >= cookie.requiredTotalUpgradeLevels;
        const active = cookie.id === evolution.active.id;
        return (
          <Panel style={[styles.cookieCard, active && styles.activeCookieCard, !unlocked && styles.lockedCookieCard]}>
            <CookieImage imageKey={cookie.imageKey} size={68} style={!unlocked ? styles.lockedImage : undefined} />
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName}>{cookie.name}</Text>
                <View style={[styles.stateBadge, active && styles.activeBadge]}>
                  <Text style={[styles.stateText, active && styles.activeStateText]}>
                    {active ? '현재 쿠키' : unlocked ? '진화 완료' : `진화 Lv.${formatNumber(cookie.requiredTotalUpgradeLevels)}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>{cookie.description}</Text>
              <Text style={styles.cardBonus}>클릭·자동 생산·성 체력 ×{cookie.clickMultiplier.toFixed(2)}</Text>
            </View>
          </Panel>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 6, gap: 10, paddingBottom: 16 },
  header: { gap: 10 },
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
  medalPanel: { backgroundColor: '#FFF3C9' },
  medalHeader: { flexDirection: 'row', alignItems: 'center' },
  medalTextGroup: { flex: 1, marginLeft: 12 },
  medalTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.purple },
  medalDescription: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2 },
  medalSectionTitle: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.cookieDark, marginTop: 12, marginBottom: 2 },
  medalFormulaBox: { marginTop: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.68)', padding: 11, gap: 5 },
  medalFormula: { fontFamily: fonts.extraBold, fontSize: 11, lineHeight: 17, color: colors.purple, textAlign: 'center' },
  medalExplanation: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 16, color: colors.ink },
  medalRewardRule: { fontFamily: fonts.bold, fontSize: 9, lineHeight: 14, color: colors.greenDark },
  evolutionHeader: { flexDirection: 'row', alignItems: 'center' },
  futureText: { flex: 1, marginLeft: 13 },
  futureTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.purple },
  futureDescription: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 17, color: colors.ink },
  levelRule: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 9 },
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
