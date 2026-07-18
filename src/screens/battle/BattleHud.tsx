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
  onCycleBattleSpeed: () => void;
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
  onCycleBattleSpeed,
}: BattleHudProps) {
  return (
    <>
      <View style={styles.compactHud}>
        <Text style={styles.stageHud}>{difficultyName} · 전투 {currentBattleNumber}/{requiredWins}</Text>
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
