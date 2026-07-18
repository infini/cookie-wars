import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COOKIES } from '../config';
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
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Panel style={styles.heroCard}>
        <View style={styles.cookieHalo}><CookieImage size={116} /></View>
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>내 쿠키</Text>
          <Text style={styles.name}>{COOKIES[0].name}</Text>
          <Text style={styles.description}>{COOKIES[0].description}</Text>
        </View>
      </Panel>
      <Panel>
        <Text style={styles.sectionTitle}>쿠키 정보</Text>
        <InfoRow icon="cookie" label="현재 쿠키" value={`${formatNumber(state.cookies)}개`} />
        <InfoRow icon="gesture-tap" label="클릭당 획득" value={`${formatNumber(stats.clickPower)}개`} />
        <InfoRow icon="clock-fast" label="자동 획득" value={`${formatNumber(stats.autoProduction)}개/초`} />
        <InfoRow icon="star-circle" label="쿠키 레벨" value={`Lv.${stats.cookieLevel}`} />
      </Panel>
      <Panel style={styles.futureCard}>
        <MaterialCommunityIcons name="lock-clock" size={42} color={colors.purple} />
        <View style={styles.futureText}>
          <Text style={styles.futureTitle}>새 쿠키 준비 중!</Text>
          <Text style={styles.futureDescription}>앞으로 다양한 쿠키를 이곳에서 만날 수 있어요.</Text>
        </View>
      </Panel>
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
  futureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3ECFF' },
  futureText: { flex: 1, marginLeft: 13 },
  futureTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.purple },
  futureDescription: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
});
