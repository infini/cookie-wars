import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MONSTERS } from '../config';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { MonsterSprite } from '../components/MonsterSprite';
import { Panel } from '../components/Panel';

export function MonsterScreen() {
  const { state, acknowledgeMonsters } = useGame();
  useEffect(() => {
    const timer = setTimeout(acknowledgeMonsters, 700);
    return () => clearTimeout(timer);
  }, [acknowledgeMonsters]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>몬스터 도감</Text>
        <Text style={styles.count}>{state.discoveredMonsterIds.length}/{MONSTERS.length} 발견</Text>
      </View>
      {MONSTERS.map((monster) => {
        const unlocked = state.discoveredMonsterIds.includes(monster.id);
        const isNew = state.newMonsterIds.includes(monster.id);
        return (
          <Panel key={monster.id} style={[styles.card, !unlocked && styles.lockedCard]}>
            <View style={styles.spriteWrap}>
              {unlocked ? <MonsterSprite imageKey={monster.imageKey} size={92} /> : <MaterialCommunityIcons name="help" size={58} color={colors.disabled} />}
              {isNew ? <View style={styles.newBadge}><Text style={styles.newText}>NEW</Text></View> : null}
            </View>
            <View style={styles.monsterInfo}>
              <Text style={[styles.name, !unlocked && styles.lockedText]}>{unlocked ? monster.name : '?????'}</Text>
              {unlocked ? (
                <>
                  <Text style={styles.rank}>{monster.rank}</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.stat}>❤️ 체력 {monster.baseHp}</Text>
                    <Text style={styles.stat}>⚔️ 공격 {monster.baseAttack}</Text>
                  </View>
                  <Text style={styles.description}>{monster.description}</Text>
                </>
              ) : <Text style={styles.hint}>전투에서 만나면 정보가 열려요.</Text>}
            </View>
          </Panel>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 7, paddingBottom: 18, gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  heading: { fontFamily: fonts.display, fontSize: 23, color: colors.ink },
  count: { fontFamily: fonts.bold, fontSize: 11, color: colors.purple },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 140 },
  lockedCard: { backgroundColor: '#F2EFED' },
  spriteWrap: { width: 112, height: 112, borderRadius: 28, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  newBadge: { position: 'absolute', top: -6, left: -6, backgroundColor: colors.red, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, transform: [{ rotate: '-8deg' }] },
  newText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.white },
  monsterInfo: { flex: 1, marginLeft: 13 },
  name: { fontFamily: fonts.display, fontSize: 21, color: colors.redDark },
  rank: { alignSelf: 'flex-start', marginTop: 2, fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: colors.red, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 },
  lockedText: { color: colors.muted },
  statRow: { flexDirection: 'row', gap: 10, marginVertical: 6 },
  stat: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.ink },
  description: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.muted },
  hint: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, marginTop: 7 },
});
