import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';
import type { DifficultyProgress } from '../../domain/gameSelectors';
import type { DifficultyConfig } from '../../types/game';
import { GameButton } from '../../components/GameButton';
import { colors } from '../../theme/colors';
import { styles } from './battleScreenStyles';

interface BattleReadyOverlayProps {
  visible: boolean;
  difficulty: DifficultyConfig;
  difficultyProgress: DifficultyProgress;
  hasWeapon: boolean;
  onStart: () => void;
}

export function BattleReadyOverlay({
  visible,
  difficulty,
  difficultyProgress,
  hasWeapon,
  onStart,
}: BattleReadyOverlayProps) {
  if (!visible) return null;
  return (
    <View style={styles.startOverlay}>
      <MaterialCommunityIcons name="castle" size={52} color={colors.red} />
      <Text style={styles.readyTitle}>쿠키 성 방어전</Text>
      <Text style={styles.readyText}>거대한 보스 한 마리가 쿠키 성을 노려요!</Text>
      <Text style={styles.autoReadyText}>쿠키봇은 자동 공격 · 전투 화면을 누르면 성이 2배 공격</Text>
      <Text style={styles.battleProgressText}>
        {difficulty.name} 전투 {difficultyProgress.currentBattleNumber}/{difficultyProgress.requiredWins} · 승리 {difficultyProgress.wins}회
      </Text>
      <GameButton
        title={hasWeapon ? '전투 시작' : '무기가 필요해요'}
        onPress={onStart}
        disabled={!hasWeapon}
        variant="red"
        style={styles.startButton}
      />
      {!hasWeapon ? <Text style={styles.weaponHint}>장착할 원반과 쿠키봇을 하나씩 준비하세요.</Text> : null}
    </View>
  );
}
