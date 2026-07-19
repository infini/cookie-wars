import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, View } from 'react-native';
import { BATTLE_FEEDBACK, BATTLE_UI, GIANT_DISC } from '../../config';
import type { BattleStatus } from '../../engine/useBattleEngine';
import { BattleHealthBar } from '../../components/battle/BattleHealthBar';
import { CookieCastle } from '../../components/CookieCastle';
import { colors } from '../../theme/colors';
import { formatNumber } from '../../utils/format';
import { styles } from './battleScreenStyles';

interface GiantDiscButtonProps {
  status: BattleStatus;
  giantDiscCount: number;
  canThrow: boolean;
  onThrow: () => void;
}

export function GiantDiscButton({
  status,
  giantDiscCount,
  canThrow,
  onThrow,
}: GiantDiscButtonProps) {
  if (status !== 'active') return null;
  const disabled = giantDiscCount <= 0 || !canThrow;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`거대 원반 사용, ${giantDiscCount}개 보유`}
      accessibilityState={{ disabled }}
      onPress={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onThrow();
      }}
      style={({ pressed }) => [
        styles.giantDiscButton,
        { top: BATTLE_UI.giantDiscButtonTop },
        {
          backgroundColor: disabled
            ? GIANT_DISC.buttonDisabledColor
            : GIANT_DISC.buttonBackgroundColor,
          borderColor: GIANT_DISC.buttonBorderColor,
          shadowColor: GIANT_DISC.buttonBorderColor,
        },
        disabled && styles.giantDiscButtonDisabled,
        pressed && styles.giantDiscButtonPressed,
      ]}
    >
      <MaterialCommunityIcons name="disc" size={28} color={colors.white} />
      <View>
        <Text style={styles.giantDiscButtonTitle}>거대 원반</Text>
        <Text style={[styles.giantDiscButtonCount, { color: GIANT_DISC.buttonCountColor }]}>보유 {formatNumber(giantDiscCount)}개 · {formatNumber(GIANT_DISC.damageMultiplier)}배</Text>
      </View>
    </Pressable>
  );
}

interface CookieCastleControlProps {
  status: BattleStatus;
  canThrow: boolean;
  baseHealth: number;
  maxHealth: number;
  cookieImageKey: string;
  castleHitVisible: boolean;
  castleHitWave: number;
  castleHitShake: number;
  onThrow: () => void;
}

export function CookieCastleControl({
  status,
  canThrow,
  baseHealth,
  maxHealth,
  cookieImageKey,
  castleHitVisible,
  castleHitWave,
  castleHitShake,
  onThrow,
}: CookieCastleControlProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="쿠키 성 원반 던지기"
      accessibilityHint="전투 화면을 누르면 쿠키봇 원반의 두 배 피해로 공격합니다"
      disabled={!canThrow}
      onPress={(event) => {
        event.stopPropagation();
        onThrow();
      }}
      style={({ pressed }) => [
        styles.core,
        {
          width: BATTLE_UI.castleTouchWidth,
          marginLeft: -BATTLE_UI.castleTouchWidth / 2,
          transform: [
            { translateX: castleHitShake },
            { scale: castleHitVisible
              ? 1 - (1 - BATTLE_FEEDBACK.castleHitScale) * castleHitWave
              : 1 },
          ],
        },
        status === 'active' && canThrow && styles.coreReady,
        pressed && canThrow && styles.corePressed,
      ]}
    >
      <Text style={styles.allyName}>쿠키 성</Text>
      <BattleHealthBar
        value={status === 'idle' ? maxHealth : baseHealth}
        max={maxHealth}
        width={BATTLE_UI.castleHealthWidth}
      />
      <CookieCastle size={BATTLE_UI.castleRenderSize} cookieImageKey={cookieImageKey} grounded />
    </Pressable>
  );
}
