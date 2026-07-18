import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSortedUpgradeProgress } from '../domain/gameSelectors';
import {
  calculateCookieCriticalStatsForLevel,
  formatCriticalChancePercent,
} from '../domain/cookieCritical';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { GameButton } from '../components/GameButton';
import { Panel } from '../components/Panel';
import { COOKIE_CRITICAL } from '../config';
import type { UpgradeConfig, UpgradeLevelConfig } from '../types/game';

const icons: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  clickPower: 'gesture-tap',
  cookieCritical: 'bomb',
  autoProduction: 'clock-fast',
  cookieHealth: 'shield-home',
};

function formatUpgradeValue(
  upgrade: UpgradeConfig,
  level: UpgradeLevelConfig,
): string {
  if (upgrade.id !== COOKIE_CRITICAL.upgradeId) {
    return `${formatNumber(level.value)} ${upgrade.unit}`;
  }
  const critical = calculateCookieCriticalStatsForLevel(level.level, level.value);
  return `${formatCriticalChancePercent(critical.chanceUnits)}% · ×${formatNumber(critical.rewardMultiplier)}`;
}

export function UpgradeScreen() {
  const { state, buyUpgrade } = useGame();
  const feedback = useFeedback();
  const sortedUpgrades = getSortedUpgradeProgress(state);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.help}>쿠키를 사용해서 더 강해져요!</Text>
      <Text style={styles.levelHelp}>진화 합계에는 저장된 이전 강화 레벨도 보존돼요.</Text>
      {sortedUpgrades.map((progress) => {
        const { config: upgrade, current, next, affordable } = progress;
        const handleUpgrade = () => {
          if (buyUpgrade(upgrade.id)) {
            feedback.play('upgrade'); feedback.success();
          } else {
            feedback.play('blocked'); feedback.error();
          }
        };
        return (
          <Panel key={upgrade.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}><MaterialCommunityIcons name={icons[upgrade.id]} size={29} color={colors.orange} /></View>
              <View style={styles.headerText}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={styles.description}>{upgrade.description}</Text>
              </View>
              <View style={styles.levelBadge}><Text style={styles.levelText}>Lv.{current.level}</Text></View>
            </View>
            <View style={styles.values}>
              <View style={styles.valueBox}>
                <Text style={styles.valueLabel}>현재 능력</Text>
                <Text style={styles.value}>{formatUpgradeValue(upgrade, current)}</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right-bold" size={24} color={next ? colors.green : colors.disabled} />
              <View style={[styles.valueBox, styles.nextBox]}>
                <Text style={styles.valueLabel}>다음 능력</Text>
                <Text style={styles.nextValue}>{next ? formatUpgradeValue(upgrade, next) : '최고 레벨'}</Text>
              </View>
            </View>
            <GameButton
              title={next ? `🍪 ${formatNumber(next.cost)}개로 강화` : '강화 완료!'}
              onPress={handleUpgrade}
              disabled={!next || !affordable}
              variant="green"
              compact
            />
          </Panel>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 6, paddingBottom: 18, gap: 10 },
  help: { fontFamily: fonts.display, fontSize: 20, color: colors.cookieDark, textAlign: 'center', marginVertical: 2 },
  levelHelp: { fontFamily: fonts.medium, fontSize: 9, color: colors.muted, textAlign: 'center', marginTop: -5 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconWrap: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#FFF0D8', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  upgradeName: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  description: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  levelBadge: { backgroundColor: '#EEE6FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.purple },
  values: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 11 },
  valueBox: { flex: 1, padding: 9, borderRadius: 13, backgroundColor: colors.cream },
  nextBox: { backgroundColor: '#E9FFF1' },
  valueLabel: { fontFamily: fonts.medium, fontSize: 9, color: colors.muted },
  value: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },
  nextValue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.greenDark },
});
