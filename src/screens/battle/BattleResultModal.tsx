import { Modal, Text, View } from 'react-native';
import { DIFFICULTIES } from '../../config';
import type { BattleStatus } from '../../engine/useBattleEngine';
import type { BattleRewardResult } from '../../types/game';
import { DiscImage } from '../../components/DiscImage';
import { GameButton } from '../../components/GameButton';
import { styles } from './battleScreenStyles';

interface BattleResultModalProps {
  status: BattleStatus;
  difficultyId: string;
  rewardResult: BattleRewardResult | null;
  onLeave: () => void;
  onStart: () => void;
}

export function BattleResultModal({
  status,
  difficultyId,
  rewardResult,
  onLeave,
  onStart,
}: BattleResultModalProps) {
  const victory = status === 'victory';
  const rewardPending = victory && rewardResult === null;
  return (
    <Modal visible={victory || status === 'defeat'} transparent animationType="fade">
      <View style={styles.resultOverlay}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{victory ? '🏆' : '💫'}</Text>
          <Text style={[styles.resultTitle, status === 'defeat' && styles.defeatTitle]}>
            {victory ? '전투 승리!' : '다시 도전해요!'}
          </Text>
          {victory ? (
            <View style={[styles.rewardBox, rewardResult && !rewardResult.firstClear && styles.replayBox]}>
              <DiscImage size={44} />
              <View>
                <Text style={styles.rewardLabel}>
                  {rewardPending
                    ? '보상 확인 중'
                    : rewardResult?.firstClear
                      ? `전투 ${rewardResult.stageNumber} 최초 보상`
                      : `전투 ${rewardResult?.stageNumber ?? ''} 이미 받은 보상`}
                </Text>
                <Text style={styles.rewardValue}>
                  {rewardPending
                    ? '잠시만 기다려 주세요'
                    : rewardResult?.firstClear
                      ? `거대 원반 +${rewardResult.giantDiscReward}`
                      : '추가 거대 원반 없음'}
                </Text>
              </View>
            </View>
          ) : <Text style={styles.defeatText}>쿠키를 더 모아 강화하고 다시 도전해 보세요.</Text>}
          {victory && rewardResult ? (
            <Text style={styles.progressText}>이 난이도 승리 {rewardResult.difficultyWins}/{rewardResult.winsRequired}</Text>
          ) : null}
          {victory && difficultyId !== DIFFICULTIES[DIFFICULTIES.length - 1].id && rewardResult?.unlockedNextDifficulty ? (
            <Text style={styles.unlockText}>다음 난이도가 열렸어요!</Text>
          ) : null}
          <View style={styles.resultButtonRow}>
            <GameButton
              title="로비 이동"
              onPress={onLeave}
              disabled={rewardPending}
              variant="orange"
              style={styles.resultButton}
            />
            <GameButton
              title={victory ? '다음 전투' : '다시 전투'}
              onPress={onStart}
              disabled={rewardPending}
              variant="green"
              style={styles.resultButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
