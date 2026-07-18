import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BATTLE_RULES,
  BATTLE_UI,
  DIFFICULTIES,
  getCookie,
  getDifficulty,
  getEnemyWaveMonsterIds,
} from '../config';
import {
  getActiveBots,
  getBattleDifficulty,
  getDifficultyProgress,
  getDiscProgress,
} from '../domain/gameSelectors';
import { BattleEventKind, useBattleEngine } from '../engine/useBattleEngine';
import { BotImage } from '../components/BotImage';
import { CookieImage } from '../components/CookieImage';
import { CookieCastle } from '../components/CookieCastle';
import { DiscImage } from '../components/DiscImage';
import { GameButton } from '../components/GameButton';
import { MonsterSprite } from '../components/MonsterSprite';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { BattleRewardResult } from '../types/game';
import { formatNumber } from '../utils/format';

export function getHealthColor(value: number, max: number): string {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const hue = BATTLE_UI.healthBarLowHue
    + (BATTLE_UI.healthBarHighHue - BATTLE_UI.healthBarLowHue) * ratio;
  return `hsl(${Math.round(hue)}, ${BATTLE_UI.healthBarSaturationPercent}%, ${BATTLE_UI.healthBarLightnessPercent}%)`;
}

function getPerspectiveScale(y: number): number {
  const progress = Math.max(0, Math.min(1, (
    y - BATTLE_UI.unitPerspectiveFarY
  ) / (
    BATTLE_UI.unitPerspectiveNearY - BATTLE_UI.unitPerspectiveFarY
  )));
  return BATTLE_UI.unitPerspectiveFarScale
    + (BATTLE_UI.unitPerspectiveNearScale - BATTLE_UI.unitPerspectiveFarScale) * progress;
}

function HealthBar({ value, max, width }: { value: number; max: number; width: number }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View
      style={[
        styles.healthTrack,
        {
          width,
          height: BATTLE_UI.healthBarHeight,
          borderWidth: BATTLE_UI.healthBarOutlineWidth,
          borderColor: BATTLE_UI.healthBarOutlineColor,
          backgroundColor: BATTLE_UI.healthBarTrackColor,
        },
      ]}
    >
      <View
        style={[
          styles.healthFill,
          { width: `${ratio * 100}%`, backgroundColor: getHealthColor(value, max) },
        ]}
      />
    </View>
  );
}

interface BattleScreenProps {
  onReturnToGame: () => void;
}

export function BattleScreen({ onReturnToGame }: BattleScreenProps) {
  const { state: game, stats, discoverMonster, completeBattle } = useGame();
  const feedback = useFeedback();
  const baseDifficulty = getDifficulty(game.selectedDifficultyId);
  const difficultyProgress = getDifficultyProgress(game, baseDifficulty.id);
  const difficulty = useMemo(
    () => getBattleDifficulty(baseDifficulty, difficultyProgress.wins),
    [baseDifficulty, difficultyProgress.wins],
  );
  const activeCookie = getCookie(stats.activeCookieId);
  const discProgress = getDiscProgress(game);
  const playerDisc = discProgress.current;
  const activeBots = useMemo(() => getActiveBots(game), [game.botCounts]);
  const [rewardResult, setRewardResult] = useState<BattleRewardResult | null>(null);
  const handledResult = useRef(false);

  const onEvent = useCallback((kind: BattleEventKind) => {
    if (kind === 'disc') feedback.play('disc');
    if (kind === 'hit') feedback.play('hit');
    if (kind === 'enemyDefeated') feedback.play('enemyDefeated');
    if (kind === 'victory') {
      feedback.stopBattleSounds();
      feedback.success();
    }
    if (kind === 'defeat') {
      feedback.stopBattleSounds();
      feedback.error();
    }
  }, [feedback]);

  const engine = useBattleEngine({
    difficulty,
    playerDisc,
    discAvailable: discProgress.owned,
    bots: activeBots,
    maxHealth: stats.maxHealth,
    onEvent,
  });

  useEffect(() => {
    if (engine.state.status === 'victory' && !handledResult.current) {
      handledResult.current = true;
      setRewardResult(completeBattle(difficulty.id));
    }
  }, [completeBattle, difficulty.id, engine.state.status]);

  useEffect(() => {
    if (engine.state.status !== 'active') feedback.stopBattleSounds();
  }, [engine.state.status, feedback.stopBattleSounds]);

  useEffect(() => () => {
    feedback.stopBattleSounds();
  }, [feedback.stopBattleSounds]);

  const startBattle = () => {
    feedback.stopBattleSounds();
    handledResult.current = false;
    setRewardResult(null);
    getEnemyWaveMonsterIds(difficulty.enemyWaveId).forEach(discoverMonster);
    engine.start();
    feedback.play('menu');
    feedback.tap();
  };

  const leaveBattle = () => {
    feedback.stopBattleSounds();
    engine.reset();
    setRewardResult(null);
    onReturnToGame();
  };

  const remainingEnemyCount = useMemo(() => engine.state.enemies.filter(
    (enemy) => enemy.hp > 0,
  ).length, [engine.state.enemies]);
  const hasWeapon = discProgress.owned && activeBots.length > 0;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/maps/battle-map-medieval.png')}
        resizeMode="cover"
        style={styles.field}
        imageStyle={styles.mapImage}
      >
        <View style={styles.compactHud} pointerEvents="none">
          <Text style={styles.stageHud}>{difficulty.name} · 전투 {difficultyProgress.currentBattleNumber}/{difficultyProgress.requiredWins}</Text>
          <Text style={styles.enemyHud}>남은 적 {remainingEnemyCount}</Text>
        </View>

        {engine.state.enemies.map((enemy) => {
          if (enemy.hp <= 0 || enemy.spawnAt > engine.state.now) return null;
          const renderSize = Math.max(
            BATTLE_UI.enemyMinimumRenderSize,
            Math.min(
              BATTLE_UI.enemyMaximumRenderSize,
              BATTLE_UI.enemyBaseRenderSize
                * enemy.sizeMultiplier
                * getPerspectiveScale(enemy.y),
            ),
          );
          return (
            <View
              key={enemy.id}
              style={[
                styles.enemy,
                {
                  left: `${enemy.x * 100}%`,
                  top: `${enemy.y * 100}%`,
                  width: BATTLE_UI.enemyLabelWidth,
                  marginLeft: -BATTLE_UI.enemyLabelWidth / 2,
                  marginTop: -(renderSize + BATTLE_UI.enemyAnchorLabelOffset),
                  zIndex: Math.round(enemy.y * 1000),
                },
              ]}
            >
              <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
              <HealthBar value={enemy.hp} max={enemy.maxHp} width={BATTLE_UI.enemyHealthWidth} />
              <MonsterSprite imageKey={enemy.imageKey} size={renderSize} grounded />
            </View>
          );
        })}

        {engine.state.enemyProjectiles.map((projectile) => (
          <View
            key={projectile.id}
            style={[
              styles.projectile,
              styles.enemyProjectile,
              {
                left: `${projectile.x * 100}%`,
                top: `${projectile.y * 100}%`,
                width: projectile.size,
                height: projectile.size,
                marginLeft: -projectile.size / 2,
                marginTop: -projectile.size / 2,
                transform: [{ rotate: `${((engine.state.now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` }],
              },
            ]}
          >
            <DiscImage size={projectile.size - 4} team="enemy" />
          </View>
        ))}

        {engine.state.playerProjectiles.map((projectile) => {
          const renderedMaximum = projectile.source === 'bot'
            ? BATTLE_RULES.maxRenderedPlayerDiscSize * BATTLE_RULES.botDiscSizeMultiplier
            : BATTLE_RULES.maxRenderedPlayerDiscSize;
          const renderedSize = Math.min(projectile.size, renderedMaximum);
          return (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                projectile.source === 'castle' && styles.castleProjectile,
                {
                  left: `${projectile.x * 100}%`,
                  top: `${projectile.y * 100}%`,
                  marginLeft: -renderedSize / 2,
                  marginTop: -renderedSize / 2,
                  transform: [{ rotate: `${((engine.state.now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` }],
                },
              ]}
            >
              {projectile.source === 'castle' ? <Text style={styles.doubleDamage}>2배</Text> : null}
              <DiscImage size={renderedSize} />
            </View>
          );
        })}

        {engine.state.notice ? <Text style={styles.notice}>{engine.state.notice}</Text> : null}

        {activeBots.map((bot, index) => {
          const slot = BATTLE_RULES.botFormationSlots[index % BATTLE_RULES.botFormationSlots.length];
          return (
            <View
              key={bot.config.id}
              style={[
                styles.bot,
                {
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: BATTLE_UI.botLabelWidth,
                  marginLeft: -BATTLE_UI.botLabelWidth / 2,
                  marginTop: -(
                    BATTLE_UI.botRenderSize * getPerspectiveScale(slot.y)
                    + BATTLE_UI.enemyAnchorLabelOffset
                  ),
                  zIndex: Math.round(slot.y * 1000),
                },
              ]}
            >
              <Text style={[styles.allyName, styles.botName]} numberOfLines={1}>
                {bot.config.name}{bot.count > 1 ? ` ×${bot.count}` : ''}
              </Text>
              <BotImage size={BATTLE_UI.botRenderSize * getPerspectiveScale(slot.y)} grounded />
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="쿠키 성 원반 던지기"
          accessibilityHint="전투 중 누를 때만 쿠키봇 원반의 두 배 피해로 공격합니다"
          disabled={!engine.canCastleThrow}
          onPress={() => {
            if (engine.throwCastleDisc()) feedback.tap();
          }}
          style={({ pressed }) => [
            styles.core,
            { width: BATTLE_UI.castleTouchWidth, marginLeft: -BATTLE_UI.castleTouchWidth / 2 },
            engine.state.status === 'active' && engine.canCastleThrow && styles.coreReady,
            pressed && engine.canCastleThrow && styles.corePressed,
          ]}
        >
          <Text style={styles.allyName}>쿠키 성</Text>
          <HealthBar
            value={engine.state.status === 'idle' ? stats.maxHealth : engine.state.baseHealth}
            max={stats.maxHealth}
            width={BATTLE_UI.castleHealthWidth}
          />
          <CookieCastle size={BATTLE_UI.castleRenderSize} cookieImageKey={activeCookie.imageKey} grounded />
        </Pressable>

        {engine.state.status === 'idle' ? (
          <View style={styles.startOverlay}>
            <MaterialCommunityIcons name="castle" size={52} color={colors.red} />
            <Text style={styles.readyTitle}>쿠키 성 방어전</Text>
            <Text style={styles.readyText}>적 {difficulty.enemyCount}마리가 끊임없이 침공해요!</Text>
            <Text style={styles.autoReadyText}>쿠키봇은 자동 공격 · 쿠키 성은 누를 때만 2배 공격</Text>
            <Text style={styles.battleProgressText}>
              {difficulty.name} 전투 {difficultyProgress.currentBattleNumber}/{difficultyProgress.requiredWins} · 승리 {difficultyProgress.wins}회
            </Text>
            <GameButton
              title={hasWeapon ? '전투 시작' : '무기가 필요해요'}
              onPress={startBattle}
              disabled={!hasWeapon}
              variant="red"
              style={styles.startButton}
            />
            {!hasWeapon ? <Text style={styles.weaponHint}>장착할 원반과 쿠키봇을 하나씩 준비하세요.</Text> : null}
          </View>
        ) : null}
      </ImageBackground>

      <Modal visible={engine.state.status === 'victory' || engine.state.status === 'defeat'} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{engine.state.status === 'victory' ? '🏆' : '💫'}</Text>
            <Text style={[styles.resultTitle, engine.state.status === 'defeat' && styles.defeatTitle]}>
              {engine.state.status === 'victory' ? '전투 승리!' : '다시 도전해요!'}
            </Text>
            {engine.state.status === 'victory' ? (
              <View style={[styles.rewardBox, rewardResult && !rewardResult.firstClear && styles.replayBox]}>
                <CookieImage size={44} />
                <View>
                  <Text style={styles.rewardLabel}>{rewardResult?.firstClear ? `전투 ${rewardResult.stageNumber} 최초 보상` : `전투 ${rewardResult?.stageNumber ?? ''} 이미 받은 보상`}</Text>
                  <Text style={styles.rewardValue}>{rewardResult?.firstClear ? `+${formatNumber(rewardResult.reward)} 쿠키` : '추가 쿠키 없음'}</Text>
                </View>
              </View>
            ) : <Text style={styles.defeatText}>쿠키를 더 모아 강화하고 다시 도전해 보세요.</Text>}
            {engine.state.status === 'victory' && rewardResult ? (
              <Text style={styles.progressText}>이 난이도 승리 {rewardResult.difficultyWins}/{rewardResult.winsRequired}</Text>
            ) : null}
            {engine.state.status === 'victory' && difficulty.id !== DIFFICULTIES[DIFFICULTIES.length - 1].id && rewardResult?.unlockedNextDifficulty ? (
              <Text style={styles.unlockText}>다음 난이도가 열렸어요!</Text>
            ) : null}
            <View style={styles.resultButtonRow}>
              <GameButton
                title="로비 이동"
                onPress={leaveBattle}
                variant="orange"
                style={styles.resultButton}
              />
              <GameButton
                title="다음 전투"
                onPress={startBattle}
                variant="green"
                style={styles.resultButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingVertical: 2 },
  field: { flex: 1, minHeight: 410, borderRadius: 23, overflow: 'hidden', borderWidth: 2, borderColor: colors.white, position: 'relative' },
  mapImage: { borderRadius: 21 },
  compactHud: { position: 'absolute', top: 5, left: 6, right: 6, zIndex: 2000, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(42,83,153,0.82)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  enemyHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(167,37,48,0.84)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  enemy: { position: 'absolute', alignItems: 'center' },
  enemyName: { fontFamily: fonts.extraBold, fontSize: 7, color: colors.red, maxWidth: '100%', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 3, borderRadius: 4 },
  healthTrack: { borderRadius: 4, overflow: 'hidden', marginVertical: 1 },
  healthFill: { height: '100%' },
  core: { position: 'absolute', left: '50%', bottom: 0, alignItems: 'center', zIndex: 1000, borderRadius: 24 },
  coreReady: { backgroundColor: 'rgba(255,220,91,0.22)', borderWidth: 2, borderColor: colors.yellow },
  corePressed: { transform: [{ scale: 0.92 }] },
  bot: { position: 'absolute', alignItems: 'center' },
  allyName: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.blue, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 4, borderRadius: 5 },
  botName: { maxWidth: '100%', fontSize: 6, paddingHorizontal: 2 },
  projectile: { position: 'absolute', zIndex: 1800 },
  castleProjectile: { borderRadius: 50, backgroundColor: 'rgba(74,154,255,0.22)' },
  doubleDamage: { position: 'absolute', top: -9, alignSelf: 'center', zIndex: 2, fontFamily: fonts.extraBold, fontSize: 8, color: colors.blueDark, backgroundColor: colors.white, borderRadius: 5, paddingHorizontal: 3 },
  enemyProjectile: { borderWidth: 2, borderColor: colors.red, borderRadius: 30, backgroundColor: 'rgba(255,224,227,0.62)', alignItems: 'center', justifyContent: 'center' },
  notice: { position: 'absolute', alignSelf: 'center', top: '42%', fontFamily: fonts.display, fontSize: 31, color: colors.purple, textShadowColor: colors.white, textShadowRadius: 7, zIndex: 2100 },
  startOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,248,231,0.88)', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 },
  readyTitle: { fontFamily: fonts.display, fontSize: 31, color: colors.ink, marginTop: 5 },
  readyText: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, marginBottom: 12 },
  autoReadyText: { fontFamily: fonts.bold, fontSize: 10, color: colors.blueDark, marginTop: -7, marginBottom: 11, textAlign: 'center' },
  battleProgressText: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.purple, marginBottom: 9 },
  startButton: { width: 210 },
  weaponHint: { fontFamily: fonts.bold, fontSize: 10, color: colors.red, marginTop: 8 },
  resultOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  resultCard: { width: '100%', maxWidth: 380, backgroundColor: colors.cream, borderRadius: 28, padding: 22, alignItems: 'center', borderWidth: 3, borderColor: colors.white },
  resultEmoji: { fontSize: 58 },
  resultTitle: { fontFamily: fonts.display, fontSize: 34, color: colors.greenDark },
  defeatTitle: { color: colors.orange },
  rewardBox: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFF0C2', borderRadius: 18, padding: 12, marginTop: 10 },
  replayBox: { backgroundColor: '#EEEAE6' },
  rewardLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted },
  rewardValue: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.cookieDark },
  defeatText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center', marginVertical: 12 },
  progressText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blueDark, marginTop: 10 },
  unlockText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.purple, marginTop: 10 },
  resultButtonRow: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 14 },
  resultButton: { flex: 1 },
});
