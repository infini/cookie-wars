import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, PROGRESSION } from '../config';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface DifficultyDropdownProps {
  selectedId: string;
  highestUnlockedIndex: number;
  onSelect: (id: string) => void;
}

export function DifficultyDropdown({
  selectedId,
  highestUnlockedIndex,
  onSelect,
}: DifficultyDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = DIFFICULTIES.find((item) => item.id === selectedId) ?? DIFFICULTIES[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`난이도 선택, 현재 ${selected.name}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="stairs-up" size={28} color={colors.purple} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.caption}>선택한 난이도</Text>
          <Text style={styles.selected}>{selected.name}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={30} color={colors.ink} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>난이도 선택</Text>
                <Text style={styles.listSubtitle}>
                  각 난이도 {PROGRESSION.winsToUnlockNextDifficulty}승으로 다음 단계 해금
                </Text>
              </View>
              <Pressable accessibilityLabel="난이도 목록 닫기" onPress={() => setOpen(false)}>
                <MaterialCommunityIcons name="close-circle" size={34} color={colors.muted} />
              </Pressable>
            </View>
            <FlatList
              data={DIFFICULTIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => {
                const locked = index > highestUnlockedIndex;
                const active = item.id === selectedId;
                return (
                  <Pressable
                    disabled={locked}
                    onPress={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    style={[styles.option, active && styles.optionActive, locked && styles.optionLocked]}
                  >
                    <View style={[styles.number, active && styles.numberActive]}>
                      <Text style={[styles.numberText, active && styles.numberTextActive]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.optionText, locked && styles.lockedText]}>{item.name}</Text>
                    <MaterialCommunityIcons
                      name={locked ? 'lock' : active ? 'check-circle' : 'lock-open-variant'}
                      size={22}
                      color={locked ? colors.disabled : active ? colors.green : colors.muted}
                    />
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
    borderRadius: 22,
    padding: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EFE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  caption: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  selected: { fontFamily: fonts.display, fontSize: 25, color: colors.ink },
  pressed: { transform: [{ scale: 0.985 }] },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 18 },
  listCard: {
    maxHeight: '78%',
    backgroundColor: colors.cream,
    borderRadius: 25,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.white,
  },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontFamily: fonts.display, fontSize: 27, color: colors.ink },
  listSubtitle: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  listContent: { gap: 7, paddingBottom: 4 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: { borderColor: colors.green, backgroundColor: '#E9FFF1' },
  optionLocked: { opacity: 0.52 },
  number: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  numberActive: { backgroundColor: colors.green },
  numberText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.cookieDark },
  numberTextActive: { color: colors.white },
  optionText: { flex: 1, fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  lockedText: { color: colors.muted },
});
