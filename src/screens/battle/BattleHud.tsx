import { Pressable, Text, View } from 'react-native';
import { BATTLE_UI } from '../../config';
import type { BattleEnemy, BattleStatus } from '../../engine/useBattleEngine';
import { BattleHealthBar } from '../../components/battle/BattleHealthBar';
import { formatNumber } from '../../utils/format';
import { styles } from './battleScreenStyles';

interface BattleHudProps {
  difficultyName: string;
  currentBattleNumber: number;
  requiredWins: number;
  remainingEnemyCount: number;
  displayedBoss?: BattleEnemy;
  status: BattleStatus;
  screenWidth: number;
  battleSpeedMultiplier: number;
  autoBattleEnabled: boolean;
  onCycleBattleSpeed: () => void;
  onToggleAutoBattle: () => void;
}

export function BattleHud({
  difficultyName,
  currentBattleNumber,
  requiredWins,
  remainingEnemyCount,
  displayedBoss,
  status,
  screenWidth,
  battleSpeedMultiplier,
  autoBattleEnabled,
  onCycleBattleSpeed,
  onToggleAutoBattle,
}: BattleHudProps) {
  return (
    <>
      <View style={styles.compactHud}>
        <Text style={styles.stageHud}>{difficultyName} · 전투 {currentBattleNumber}/{requiredWins}</Text>
        <View style={styles.battleControlGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`현재 전투 속도 ${battleSpeedMultiplier}배. 누르면 다음 속도`}
            onPress={(event) => {
              event.stopPropagation();
              onCycleBattleSpeed();
            }}
            style={({ pressed }) => [
              styles.battleSpeedButton,
              pressed && styles.battleSpeedButtonPressed,
            ]}
          >
            <Text style={styles.battleSpeedText}>X{battleSpeedMultiplier}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: autoBattleEnabled }}
            accessibilityLabel={`자동 전투 ${autoBattleEnabled ? '켜짐' : '꺼짐'}`}
            onPress={(event) => {
              event.stopPropagation();
              onToggleAutoBattle();
            }}
            style={({ pressed }) => [
              styles.autoBattleButton,
              autoBattleEnabled && styles.autoBattleButtonEnabled,
              pressed && styles.battleSpeedButtonPressed,
            ]}
          >
            <Text style={styles.autoBattleText}>
              자동 {autoBattleEnabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.enemyHud}>남은 보스 {remainingEnemyCount}</Text>
      </View>

      {displayedBoss && status === 'active' ? (
        <View
          pointerEvents="none"
          style={[
            styles.bossHealthHud,
            {
              top: BATTLE_UI.bossHealthHudTop,
              width: screenWidth * BATTLE_UI.bossHealthWidthRatio,
            },
          ]}
        >
          <View style={styles.bossHealthLabelRow}>
            <Text style={styles.bossHealthName}>{displayedBoss.name}</Text>
            <Text style={styles.bossHealthValue}>
              {formatNumber(displayedBoss.hp)} / {formatNumber(displayedBoss.maxHp)}
            </Text>
          </View>
          <BattleHealthBar
            value={displayedBoss.hp}
            max={displayedBoss.maxHp}
            width={screenWidth * BATTLE_UI.bossHealthWidthRatio}
            height={BATTLE_UI.bossHealthBarHeight}
          />
        </View>
      ) : null}
    </>
  );
}
