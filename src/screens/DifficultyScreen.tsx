import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, getDifficulty } from '../config';
import { DifficultyDropdown } from '../components/DifficultyDropdown';
import { getBattleDifficulty, getBattleStageId, getDifficultyProgress } from '../domain/gameSelectors';
import { Panel } from '../components/Panel';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';

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
  const selectedIndex = DIFFICULTIES.findIndex((difficulty) => difficulty.id === selected.id);
  const isLastDifficulty = selectedIndex === DIFFICULTIES.length - 1;
  const progress = getDifficultyProgress(state, selected.id);
  const battleDifficulty = getBattleDifficulty(selected, progress.wins);
  const rewardReceived = state.rewardClaimedStageIds.includes(
    getBattleStageId(selected.id, progress.currentBattleNumber),
  );

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
            <Text style={styles.stageText}>전투 {progress.currentBattleNumber}/{progress.requiredWins}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <Detail icon="account-group" label="현재 적 수" value={`${battleDifficulty.enemyCount}마리`} tint={colors.red} />
          <Detail icon="disc" label="현재 적 원반" value={`Lv.${battleDifficulty.enemyDiscLevel}`} tint={colors.purple} />
          <Detail icon="run-fast" label="현재 이동 속도" value={battleDifficulty.moveSpeed.toFixed(1)} tint={colors.blue} />
          <Detail icon="heart-pulse" label="현재 적 체력" value={`× ${battleDifficulty.hpMultiplier.toFixed(2)}`} tint={colors.orange} />
        </View>
      </Panel>
      <Panel style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>{isLastDifficulty ? '최고 난이도 기록' : '다음 난이도 해금'}</Text>
            <Text style={styles.progressDescription}>
              {isLastDifficulty
                ? '마지막 난이도의 승리 기록이에요'
                : `이 난이도에서 ${progress.requiredWins}번 승리하면 열려요`}
            </Text>
          </View>
          <Text style={styles.progressValue}>{progress.wins}/{progress.requiredWins}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, progress.wins / progress.requiredWins * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressRemaining}>
          {isLastDifficulty
            ? `총 ${progress.wins}번 승리했어요.`
            : progress.completed
              ? '해금 조건 완료!'
              : `${progress.remainingWins}번 더 승리하면 돼요.`}
        </Text>
      </Panel>
      <Panel style={[styles.rewardCard, rewardReceived && styles.rewardDone]}>
        <View style={styles.rewardIcon}>
          <MaterialCommunityIcons name={rewardReceived ? 'check-bold' : 'gift'} size={32} color={rewardReceived ? colors.greenDark : colors.yellowDark} />
        </View>
        <View style={styles.rewardText}>
          <Text style={styles.rewardTitle}>{rewardReceived ? `전투 ${progress.currentBattleNumber} 보상 받음` : `전투 ${progress.currentBattleNumber} 최초 보상`}</Text>
          <Text style={styles.rewardDescription}>
            {rewardReceived ? '이 전투를 다시 이겨도 쿠키 보상은 없어요.' : `처음 클리어하면 쿠키 ${formatNumber(selected.reward)}개를 받아요!`}
          </Text>
        </View>
      </Panel>
      <View style={styles.tip}>
        <MaterialCommunityIcons name="lightbulb-on" size={24} color={colors.yellowDark} />
        <Text style={styles.tipText}>같은 난이도도 승리할 때마다 다음 전투의 적이 강해져요. 일정 승수마다 적 수와 적 원반 레벨도 올라갑니다.</Text>
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
  progressCard: { backgroundColor: colors.blueSoft },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  progressDescription: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, marginTop: 2 },
  progressValue: { fontFamily: fonts.display, fontSize: 23, color: colors.blueDark },
  progressTrack: { height: 13, borderRadius: 7, backgroundColor: colors.white, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 7, backgroundColor: colors.blue },
  progressRemaining: { fontFamily: fonts.bold, fontSize: 10, color: colors.blueDark, marginTop: 6, textAlign: 'right' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10 },
  tipText: { flex: 1, fontFamily: fonts.medium, fontSize: 11, lineHeight: 17, color: colors.muted },
});
