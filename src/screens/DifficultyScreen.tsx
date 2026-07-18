import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDifficulty } from '../config';
import { DifficultyDropdown } from '../components/DifficultyDropdown';
import { Panel } from '../components/Panel';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber, formatPercent } from '../utils/format';

function Detail({ icon, label, value, tint }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string; tint: string }) {
  return (
    <View style={styles.detail}>
      <View style={[styles.detailIcon, { backgroundColor: `${tint}1F` }]}>
        <MaterialCommunityIcons name={icon} size={25} color={tint} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function DifficultyScreen() {
  const { state, setDifficulty } = useGame();
  const feedback = useFeedback();
  const selected = getDifficulty(state.selectedDifficultyId);
  const rewardReceived = state.rewardClaimedDifficultyIds.includes(selected.id);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.help}>도전할 난이도를 골라요</Text>
      <DifficultyDropdown
        selectedId={selected.id}
        highestUnlockedIndex={state.highestUnlockedDifficultyIndex}
        onSelect={(id) => {
          if (setDifficulty(id)) { feedback.play('menu'); feedback.tap(); }
        }}
      />
      <Panel>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.eyebrow}>전투 정보</Text>
            <Text style={styles.name}>{selected.name}</Text>
          </View>
          <View style={styles.stageBadge}>
            <MaterialCommunityIcons name="flag-checkered" size={20} color={colors.white} />
            <Text style={styles.stageText}>단계 {state.highestUnlockedDifficultyIndex + 1}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <Detail icon="account-group" label="적 수" value={`${selected.enemyCount}마리`} tint={colors.red} />
          <Detail icon="disc" label="적 원반" value={`Lv.${selected.enemyDiscLevel}`} tint={colors.purple} />
          <Detail icon="robot-angry" label="회피 확률" value={formatPercent(selected.dodgeChance)} tint={colors.blue} />
          <Detail icon="heart-pulse" label="적 체력" value={`× ${selected.hpMultiplier}`} tint={colors.orange} />
        </View>
      </Panel>
      <Panel style={[styles.rewardCard, rewardReceived && styles.rewardDone]}>
        <View style={styles.rewardIcon}>
          <MaterialCommunityIcons name={rewardReceived ? 'check-bold' : 'gift'} size={32} color={rewardReceived ? colors.greenDark : colors.yellowDark} />
        </View>
        <View style={styles.rewardText}>
          <Text style={styles.rewardTitle}>{rewardReceived ? '최초 승리 보상 받음' : '최초 승리 보상'}</Text>
          <Text style={styles.rewardDescription}>
            {rewardReceived ? '다시 플레이할 수 있지만 쿠키 보상은 없어요.' : `처음 이기면 쿠키 ${formatNumber(selected.reward)}개를 받아요!`}
          </Text>
        </View>
      </Panel>
      <View style={styles.tip}>
        <MaterialCommunityIcons name="lightbulb-on" size={24} color={colors.yellowDark} />
        <Text style={styles.tipText}>난이도가 높을수록 적이 많아지고, 원반이 강해지며, 더 영리하게 피합니다.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 7, paddingBottom: 18, gap: 11 },
  help: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, color: colors.muted },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.purple },
  stageBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: colors.purple, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  stageText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.white },
  details: { gap: 4 },
  detail: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 },
  detailIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  detailValue: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2C9' },
  rewardDone: { backgroundColor: '#E6FAED' },
  rewardIcon: { width: 53, height: 53, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  rewardText: { flex: 1, marginLeft: 12 },
  rewardTitle: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  rewardDescription: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.muted },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10 },
  tipText: { flex: 1, fontFamily: fonts.medium, fontSize: 11, lineHeight: 17, color: colors.muted },
});
