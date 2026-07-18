import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BATTLE_FEEDBACK,
  BATTLE_UI,
  BOSS_SPECIAL_ATTACK,
  DIFFICULTIES,
  GIANT_DISC,
  getBattleMapForDifficulty,
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
import { type BattleEvent, useBattleEngine } from '../engine/useBattleEngine';
import { BattleHealthBar } from '../components/battle/BattleHealthBar';
import { BattleImpactEffect } from '../components/battle/BattleImpactEffect';
import {
  EnemyProjectileLayer,
  PlayerProjectileLayer,
} from '../components/battle/BattleProjectiles';
import {
  BattleBotFormation,
  BattleEnemyLayer,
} from '../components/battle/BattleUnits';
import { getBattleMapImageSource } from '../components/BattleMapImage';
import { CookieCastle } from '../components/CookieCastle';
import { DiscImage } from '../components/DiscImage';
import { GameButton } from '../components/GameButton';
import { useFeedback } from '../services/FeedbackContext';
import { getLightHitSoundName } from '../services/battleAudio';
import {
  getBossSpecialAttackPose,
  getBossSpecialAttackProgress,
  getBossSpecialAttackImpactProgress,
} from '../domain/bossSpecialAttack';
import { useGame } from '../state/GameContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { BattleRewardResult } from '../types/game';
import { formatNumber } from '../utils/format';

export { getHealthColor } from '../components/battle/BattleHealthBar';

interface BattleScreenProps {
  onReturnToGame: () => void;
}

export function BattleScreen({ onReturnToGame }: BattleScreenProps) {
  const {
    state: game,
    stats,
    discoverMonster,
    completeBattle,
    consumeGiantDisc,
  } = useGame();
  const { width: screenWidth } = useWindowDimensions();
  const feedback = useFeedback();
  const baseDifficulty = getDifficulty(game.selectedDifficultyId);
  const difficultyProgress = getDifficultyProgress(game, baseDifficulty.id);
  const difficulty = useMemo(
    () => getBattleDifficulty(baseDifficulty, difficultyProgress.wins),
    [baseDifficulty, difficultyProgress.wins],
  );
  const battleMap = useMemo(
    () => getBattleMapForDifficulty(baseDifficulty.id),
    [baseDifficulty.id],
  );
  const activeCookie = getCookie(stats.activeCookieId);
  const playerDisc = useMemo(
    () => getDiscProgress(game).current,
    [game.selectedDiscId, game.discLevels],
  );
  const discAvailable = game.ownedDiscIds.includes(game.selectedDiscId);
  const activeBots = useMemo(() => getActiveBots(game), [game.botCounts]);
  const [rewardResult, setRewardResult] = useState<BattleRewardResult | null>(null);
  const handledResult = useRef(false);
  const giantDiscRenderSize = Math.round(screenWidth * GIANT_DISC.renderWidthRatio);

  const onEvent = useCallback((event: BattleEvent) => {
    const { kind } = event;
    if (kind === 'disc') {
      feedback.play(event.attackSource === 'giant' ? 'giantDisc' : 'friendlyDisc');
    }
    if (kind === 'enemyDisc' || kind === 'bossSpecialAttack') {
      feedback.play('enemyDisc');
    }
    if (kind === 'bossSpecialAttack') feedback.play('bossMelee');
    if (kind === 'enemyHit') {
      if (event.attackSource === 'giant' || event.attackSource === 'castle') {
        feedback.play('hitHeavy');
      } else {
        feedback.play(getLightHitSoundName(event.id));
      }
    }
    if (kind === 'castleHit') {
      feedback.play(event.attackKind === 'melee' ? 'bossMelee' : 'hitHeavy');
    }
    if (kind === 'bossEnraged') feedback.play('bossEnrage');
    if (kind === 'enemyDefeated') feedback.play('hitHeavy');
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
    discAvailable,
    bots: activeBots,
    maxHealth: stats.maxHealth,
    consumeGiantDisc,
    onEvent,
  });
  const lastEvent = engine.state.lastEvent;
  const lastEventAgeMs = lastEvent
    ? Math.max(0, engine.state.now - lastEvent.at)
    : Number.POSITIVE_INFINITY;
  const castleHitVisible = Boolean(
    lastEvent?.kind === 'castleHit'
    && lastEventAgeMs <= BATTLE_FEEDBACK.castleHitDurationMs,
  );
  const castleHitProgress = castleHitVisible
    ? Math.min(1, lastEventAgeMs / BATTLE_FEEDBACK.castleHitDurationMs)
    : 1;
  const castleHitWave = castleHitVisible ? Math.sin(castleHitProgress * Math.PI) : 0;
  const castleHitShake = castleHitVisible
    ? Math.sin(
      castleHitProgress * Math.PI * BATTLE_FEEDBACK.enemyHitShakeCycles,
    ) * BATTLE_FEEDBACK.castleHitShakePixels * (1 - castleHitProgress)
    : 0;
  const specialAttackingBoss = engine.state.enemies.find((enemy) => (
    getBossSpecialAttackProgress(
      enemy.lastSpecialAttackAt,
      enemy.spawnAt,
      engine.state.now,
    ) !== null
  ));
  const bossSpecialAttackProgress = specialAttackingBoss
    ? getBossSpecialAttackProgress(
      specialAttackingBoss.lastSpecialAttackAt,
      specialAttackingBoss.spawnAt,
      engine.state.now,
    )
    : null;
  const bossSpecialAttackFlashOpacity = bossSpecialAttackProgress === null
    ? 0
    : getBossSpecialAttackPose(bossSpecialAttackProgress).effectOpacity
      * BOSS_SPECIAL_ATTACK.screenFlashMaximumOpacity;
  const bossSpecialAttackImpactProgress = bossSpecialAttackProgress === null
    ? null
    : getBossSpecialAttackImpactProgress(bossSpecialAttackProgress);
  const bossSpecialAttackScreenShake = bossSpecialAttackImpactProgress === null
    ? 0
    : Math.sin(
      bossSpecialAttackImpactProgress
        * BOSS_SPECIAL_ATTACK.screenShakeCycles
        * Math.PI,
    )
      * BOSS_SPECIAL_ATTACK.screenShakePixels
      * (1 - bossSpecialAttackImpactProgress);

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
    feedback.startBattleMusic();
    feedback.tap();
  };

  const leaveBattle = () => {
    feedback.stopBattleSounds();
    engine.reset();
    setRewardResult(null);
    onReturnToGame();
  };

  const throwCastleDiscFromBattleField = useCallback(() => {
    if (engine.state.status !== 'active') return;
    if (engine.throwCastleDisc()) feedback.tap();
  }, [engine.state.status, engine.throwCastleDisc, feedback]);

  const remainingEnemyCount = useMemo(() => engine.state.enemies.filter(
    (enemy) => enemy.hp > 0,
  ).length, [engine.state.enemies]);
  const displayedBoss = engine.state.enemies.find((enemy) => enemy.hp > 0)
    ?? engine.state.enemies[0];
  const hasWeapon = discAvailable && activeBots.length > 0;

  return (
    <View style={styles.root}>
      <Pressable
        accessible={false}
        focusable={false}
        onPress={throwCastleDiscFromBattleField}
        style={[
          styles.field,
          {
            transform: [
              { translateX: bossSpecialAttackScreenShake },
              { translateY: Math.abs(bossSpecialAttackScreenShake) },
            ],
          },
        ]}
      >
        <ImageBackground
          source={getBattleMapImageSource(battleMap.imageKey)}
          resizeMode="cover"
          style={styles.fieldContent}
          imageStyle={styles.mapImage}
        >
        <View style={styles.compactHud} pointerEvents="none">
          <Text style={styles.stageHud}>{difficulty.name} · 전투 {difficultyProgress.currentBattleNumber}/{difficultyProgress.requiredWins}</Text>
          <Text style={styles.enemyHud}>남은 보스 {remainingEnemyCount}</Text>
        </View>

        {displayedBoss && engine.state.status === 'active' ? (
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

        <BattleEnemyLayer
          enemies={engine.state.enemies}
          enemyProjectiles={engine.state.enemyProjectiles}
          status={engine.state.status}
          now={engine.state.now}
          enemyDiscCooldownMs={engine.enemyDisc.cooldownMs}
          lastEvent={lastEvent}
          lastEventAgeMs={lastEventAgeMs}
        />

        <EnemyProjectileLayer
          projectiles={engine.state.enemyProjectiles}
          now={engine.state.now}
        />

        <BattleImpactEffect event={lastEvent} now={engine.state.now} />

        {castleHitVisible ? (
          <View
            pointerEvents="none"
            style={[
              styles.castleHitFlash,
              {
                backgroundColor: BATTLE_FEEDBACK.screenFlashColor,
                opacity: BATTLE_FEEDBACK.screenFlashMaximumOpacity * castleHitWave,
              },
            ]}
          />
        ) : null}

        {bossSpecialAttackProgress !== null ? (
          <View
            pointerEvents="none"
            style={[
              styles.bossSpecialAttackFlash,
              {
                backgroundColor: BOSS_SPECIAL_ATTACK.screenFlashColor,
                opacity: bossSpecialAttackFlashOpacity,
              },
            ]}
          />
        ) : null}

        <PlayerProjectileLayer
          projectiles={engine.state.playerProjectiles}
          now={engine.state.now}
          giantDiscRenderSize={giantDiscRenderSize}
        />

        {engine.state.status === 'active' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`거대 원반 사용, ${game.giantDiscCount}개 보유`}
            accessibilityState={{
              disabled: game.giantDiscCount <= 0 || !engine.canGiantThrow,
            }}
            onPress={(event) => {
              event.stopPropagation();
              if (game.giantDiscCount <= 0 || !engine.canGiantThrow) return;
              if (engine.throwGiantDisc()) feedback.tap();
            }}
            style={({ pressed }) => [
            styles.giantDiscButton,
            { top: BATTLE_UI.giantDiscButtonTop },
              {
                backgroundColor: game.giantDiscCount <= 0 || !engine.canGiantThrow
                  ? GIANT_DISC.buttonDisabledColor
                  : GIANT_DISC.buttonBackgroundColor,
                borderColor: GIANT_DISC.buttonBorderColor,
                shadowColor: GIANT_DISC.buttonBorderColor,
              },
              (game.giantDiscCount <= 0 || !engine.canGiantThrow) && styles.giantDiscButtonDisabled,
              pressed && styles.giantDiscButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="disc" size={28} color={colors.white} />
            <View>
              <Text style={styles.giantDiscButtonTitle}>거대 원반</Text>
              <Text style={[styles.giantDiscButtonCount, { color: GIANT_DISC.buttonCountColor }]}>보유 {game.giantDiscCount}개 · {GIANT_DISC.damageMultiplier}배</Text>
            </View>
          </Pressable>
        ) : null}

        {engine.state.notice ? <Text style={styles.notice}>{engine.state.notice}</Text> : null}

        <BattleBotFormation bots={activeBots} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="쿠키 성 원반 던지기"
          accessibilityHint="전투 화면을 누르면 쿠키봇 원반의 두 배 피해로 공격합니다"
          disabled={!engine.canCastleThrow}
          onPress={(event) => {
            event.stopPropagation();
            if (engine.throwCastleDisc()) feedback.tap();
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
            engine.state.status === 'active' && engine.canCastleThrow && styles.coreReady,
            pressed && engine.canCastleThrow && styles.corePressed,
          ]}
        >
          <Text style={styles.allyName}>쿠키 성</Text>
          <BattleHealthBar
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
            <Text style={styles.readyText}>거대한 보스 한 마리가 쿠키 성을 노려요!</Text>
            <Text style={styles.autoReadyText}>쿠키봇은 자동 공격 · 전투 화면을 누르면 성이 2배 공격</Text>
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
      </Pressable>

      <Modal visible={engine.state.status === 'victory' || engine.state.status === 'defeat'} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{engine.state.status === 'victory' ? '🏆' : '💫'}</Text>
            <Text style={[styles.resultTitle, engine.state.status === 'defeat' && styles.defeatTitle]}>
              {engine.state.status === 'victory' ? '전투 승리!' : '다시 도전해요!'}
            </Text>
            {engine.state.status === 'victory' ? (
              <View style={[styles.rewardBox, rewardResult && !rewardResult.firstClear && styles.replayBox]}>
                <DiscImage size={44} />
                <View>
                  <Text style={styles.rewardLabel}>{rewardResult?.firstClear ? `전투 ${rewardResult.stageNumber} 최초 보상` : `전투 ${rewardResult?.stageNumber ?? ''} 이미 받은 보상`}</Text>
                  <Text style={styles.rewardValue}>{rewardResult?.firstClear ? `거대 원반 +${rewardResult.giantDiscReward}` : '추가 거대 원반 없음'}</Text>
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
                title={engine.state.status === 'victory' ? '다음 전투' : '다시 전투'}
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
  fieldContent: { flex: 1, position: 'relative' },
  mapImage: { borderRadius: 21 },
  compactHud: { position: 'absolute', top: 5, left: 6, right: 6, zIndex: 2000, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(42,83,153,0.82)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  enemyHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(167,37,48,0.84)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  core: { position: 'absolute', left: '50%', bottom: 0, alignItems: 'center', zIndex: 1000, borderRadius: 24 },
  coreReady: { backgroundColor: 'rgba(255,220,91,0.22)', borderWidth: 2, borderColor: colors.yellow },
  corePressed: { transform: [{ scale: 0.92 }] },
  allyName: { fontFamily: fonts.extraBold, fontSize: 8, color: colors.blue, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 4, borderRadius: 5 },
  castleHitFlash: { ...StyleSheet.absoluteFill, zIndex: 900 },
  bossSpecialAttackFlash: { ...StyleSheet.absoluteFill, zIndex: 850 },
  bossHealthHud: { position: 'absolute', alignSelf: 'center', zIndex: 2300 },
  bossHealthLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 3 },
  bossHealthName: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.red, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 5, paddingHorizontal: 5 },
  bossHealthValue: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, textShadowColor: colors.ink, textShadowRadius: 3 },
  giantDiscButton: { position: 'absolute', right: 8, zIndex: 2200, minWidth: 128, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 2, borderRadius: 17, paddingHorizontal: 10, paddingVertical: 7, shadowOpacity: 0.8, shadowRadius: 8, elevation: 9 },
  giantDiscButtonDisabled: { opacity: 0.42 },
  giantDiscButtonPressed: { transform: [{ scale: 0.94 }] },
  giantDiscButtonTitle: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.white },
  giantDiscButtonCount: { fontFamily: fonts.bold, fontSize: 8 },
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
