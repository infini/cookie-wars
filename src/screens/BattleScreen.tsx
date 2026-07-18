import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BATTLE_RULES, DIFFICULTIES, getCookie, getDifficulty, getMonster } from '../config';
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
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import { BattleRewardResult } from '../types/game';
import { formatNumber } from '../utils/format';

function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <View style={styles.healthTrack}>
      <View style={[styles.healthFill, { width: `${Math.max(0, Math.min(100, value / max * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

interface BattleScreenProps {
  onReturnToGame: () => void;
}

export function BattleScreen({ onReturnToGame }: BattleScreenProps) {
  const {
    state: game,
    stats,
    discoverMonster,
    completeBattle,
  } = useGame();
  const feedback = useFeedback();
  const baseDifficulty = getDifficulty(game.selectedDifficultyId);
  const difficultyProgress = getDifficultyProgress(game, baseDifficulty.id);
  const difficulty = useMemo(
    () => getBattleDifficulty(baseDifficulty, difficultyProgress.wins),
    [baseDifficulty, difficultyProgress.wins],
  );
  const monster = getMonster(difficulty.monsterId);
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
    if (kind === 'victory') feedback.success();
    if (kind === 'defeat') feedback.error();
  }, [feedback]);

  const engine = useBattleEngine({
    difficulty,
    monster,
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

  const startBattle = () => {
    handledResult.current = false;
    setRewardResult(null);
    discoverMonster(monster.id);
    engine.start();
    feedback.play('menu');
    feedback.tap();
  };

  const leaveBattle = () => {
    engine.reset();
    setRewardResult(null);
    onReturnToGame();
  };

  const livingEnemies = useMemo(() => engine.state.enemies.filter((enemy) => enemy.hp > 0), [engine.state.enemies]);
  const hasWeapon = discProgress.owned && activeBots.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.battleHeader}>
        <View>
          <Text style={styles.difficultyLabel}>난이도</Text>
          <Text style={styles.difficultyName}>{difficulty.name}</Text>
        </View>
        <View style={styles.autoBadge}>
          <MaterialCommunityIcons name="robot-happy" size={16} color={colors.white} />
          <Text style={styles.autoText}>봇 자동 · {difficultyProgress.currentBattleNumber}/{difficultyProgress.requiredWins}</Text>
        </View>
        <View style={styles.enemyCount}><MaterialCommunityIcons name="ghost" size={19} color={colors.red} /><Text style={styles.enemyCountText}>{livingEnemies.length}/{difficulty.enemyCount}</Text></View>
        <View style={styles.enemyDiscBadge}><Text style={styles.enemyDiscText}>적 원반 Lv.{difficulty.enemyDiscLevel}</Text></View>
      </View>

      <LinearGradient colors={gradients.battle} style={styles.field}>
        <View style={styles.enemyZone}><Text style={styles.zoneText}>적군 구역</Text></View>
        <View style={styles.midLine} />
        {engine.state.enemies.map((enemy) => enemy.hp > 0 && enemy.spawnAt <= engine.state.now ? (
          <View key={enemy.id} style={[styles.enemy, { left: `${enemy.x * 100}%`, top: `${enemy.y * 100}%` }]}>
            <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
            <HealthBar value={enemy.hp} max={enemy.maxHp} color={colors.red} />
            <MonsterSprite size={difficulty.enemyCount >= 7 ? 48 : 57} />
          </View>
        ) : null)}

        {engine.state.enemyProjectiles.map((projectile) => (
          <View key={projectile.id} style={[styles.projectile, styles.enemyProjectile, { left: `${projectile.x * 100}%`, top: `${projectile.y * 100}%`, width: projectile.size, height: projectile.size }]}> 
            <DiscImage size={projectile.size - 4} />
          </View>
        ))}
        {engine.state.playerProjectiles.map((projectile) => {
          const renderedSize = Math.min(projectile.size, BATTLE_RULES.maxRenderedPlayerDiscSize);
          return (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                projectile.source === 'castle' && styles.castleProjectile,
                { left: `${projectile.x * 100}%`, top: `${projectile.y * 100}%` },
              ]}
            >
              {projectile.source === 'castle' ? <Text style={styles.doubleDamage}>2배</Text> : null}
              <DiscImage size={renderedSize} />
            </View>
          );
        })}

        {engine.state.notice ? <Text style={styles.notice}>{engine.state.notice}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="쿠키 성 원반 던지기"
          accessibilityHint="전투 중 누르면 쿠키봇 원반의 두 배 피해로 공격합니다"
          disabled={!engine.canCastleThrow}
          onPress={() => {
            if (engine.throwCastleDisc()) feedback.tap();
          }}
          style={({ pressed }) => [
            styles.core,
            engine.state.status === 'active' && engine.canCastleThrow && styles.coreReady,
            pressed && engine.canCastleThrow && styles.corePressed,
          ]}
        >
          <Text style={styles.allyName}>쿠키 성</Text>
          <HealthBar value={engine.state.status === 'idle' ? stats.maxHealth : engine.state.baseHealth} max={stats.maxHealth} color={colors.blue} />
          <CookieCastle size={104} cookieImageKey={activeCookie.imageKey} />
        </Pressable>
        {activeBots.map((bot, index) => (
          <View
            key={bot.config.id}
            style={[
              styles.bot,
              {
                left: `${4 + index % 5 * 19}%`,
                bottom: activeBots.length > 5
                  ? 118 + Math.floor(index / 5) * 42
                  : 116,
              },
            ]}
          >
            <Text style={[styles.allyName, styles.botName]} numberOfLines={1}>
              {bot.config.name}{bot.count > 1 ? ` ×${bot.count}` : ''}
            </Text>
            <BotImage
              size={activeBots.length > 5 ? 36 : 48}
              cookieImageKey={activeCookie.imageKey}
            />
          </View>
        ))}

        {engine.state.status === 'idle' ? (
          <View style={styles.startOverlay}>
            <MaterialCommunityIcons name="sword-cross" size={52} color={colors.red} />
            <Text style={styles.readyTitle}>전투 준비!</Text>
            <Text style={styles.readyText}>아군은 아래, 적군은 위에서 시작해요.</Text>
            <Text style={styles.autoReadyText}>쿠키봇은 원반을 자동으로 던져요.</Text>
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
      </LinearGradient>

      <View style={styles.controls}>
        <View style={styles.coreHp}>
          <MaterialCommunityIcons name="shield-home" size={24} color={colors.blue} />
          <View><Text style={styles.coreHpLabel}>쿠키 성 체력</Text><Text style={styles.coreHpValue}>{engine.state.status === 'idle' ? stats.maxHealth : engine.state.baseHealth} / {stats.maxHealth}</Text></View>
        </View>
        <View style={[styles.throwButton, !engine.canCastleThrow && styles.throwDisabled]}>
          <DiscImage size={42} />
          <View>
            <Text style={styles.throwTitle}>쿠키 성을 눌러요!</Text>
            <Text style={styles.throwStatus}>
              {engine.canCastleThrow
                ? `2배 피해 준비 완료 · ${discProgress.config.name}`
                : engine.cooldownRemainingMs > 0
                  ? `2배 원반 대기 ${(engine.cooldownRemainingMs / 1000).toFixed(1)}초`
                  : '봇은 자동 공격 중'}
            </Text>
          </View>
        </View>
      </View>

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
                  <Text style={styles.rewardLabel}>{rewardResult?.firstClear ? '최초 승리 보상' : '이미 받은 보상'}</Text>
                  <Text style={styles.rewardValue}>{rewardResult?.firstClear ? `+${formatNumber(rewardResult.reward)} 쿠키` : '추가 쿠키 없음'}</Text>
                </View>
              </View>
            ) : <Text style={styles.defeatText}>쿠키를 더 모아 강화하고 다시 도전해 보세요.</Text>}
            {engine.state.status === 'victory' && rewardResult ? (
              <Text style={styles.progressText}>
                이 난이도 승리 {rewardResult.difficultyWins}/{rewardResult.winsRequired}
              </Text>
            ) : null}
            {engine.state.status === 'victory' && difficulty.id !== DIFFICULTIES[DIFFICULTIES.length - 1].id && rewardResult?.unlockedNextDifficulty ? (
              <Text style={styles.unlockText}>다음 난이도가 열렸어요!</Text>
            ) : null}
            <GameButton title="메인 화면으로" onPress={leaveBattle} variant={engine.state.status === 'victory' ? 'green' : 'orange'} style={styles.resultButton} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 6, paddingVertical: 2 },
  battleHeader: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 5 },
  difficultyLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
  difficultyName: { fontFamily: fonts.display, fontSize: 20, color: colors.redDark },
  autoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.blue, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 6 },
  autoText: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.white },
  enemyCount: { marginLeft: 'auto', flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  enemyCountText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.redDark },
  enemyDiscBadge: { backgroundColor: '#F0E7FF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  enemyDiscText: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.purple },
  field: { flex: 1, minHeight: 340, borderRadius: 23, overflow: 'hidden', borderWidth: 2, borderColor: colors.white, position: 'relative' },
  enemyZone: { position: 'absolute', top: 5, left: 8, backgroundColor: 'rgba(240,68,82,0.13)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 3 },
  zoneText: { fontFamily: fonts.bold, fontSize: 8, color: colors.redDark },
  midLine: { position: 'absolute', top: '50%', left: 12, right: 12, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(117,102,93,0.22)' },
  enemy: { position: 'absolute', alignItems: 'center', width: 96, marginLeft: -48, marginTop: -8, zIndex: 3 },
  enemyName: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.red, maxWidth: 94, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 3, borderRadius: 4 },
  healthTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: 'rgba(66,49,40,0.2)', overflow: 'hidden', marginVertical: 2 },
  healthFill: { height: '100%', borderRadius: 3 },
  core: { position: 'absolute', left: '50%', bottom: 1, marginLeft: -60, width: 120, alignItems: 'center', zIndex: 6, borderRadius: 28 },
  coreReady: { backgroundColor: 'rgba(255,220,91,0.25)', borderWidth: 2, borderColor: colors.yellow },
  corePressed: { transform: [{ scale: 0.92 }] },
  bot: { position: 'absolute', width: '19%', alignItems: 'center', zIndex: 4 },
  allyName: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.blue, backgroundColor: 'rgba(255,255,255,0.86)', paddingHorizontal: 5, borderRadius: 5 },
  botName: { maxWidth: '100%', fontSize: 7, paddingHorizontal: 2 },
  projectile: { position: 'absolute', marginLeft: -25, marginTop: -25, zIndex: 8 },
  castleProjectile: { borderRadius: 50, backgroundColor: 'rgba(74,154,255,0.22)' },
  doubleDamage: { position: 'absolute', top: -9, alignSelf: 'center', zIndex: 2, fontFamily: fonts.extraBold, fontSize: 8, color: colors.blueDark, backgroundColor: colors.white, borderRadius: 5, paddingHorizontal: 3 },
  enemyProjectile: { borderWidth: 2, borderColor: colors.red, borderRadius: 30, backgroundColor: 'rgba(255,224,227,0.62)', alignItems: 'center', justifyContent: 'center' },
  notice: { position: 'absolute', alignSelf: 'center', top: '42%', fontFamily: fonts.display, fontSize: 31, color: colors.purple, textShadowColor: colors.white, textShadowRadius: 7, zIndex: 12 },
  startOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,248,231,0.88)', alignItems: 'center', justifyContent: 'center', zIndex: 15, padding: 20 },
  readyTitle: { fontFamily: fonts.display, fontSize: 31, color: colors.ink, marginTop: 5 },
  readyText: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, marginBottom: 12 },
  autoReadyText: { fontFamily: fonts.bold, fontSize: 10, color: colors.blueDark, marginTop: -7, marginBottom: 11 },
  battleProgressText: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.purple, marginBottom: 9 },
  startButton: { width: 210 },
  weaponHint: { fontFamily: fonts.bold, fontSize: 10, color: colors.red, marginTop: 8 },
  controls: { minHeight: 68, flexDirection: 'row', gap: 7 },
  coreHp: { flex: 0.75, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.line },
  coreHpLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
  coreHpValue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blueDark },
  throwButton: { flex: 1.25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EAF4FF', borderRadius: 18, borderWidth: 2, borderColor: colors.blue },
  throwDisabled: { opacity: 0.52, borderColor: colors.disabled, backgroundColor: '#ECE9E6' },
  throwPressed: { transform: [{ scale: 0.97 }] },
  throwTitle: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blueDark },
  throwStatus: { fontFamily: fonts.medium, fontSize: 8, color: colors.muted },
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
  resultButton: { width: '100%', marginTop: 14 },
});
