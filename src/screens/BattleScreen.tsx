import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  BATTLE_RULES,
  BATTLE_FEEDBACK,
  BATTLE_UI,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
  DIFFICULTIES,
  GIANT_DISC,
  getBattleMapForBattle,
  getCookie,
  getDifficulty,
  getEnemyWaveMonsterIds,
} from '../config';
import {
  ActiveBot,
  getActiveBots,
  getBattleDifficulty,
  getDifficultyProgress,
  getDiscProgress,
} from '../domain/gameSelectors';
import { BattleEvent, useBattleEngine } from '../engine/useBattleEngine';
import { BotImage } from '../components/BotImage';
import { BossHammerSmashEffect } from '../components/BossHammerSmashEffect';
import { getBattleMapImageSource } from '../components/BattleMapImage';
import { CookieCastle } from '../components/CookieCastle';
import { DiscImage } from '../components/DiscImage';
import { GameButton } from '../components/GameButton';
import { MonsterSprite } from '../components/MonsterSprite';
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

function HealthBar({
  value,
  max,
  width,
  height = BATTLE_UI.healthBarHeight,
}: {
  value: number;
  max: number;
  width: number;
  height?: number;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View
      style={[
        styles.healthTrack,
        {
          width,
          height,
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

function BattleImpactEffect({ event, now }: { event: BattleEvent | null; now: number }) {
  if (
    !event
    || event.x === undefined
    || event.y === undefined
    || !['enemyHit', 'castleHit', 'bossEnraged', 'enemyDefeated'].includes(event.kind)
  ) return null;
  const ageMs = Math.max(0, now - event.at);
  if (ageMs > BATTLE_FEEDBACK.impactEffectDurationMs) return null;

  const isCastleImpact = event.kind === 'castleHit';
  const overallProgress = Math.min(
    1,
    ageMs / BATTLE_FEEDBACK.impactEffectDurationMs,
  );
  const fieldProgress = Math.min(
    1,
    ageMs / BATTLE_FEEDBACK.fieldShockwaveDurationMs,
  );
  const fieldScale = BATTLE_FEEDBACK.fieldShockwaveStartScale + (
    BATTLE_FEEDBACK.fieldShockwaveEndScale
    - BATTLE_FEEDBACK.fieldShockwaveStartScale
  ) * fieldProgress;
  const showFieldShockwave = !isCastleImpact
    && (event.attackSource === 'castle' || event.attackSource === 'giant');

  return (
    <View
      pointerEvents="none"
      style={[
        styles.impactEffect,
        {
          left: `${event.x * 100}%`,
          top: `${event.y * 100}%`,
          width: BATTLE_FEEDBACK.impactEffectSize,
          height: BATTLE_FEEDBACK.impactEffectSize,
          marginLeft: -BATTLE_FEEDBACK.impactEffectSize / 2,
          marginTop: -BATTLE_FEEDBACK.impactEffectSize / 2,
        },
      ]}
    >
      {showFieldShockwave ? (
        <View style={[
          styles.fieldShockwave,
          {
            width: BATTLE_FEEDBACK.fieldShockwaveSize,
            height: BATTLE_FEEDBACK.fieldShockwaveSize
              * BATTLE_FEEDBACK.fieldShockwaveHeightRatio,
            left: (
              BATTLE_FEEDBACK.impactEffectSize - BATTLE_FEEDBACK.fieldShockwaveSize
            ) / 2,
            top: (
              BATTLE_FEEDBACK.impactEffectSize
              - BATTLE_FEEDBACK.fieldShockwaveSize
                * BATTLE_FEEDBACK.fieldShockwaveHeightRatio
            ) / 2,
            borderColor: BATTLE_FEEDBACK.impactOuterColor,
            borderWidth: BATTLE_FEEDBACK.fieldShockwaveBorderWidth,
            opacity: BATTLE_FEEDBACK.fieldShockwaveMaximumOpacity * (1 - fieldProgress),
            transform: [{ scale: fieldScale }],
          },
        ]} />
      ) : null}

      {BATTLE_FEEDBACK.impactBursts.map((burst, burstIndex) => {
        const burstAgeMs = ageMs - burst.delayMs;
        if (burstAgeMs < 0 || burstAgeMs > BATTLE_FEEDBACK.impactBurstDurationMs) {
          return null;
        }
        const progress = Math.min(
          1,
          burstAgeMs / BATTLE_FEEDBACK.impactBurstDurationMs,
        );
        const scale = (
          BATTLE_FEEDBACK.impactStartScale + (
            BATTLE_FEEDBACK.impactEndScale - BATTLE_FEEDBACK.impactStartScale
          ) * progress
        ) * burst.scale;
        const primaryColor = isCastleImpact
          ? BATTLE_FEEDBACK.castleImpactSparkColor
          : BATTLE_FEEDBACK.impactSparkColor;
        const secondaryColor = isCastleImpact
          ? BATTLE_FEEDBACK.castleImpactSecondaryColor
          : BATTLE_FEEDBACK.impactSecondaryColor;
        return (
          <View
            key={`impact-burst-${burstIndex}`}
            style={[
              styles.impactBurst,
              {
                opacity: 1 - progress,
                transform: [
                  { translateX: burst.xRatio * BATTLE_FEEDBACK.impactEffectSize },
                  { translateY: burst.yRatio * BATTLE_FEEDBACK.impactEffectSize },
                  { rotate: `${burst.rotationDeg}deg` },
                  { scale },
                ],
              },
            ]}
          >
            <View style={[
              styles.impactOuter,
              {
                borderColor: isCastleImpact
                  ? BATTLE_FEEDBACK.castleImpactOuterColor
                  : BATTLE_FEEDBACK.impactOuterColor,
                borderWidth: BATTLE_FEEDBACK.impactRingBorderWidth,
              },
            ]} />
            {Array.from({ length: BATTLE_FEEDBACK.impactSparkCount }, (_, index) => {
              const angle = index * 360 / BATTLE_FEEDBACK.impactSparkCount;
              return (
                <View
                  key={`impact-spark-${index}`}
                  style={[
                    styles.impactSpark,
                    {
                      width: BATTLE_FEEDBACK.impactSparkWidth,
                      height: BATTLE_FEEDBACK.impactSparkLength,
                      left: (
                        BATTLE_FEEDBACK.impactEffectSize
                        - BATTLE_FEEDBACK.impactSparkWidth
                      ) / 2,
                      top: (
                        BATTLE_FEEDBACK.impactEffectSize
                        - BATTLE_FEEDBACK.impactSparkLength
                      ) / 2,
                      backgroundColor: index % 2 === 0 ? primaryColor : secondaryColor,
                      transform: [
                        { rotate: `${angle}deg` },
                        {
                          translateY: -(
                            BATTLE_FEEDBACK.impactSparkTravelPixels * progress
                          ),
                        },
                        {
                          scaleY: 1 - (
                            1 - BATTLE_FEEDBACK.impactSparkEndScale
                          ) * progress,
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
            <View style={[
              styles.impactInner,
              {
                width: `${BATTLE_FEEDBACK.impactInnerScale * 100}%`,
                height: `${BATTLE_FEEDBACK.impactInnerScale * 100}%`,
                backgroundColor: isCastleImpact
                  ? BATTLE_FEEDBACK.castleImpactInnerColor
                  : BATTLE_FEEDBACK.impactInnerColor,
              },
            ]} />
          </View>
        );
      })}

      {event.amount ? (
        <Text numberOfLines={1} style={[
          styles.damageText,
          {
            color: BATTLE_FEEDBACK.damageTextColor,
            fontSize: BATTLE_FEEDBACK.damageTextFontSize,
            width: BATTLE_FEEDBACK.damageTextWidth,
            left: (
              BATTLE_FEEDBACK.impactEffectSize - BATTLE_FEEDBACK.damageTextWidth
            ) / 2,
            opacity: 1 - overallProgress,
            textShadowColor: BATTLE_FEEDBACK.damageTextOutlineColor,
            textShadowRadius: BATTLE_FEEDBACK.impactRingBorderWidth,
            transform: [{
              translateY: -BATTLE_FEEDBACK.damageTextRisePixels * overallProgress,
            }],
          },
        ]}>-{formatNumber(event.amount)}</Text>
      ) : null}
    </View>
  );
}

const BattleBotFormation = React.memo(function BattleBotFormation({
  bots,
}: {
  bots: ActiveBot[];
}) {
  return (
    <>
      {bots.map((bot, index) => {
        const slot = BATTLE_RULES.botFormationSlots[
          index % BATTLE_RULES.botFormationSlots.length
        ];
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
    </>
  );
});

interface BattleScreenProps {
  onReturnToGame: () => void;
}

export function BattleScreen({ onReturnToGame }: BattleScreenProps) {
  const { state: game, stats, discoverMonster, completeBattle, useGiantDisc } = useGame();
  const { width: screenWidth } = useWindowDimensions();
  const feedback = useFeedback();
  const baseDifficulty = getDifficulty(game.selectedDifficultyId);
  const difficultyProgress = getDifficultyProgress(game, baseDifficulty.id);
  const difficulty = useMemo(
    () => getBattleDifficulty(baseDifficulty, difficultyProgress.wins),
    [baseDifficulty, difficultyProgress.wins],
  );
  const battleMap = useMemo(
    () => getBattleMapForBattle(baseDifficulty.id, difficultyProgress.currentBattleNumber),
    [baseDifficulty.id, difficultyProgress.currentBattleNumber],
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

  const remainingEnemyCount = useMemo(() => engine.state.enemies.filter(
    (enemy) => enemy.hp > 0,
  ).length, [engine.state.enemies]);
  const displayedBoss = engine.state.enemies.find((enemy) => enemy.hp > 0)
    ?? engine.state.enemies[0];
  const hasWeapon = discAvailable && activeBots.length > 0;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={getBattleMapImageSource(battleMap.imageKey)}
        resizeMode="cover"
        style={[
          styles.field,
          {
            transform: [
              { translateX: bossSpecialAttackScreenShake },
              { translateY: Math.abs(bossSpecialAttackScreenShake) },
            ],
          },
        ]}
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
            <HealthBar
              value={displayedBoss.hp}
              max={displayedBoss.maxHp}
              width={screenWidth * BATTLE_UI.bossHealthWidthRatio}
              height={BATTLE_UI.bossHealthBarHeight}
            />
          </View>
        ) : null}

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
          const distanceToCastle = Math.hypot(
            enemy.x - BATTLE_RULES.playerStartX,
            enemy.y - BATTLE_RULES.playerStartY,
          );
          const alreadyFlying = engine.state.enemyProjectiles.some(
            (projectile) => projectile.sourceEnemyId === enemy.id,
          );
          const effectiveAttackCooldownMs = engine.enemyDisc.cooldownMs
            * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
            * (enemy.enraged ? BOSS_BEHAVIOR.enrageAttackCooldownMultiplier : 1);
          const timeUntilAttackMs = effectiveAttackCooldownMs
            - (engine.state.now - enemy.lastShotAt);
          const effectiveMeleeCooldownMs = BATTLE_RULES.enemyMeleeIntervalMs
            * BOSS_BEHAVIOR.globalAttackCooldownMultiplier
            * (enemy.enraged ? BOSS_BEHAVIOR.enrageAttackCooldownMultiplier : 1);
          const timeUntilMeleeMs = effectiveMeleeCooldownMs
            - (engine.state.now - enemy.lastMeleeAt);
          const timeUntilSpecialAttackMs = BOSS_SPECIAL_ATTACK.intervalMs
            - (engine.state.now - enemy.lastSpecialAttackAt);
          const projectileWindupVisible = engine.state.status === 'active'
            && distanceToCastle <= BATTLE_RULES.enemyAttackRadius
            && !alreadyFlying
            && timeUntilAttackMs > 0
            && timeUntilAttackMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
          const meleeWindupVisible = engine.state.status === 'active'
            && enemy.y >= BATTLE_RULES.enemyMeleeTriggerY
            && timeUntilMeleeMs > 0
            && timeUntilMeleeMs <= BATTLE_FEEDBACK.enemyAttackWindupMs;
          const specialWindupVisible = engine.state.status === 'active'
            && distanceToCastle <= BATTLE_RULES.enemyAttackRadius
            && !alreadyFlying
            && timeUntilSpecialAttackMs > 0
            && timeUntilSpecialAttackMs <= BOSS_SPECIAL_ATTACK.windupMs;
          const windupVisible = projectileWindupVisible
            || meleeWindupVisible
            || specialWindupVisible;
          const windupProgress = Math.max(
            projectileWindupVisible
              ? 1 - timeUntilAttackMs / BATTLE_FEEDBACK.enemyAttackWindupMs
              : 0,
            meleeWindupVisible
              ? 1 - timeUntilMeleeMs / BATTLE_FEEDBACK.enemyAttackWindupMs
              : 0,
            specialWindupVisible
              ? 1 - timeUntilSpecialAttackMs / BOSS_SPECIAL_ATTACK.windupMs
              : 0,
          );
          const specialAttackProgress = getBossSpecialAttackProgress(
            enemy.lastSpecialAttackAt,
            enemy.spawnAt,
            engine.state.now,
          );
          const specialAttackVisible = specialAttackProgress !== null;
          const specialAttackPose = getBossSpecialAttackPose(specialAttackProgress ?? 1);
          const targetsThisEnemy = lastEvent?.sourceEnemyId === enemy.id || (
            lastEvent?.x !== undefined
            && lastEvent.y !== undefined
            && Math.abs(lastEvent.x - enemy.x) <= BATTLE_RULES.playerHitToleranceX
            && Math.abs(lastEvent.y - enemy.y) <= BATTLE_RULES.playerHitToleranceY
          );
          const attackVisible = Boolean(
            targetsThisEnemy
            && (
              lastEvent?.kind === 'enemyDisc'
              || (lastEvent?.kind === 'castleHit' && lastEvent.attackKind === 'melee')
            )
            && lastEventAgeMs <= BATTLE_FEEDBACK.enemyAttackDurationMs,
          );
          const attackProgress = attackVisible
            ? Math.min(1, lastEventAgeMs / BATTLE_FEEDBACK.enemyAttackDurationMs)
            : 1;
          const attackWave = attackVisible ? Math.sin(attackProgress * Math.PI) : 0;
          const hitVisible = Boolean(
            targetsThisEnemy
            && ['enemyHit', 'bossEnraged', 'enemyDefeated'].includes(lastEvent?.kind ?? '')
            && lastEventAgeMs <= BATTLE_FEEDBACK.enemyHitDurationMs,
          );
          const hitProgress = hitVisible
            ? Math.min(1, lastEventAgeMs / BATTLE_FEEDBACK.enemyHitDurationMs)
            : 1;
          const hitWave = hitVisible ? Math.sin(hitProgress * Math.PI) : 0;
          const translateX = hitVisible
            ? Math.sin(
              hitProgress * Math.PI * BATTLE_FEEDBACK.enemyHitShakeCycles,
            ) * BATTLE_FEEDBACK.enemyHitShakePixels * (1 - hitProgress)
            : attackVisible
              ? Math.sin(
                attackProgress * Math.PI * BATTLE_FEEDBACK.enemyAttackShakeCycles,
              ) * BATTLE_FEEDBACK.enemyAttackLungePixels * (1 - attackProgress)
              : 0;
          const translateY = specialAttackVisible
            ? specialAttackPose.translateY
            : attackWave * BATTLE_FEEDBACK.enemyAttackLungePixels;
          const scaleX = specialAttackVisible
            ? specialAttackPose.scaleX
            : hitVisible
            ? 1 - (1 - BATTLE_FEEDBACK.enemyHitScale) * hitWave
            : attackVisible
              ? 1 + (BATTLE_FEEDBACK.enemyAttackScale - 1) * attackWave
              : 1 + (BATTLE_FEEDBACK.enemyAttackWindupScale - 1) * windupProgress;
          const scaleY = specialAttackVisible ? specialAttackPose.scaleY : scaleX;
          const enragePulse = enemy.enraged
            ? 1 + Math.sin(
              engine.state.now / BATTLE_FEEDBACK.enemyAttackDurationMs * Math.PI * 2,
            ) * BATTLE_FEEDBACK.enragePulseScale
            : 1;
          const auraSize = renderSize * BATTLE_FEEDBACK.auraSizeMultiplier;
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
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: `${specialAttackVisible ? specialAttackPose.rotationDeg : 0}deg` },
                    { scaleX },
                    { scaleY },
                  ],
                },
              ]}
            >
              <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
              <HealthBar value={enemy.hp} max={enemy.maxHp} width={BATTLE_UI.enemyHealthWidth} />
              <View style={[styles.enemySpriteFrame, { width: renderSize, height: renderSize }]}>
                {enemy.enraged || windupVisible || attackVisible || specialAttackVisible ? (
                  <View
                    style={[
                      styles.enemyAttackAura,
                      {
                        width: auraSize,
                        height: auraSize,
                        left: (renderSize - auraSize) / 2,
                        top: (renderSize - auraSize) / 2,
                        borderWidth: BATTLE_FEEDBACK.attackAuraBorderWidth,
                        borderColor: enemy.enraged
                          ? BATTLE_FEEDBACK.enrageAuraBorderColor
                          : BATTLE_FEEDBACK.attackAuraBorderColor,
                        backgroundColor: enemy.enraged
                          ? BATTLE_FEEDBACK.enrageAuraColor
                          : BATTLE_FEEDBACK.attackAuraColor,
                        transform: [{ scale: enragePulse }],
                      },
                    ]}
                  />
                ) : null}
                <MonsterSprite imageKey={enemy.imageKey} size={renderSize} grounded />
                {specialAttackProgress !== null ? (
                  <BossHammerSmashEffect size={renderSize} progress={specialAttackProgress} />
                ) : null}
              </View>
            </View>
          );
        })}

        {engine.state.enemyProjectiles.map((projectile) => {
          const isSpecialAttack = projectile.attackKind === 'special';
          return (
          <View
            key={projectile.id}
            style={[
              styles.projectile,
              styles.enemyProjectile,
              isSpecialAttack && {
                borderColor: BOSS_SPECIAL_ATTACK.projectileBorderColor,
                backgroundColor: BOSS_SPECIAL_ATTACK.projectileBackgroundColor,
                shadowColor: BOSS_SPECIAL_ATTACK.projectileGlowColor,
                shadowRadius: BOSS_SPECIAL_ATTACK.projectileGlowRadius,
                shadowOpacity: 1,
                elevation: 12,
                transform: [{ scale: BOSS_SPECIAL_ATTACK.projectileScale }],
              },
              {
                left: `${projectile.x * 100}%`,
                top: `${projectile.y * 100}%`,
                width: projectile.size,
                height: projectile.size,
                marginLeft: -projectile.size / 2,
                marginTop: -projectile.size / 2,
              },
            ]}
          >
            <View
              style={[
                styles.enemyProjectileTrail,
                {
                  width: projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailWidthMultiplier,
                  height: projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailLengthMultiplier,
                  top: -projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailLengthMultiplier,
                  opacity: BATTLE_FEEDBACK.enemyProjectileTrailOpacity,
                  backgroundColor: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileTrailColor
                    : BATTLE_FEEDBACK.attackAuraBorderColor,
                  shadowColor: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileGlowColor
                    : BATTLE_FEEDBACK.screenFlashColor,
                  shadowRadius: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileGlowRadius
                    : BATTLE_FEEDBACK.enemyProjectileGlowRadius,
                },
              ]}
            />
            <View style={{
              transform: [{ rotate: `${((engine.state.now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` }],
            }}>
              <DiscImage size={projectile.size - BATTLE_FEEDBACK.impactRingBorderWidth} team="enemy" />
            </View>
          </View>
          );
        })}

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

        {engine.state.playerProjectiles.map((projectile) => {
          const isGiant = projectile.source === 'giant';
          const renderedMaximum = projectile.source === 'bot'
            ? BATTLE_RULES.maxRenderedPlayerDiscSize * BATTLE_RULES.botDiscSizeMultiplier
            : BATTLE_RULES.maxRenderedPlayerDiscSize;
          const renderedSize = isGiant
            ? giantDiscRenderSize
            : Math.min(projectile.size, renderedMaximum);
          const pulseProgress = (
            (engine.state.now - projectile.createdAt) % GIANT_DISC.effectPulseDurationMs
          ) / GIANT_DISC.effectPulseDurationMs;
          const pulseScale = isGiant
            ? 1 + Math.sin(pulseProgress * Math.PI * 2) * GIANT_DISC.effectPulseScale
            : 1;
          return (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                projectile.source === 'castle' && styles.castleProjectile,
                isGiant && styles.giantProjectile,
                isGiant && { shadowColor: GIANT_DISC.effectGlowColor },
                {
                  left: `${projectile.x * 100}%`,
                  top: `${projectile.y * 100}%`,
                  marginLeft: -renderedSize / 2,
                  marginTop: -renderedSize / 2,
                  width: renderedSize,
                  height: renderedSize,
                  transform: [
                    { rotate: `${((engine.state.now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` },
                    { scale: pulseScale },
                  ],
                },
              ]}
            >
              {projectile.source === 'castle' ? <Text style={styles.doubleDamage}>2배</Text> : null}
              {isGiant ? (
                <>
                  <View style={[styles.giantAuraOuter, {
                    borderColor: GIANT_DISC.effectOuterColor,
                    borderWidth: GIANT_DISC.effectRingBorderWidth,
                    backgroundColor: GIANT_DISC.effectOuterFillColor,
                  }]} />
                  <View style={[styles.giantAuraInner, {
                    borderColor: GIANT_DISC.effectInnerColor,
                    borderWidth: GIANT_DISC.effectRingBorderWidth / 2,
                    backgroundColor: GIANT_DISC.effectInnerFillColor,
                  }]} />
                  <Text style={[styles.giantDamage, {
                    color: GIANT_DISC.effectGlowColor,
                    textShadowColor: GIANT_DISC.effectTextShadowColor,
                  }]}>{GIANT_DISC.damageMultiplier}배</Text>
                </>
              ) : null}
              <DiscImage size={renderedSize} />
            </View>
          );
        })}

        {engine.state.status === 'active' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`거대 원반 사용, ${game.giantDiscCount}개 보유`}
            disabled={game.giantDiscCount <= 0 || !engine.canGiantThrow}
            onPress={() => {
              if (game.giantDiscCount <= 0 || !engine.canGiantThrow) return;
              if (useGiantDisc() && engine.throwGiantDisc()) feedback.tap();
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
          accessibilityHint="전투 중 누를 때만 쿠키봇 원반의 두 배 피해로 공격합니다"
          disabled={!engine.canCastleThrow}
          onPress={() => {
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
            <Text style={styles.readyText}>거대한 보스 한 마리가 쿠키 성을 노려요!</Text>
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
  mapImage: { borderRadius: 21 },
  compactHud: { position: 'absolute', top: 5, left: 6, right: 6, zIndex: 2000, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(42,83,153,0.82)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  enemyHud: { fontFamily: fonts.extraBold, fontSize: 9, color: colors.white, backgroundColor: 'rgba(167,37,48,0.84)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  enemy: { position: 'absolute', alignItems: 'center' },
  enemySpriteFrame: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  enemyAttackAura: { position: 'absolute', borderRadius: 999, borderStyle: 'dashed', elevation: 5 },
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
  giantProjectile: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, shadowOpacity: 1, shadowRadius: 24, elevation: 18 },
  giantAuraOuter: { position: 'absolute', width: '116%', height: '116%', borderRadius: 999, opacity: 0.82 },
  giantAuraInner: { position: 'absolute', width: '92%', height: '92%', borderRadius: 999, opacity: 0.9 },
  giantDamage: { position: 'absolute', top: -18, fontFamily: fonts.display, fontSize: 18, textShadowRadius: 8, zIndex: 3 },
  doubleDamage: { position: 'absolute', top: -9, alignSelf: 'center', zIndex: 2, fontFamily: fonts.extraBold, fontSize: 8, color: colors.blueDark, backgroundColor: colors.white, borderRadius: 5, paddingHorizontal: 3 },
  enemyProjectile: { borderWidth: 2, borderColor: colors.red, borderRadius: 30, backgroundColor: 'rgba(255,224,227,0.62)', alignItems: 'center', justifyContent: 'center' },
  enemyProjectileTrail: { position: 'absolute', alignSelf: 'center', borderRadius: 999, shadowOpacity: 1, elevation: 8 },
  impactEffect: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 2450 },
  impactBurst: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  fieldShockwave: { position: 'absolute', borderRadius: 999 },
  impactOuter: { ...StyleSheet.absoluteFill, borderRadius: 999 },
  impactSpark: { position: 'absolute', borderRadius: 999 },
  impactInner: { borderRadius: 999 },
  damageText: { position: 'absolute', top: 0, fontFamily: fonts.display, textAlign: 'center', zIndex: 3 },
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
