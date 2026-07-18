import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AUDIO_SETTINGS } from '../config';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { SoundVolumeLevel } from '../types/game';
import { Panel } from './Panel';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <View style={[styles.toggle, enabled && styles.toggleOn]}>
      <View style={[styles.knob, enabled && styles.knobOn]} />
    </View>
  );
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { state, toggleSound, setSoundVolume, toggleVibration } = useGame();
  const feedback = useFeedback();
  const changeVolume = (level: SoundVolumeLevel) => {
    setSoundVolume(level);
    setTimeout(() => feedback.play('cookie'), AUDIO_SETTINGS.previewDelayMs);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Panel style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>설정</Text>
              <Text style={styles.subtitle}>내가 편한 대로 바꿔요</Text>
            </View>
            <Pressable accessibilityLabel="설정 닫기" onPress={onClose} style={styles.close}>
              <MaterialCommunityIcons name="close" size={28} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable onPress={toggleSound} style={styles.settingRow}>
            <MaterialCommunityIcons
              name={state.soundEnabled ? 'volume-high' : 'volume-off'}
              size={28}
              color={colors.purple}
            />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>사운드</Text>
              <Text style={styles.settingDescription}>효과음과 전투 소리</Text>
            </View>
            <Toggle enabled={state.soundEnabled} />
          </Pressable>
          <View style={styles.volumeCard}>
            <View style={styles.volumeHeader}>
              <MaterialCommunityIcons name="volume-medium" size={25} color={colors.orange} />
              <View>
                <Text style={styles.settingTitle}>효과음 크기</Text>
                <Text style={styles.settingDescription}>현재 {state.soundVolumeLevel}단계 · 눌러서 미리 들어보세요</Text>
              </View>
            </View>
            <View style={styles.volumeLevels}>
              {AUDIO_SETTINGS.levels.map(({ level }) => {
                const selected = state.soundVolumeLevel === level;
                return (
                  <Pressable
                    key={level}
                    accessibilityRole="button"
                    accessibilityLabel={`효과음 볼륨 ${level}단계`}
                    accessibilityState={{ selected }}
                    onPress={() => changeVolume(level)}
                    style={({ pressed }) => [
                      styles.volumeButton,
                      selected && styles.volumeButtonSelected,
                      pressed && styles.volumeButtonPressed,
                    ]}
                  >
                    <Text style={[styles.volumeNumber, selected && styles.volumeNumberSelected]}>{level}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.volumeLabels}>
              <Text style={styles.volumeLabel}>작게</Text>
              <Text style={styles.volumeLabel}>크게</Text>
            </View>
          </View>
          <Pressable onPress={toggleVibration} style={styles.settingRow}>
            <MaterialCommunityIcons
              name={state.vibrationEnabled ? 'vibrate' : 'vibrate-off'}
              size={28}
              color={colors.blue}
            />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>진동</Text>
              <Text style={styles.settingDescription}>쿠키를 누를 때 약한 진동</Text>
            </View>
            <Toggle enabled={state.vibrationEnabled} />
          </Pressable>
          <ScrollView style={styles.creditBox} contentContainerStyle={styles.creditContent}>
            <Text style={styles.creditTitle}>무료 에셋 출처</Text>
            <Text style={styles.creditText}>
              캐릭터·UI·사운드: Kenney (CC0){'\n'}
              쿠키·원반 이미지: Google Noto Emoji (Apache 2.0){'\n'}
              글꼴: Jua (SIL OFL), Android 시스템 글꼴
            </Text>
          </ScrollView>
          <Text style={styles.saveText}>게임 진행은 자동으로 저장돼요.</Text>
        </Panel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 },
  modal: { maxHeight: '82%', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  close: {
    marginLeft: 'auto',
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: colors.cream,
    padding: 14,
    marginBottom: 10,
  },
  settingText: { flex: 1 },
  settingTitle: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  settingDescription: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  volumeCard: {
    borderRadius: 18,
    backgroundColor: '#FFF0D9',
    padding: 13,
    marginBottom: 10,
  },
  volumeHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  volumeLevels: { flexDirection: 'row', gap: 7 },
  volumeButton: {
    flex: 1,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButtonSelected: { backgroundColor: colors.orange, borderColor: colors.orange },
  volumeButtonPressed: { transform: [{ scale: 0.94 }] },
  volumeNumber: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.muted },
  volumeNumberSelected: { color: colors.white },
  volumeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  volumeLabel: { fontFamily: fonts.medium, fontSize: 9, color: colors.muted },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    backgroundColor: colors.disabled,
  },
  toggleOn: { backgroundColor: colors.green },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end' },
  creditBox: { maxHeight: 112, backgroundColor: colors.blueSoft, borderRadius: 16, marginTop: 4 },
  creditContent: { padding: 12 },
  creditTitle: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blueDark },
  creditText: { marginTop: 4, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, color: colors.ink },
  saveText: { fontFamily: fonts.bold, fontSize: 12, color: colors.greenDark, textAlign: 'center', marginTop: 14 },
});
