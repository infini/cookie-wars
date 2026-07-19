import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '../services/FeedbackContext';
import { useClickerRobotAudio } from '../services/useClickerRobotAudio';
import { useGame } from '../state/GameContext';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from '../components/CookieImage';
import { CookieFragmentCollectible } from '../components/CookieFragmentCollectible';
import { ClickerRobotFormation } from '../components/ClickerRobotFormation';
import { FlyingFragmentCollector } from '../components/FlyingFragmentCollector';
import { StatChip } from '../components/StatChip';
import {
  COOKIE_FEEDBACK,
  CLICKER_ROBOTS,
  COOKIE_INPUT,
  getCookie,
  getCookieSpecialEffect,
} from '../config';
import { getBattleMedalBonuses, getCookieEvolutionProgress } from '../domain/gameSelectors';
import { formatCriticalChancePercent } from '../domain/cookieCritical';
import { formatSuperCriticalChancePercent } from '../domain/cookieSuperCritical';
import {
  formatCookieFragmentChancePercent,
  getCookieFragmentStats,
} from '../domain/cookieFragments';
import type { CookieFragmentRewardResult } from '../types/game';
import { CookieGainFeedback, CookieGainItem } from './game/CookieGainFeedback';
import { CookieRareStats } from './game/CookieRareStats';
import {
  CookieSpecialFeedback,
  CookieSpecialFeedbackItem,
} from './game/CookieSpecialFeedback';
import { useImmediateCookiePress } from './game/useImmediateCookiePress';
import { useCookieFragmentCollection } from './game/useCookieFragmentCollection';

export function GameScreen() {
  const { state, stats, clickCookie, claimCookieFragment } = useGame();
  const feedback = useFeedback();
  const scale = useRef(new Animated.Value(1)).current;
  const stageShake = useRef(new Animated.Value(0)).current;
  const nextGainId = useRef(0);
  const nextSpecialId = useRef(0);
  const [gains, setGains] = useState<CookieGainItem[]>([]);
  const [specialFeedbacks, setSpecialFeedbacks] = useState<CookieSpecialFeedbackItem[]>([]);
  const removeGain = useCallback((id: number) => {
    setGains((current) => current.filter((item) => item.id !== id));
  }, []);
  const activeCookie = getCookie(stats.activeCookieId);
  const evolution = getCookieEvolutionProgress(state);
  const medalBonuses = getBattleMedalBonuses(state);
  const magmaFragment = getCookieFragmentStats(state, 'magma');
  const electricFragment = getCookieFragmentStats(state, 'electric');
  const uniformMedalBonus = medalBonuses.clickPowerBonusPercent
    === medalBonuses.autoProductionBonusPercent
    && medalBonuses.clickPowerBonusPercent
      === medalBonuses.castleHealthBonusPercent;
  const clickerClicksPerSecondPerRobot = stats.clickerRobotCount > 0
    ? stats.clickerRobotClicksPerSecond / stats.clickerRobotCount
    : 0;
  useClickerRobotAudio({
    robotCount: stats.clickerRobotCount,
    clicksPerSecondPerRobot: clickerClicksPerSecondPerRobot,
    soundEnabled: state.soundEnabled,
    soundVolumeLevel: state.soundVolumeLevel,
  });

  const showSpecialFeedback = useCallback((item: Omit<CookieSpecialFeedbackItem, 'id'>) => {
    const next = { ...item, id: nextSpecialId.current++ };
    setSpecialFeedbacks((current) => [
      ...current.filter((active) => active.kind !== next.kind),
      next,
    ]);
    if (item.kind === 'superCritical' && item.feedbackTier === 'superCriticalFull') {
      stageShake.stopAnimation();
      stageShake.setValue(0);
      Animated.timing(stageShake, {
        toValue: 1,
        duration: getCookieSpecialEffect('superCritical').durationMs,
        useNativeDriver: true,
      }).start();
    }
  }, [stageShake]);
  const handleFragmentReward = useCallback((reward: CookieFragmentRewardResult) => {
    feedback.playCookieFragment(reward.kind);
    feedback.success();
    showSpecialFeedback({
      kind: reward.kind,
      amount: reward.amount,
      multiplier: reward.multiplier,
    });
  }, [feedback, showSpecialFeedback]);
  const {
    activeFragment,
    spawnFragment,
    expireFragment,
    claimFragment,
  } = useCookieFragmentCollection({
    claimReward: claimCookieFragment,
    onReward: handleFragmentReward,
  });
  const handleCookiePress = useCallback(() => {
    const result = clickCookie();
    const feedbackTier = feedback.playCookieClick(result.kind);
    if (feedbackTier === 'criticalFull' || feedbackTier === 'superCriticalFull') {
      feedback.success();
    }
    else feedback.tap();
    const id = nextGainId.current++;
    setGains((current) => {
      const previousLimit = COOKIE_FEEDBACK.floatingGain.maximumConcurrent - 1;
      const source = result.kind === 'normal'
        ? current
        : current.filter((item) => item.kind !== result.kind);
      const previous = previousLimit > 0 ? source.slice(-previousLimit) : [];
      return [...previous, { id, ...result, feedbackTier }];
    });
    if (result.kind === 'critical' || result.kind === 'superCritical') {
      showSpecialFeedback({
        kind: result.kind,
        amount: result.amount,
        feedbackTier,
      });
    }
    if (result.spawnedFragmentKind) {
      spawnFragment(result.spawnedFragmentKind);
    }
    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.89, speed: 40, bounciness: 2, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 25, bounciness: 12, useNativeDriver: true }),
    ]).start();
  }, [clickCookie, feedback, scale, showSpecialFeedback, spawnFragment]);
  const handleSpecialDone = useCallback((id: number) => {
    setSpecialFeedbacks((current) => current.filter((item) => item.id !== id));
  }, []);
  const cookiePressHandlers = useImmediateCookiePress(handleCookiePress);
  const [stageTranslateX, stageTranslateY] = useMemo(() => {
    const superEffect = COOKIE_FEEDBACK.superCriticalShake;
    const inputRange = [
      0,
      superEffect.firstProgress,
      superEffect.secondProgress,
      superEffect.thirdProgress,
      superEffect.endProgress,
      1,
    ];
    return [
      stageShake.interpolate({
        inputRange,
        outputRange: [
          0,
          -superEffect.distancePixels,
          superEffect.distancePixels,
          -superEffect.distancePixels * superEffect.returnRatio,
          0,
          0,
        ],
      }),
      stageShake.interpolate({
        inputRange,
        outputRange: [
          0,
          superEffect.distancePixels * superEffect.returnRatio,
          -superEffect.distancePixels,
          superEffect.distancePixels,
          0,
          0,
        ],
      }),
    ];
  }, [stageShake]);

  return (
    <View style={styles.root}>
      <View style={styles.statsRow}>
        <StatChip icon="cookie" label="현재 쿠키" value={formatNumber(state.cookies)} />
        <StatChip icon="arrow-up-bold" label="진화 레벨" value={`Lv.${formatNumber(stats.cookieLevel)}`} tint={colors.purple} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`쿠키 얻기, 전투 훈장 ${formatNumber(medalBonuses.battleMedals)}개, 클릭 시 ${formatNumber(stats.clickPower)}개, 자동 생산 초당 ${formatNumber(stats.autoProduction)}개, 크리티컬 확률 ${formatCriticalChancePercent(stats.criticalChanceUnits)}퍼센트, 슈퍼 크리티컬 확률 ${formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}퍼센트, ${evolution.next ? `다음 진화까지 ${formatNumber(evolution.remainingLevels)}번 강화` : '최고 쿠키 진화 완료'}`}
        accessibilityHint="쿠키 영역을 두 번 탭하면 쿠키를 얻어요."
        {...cookiePressHandlers}
        android_disableSound
        hitSlop={COOKIE_INPUT.hitSlopPixels}
        pressRetentionOffset={COOKIE_INPUT.pressRetentionOffsetPixels}
        style={styles.hero}
      >
        <View style={styles.evolutionSummary}>
          <Text style={styles.evolutionRemaining}>
            {evolution.next
              ? `다음 진화까지 ${formatNumber(evolution.remainingLevels)}번 강화`
              : '최고 쿠키 진화 완료!'}
          </Text>
          <View style={styles.evolutionProgressTrack}>
            <View
              style={[
                styles.evolutionProgressFill,
                { width: `${evolution.progressRatio * 100}%` },
              ]}
            />
          </View>
        </View>
        <Animated.View style={{
          transform: [{ translateX: stageTranslateX }, { translateY: stageTranslateY }],
        }}>
          <View style={styles.cookieStage}>
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />
            <ClickerRobotFormation
              robotCount={stats.clickerRobotCount}
              clicksPerSecondPerRobot={clickerClicksPerSecondPerRobot}
            />
            <CookieGainFeedback gains={gains} onDone={removeGain} />
            <Animated.View style={{ transform: [{ scale }] }}>
              <LinearGradient colors={gradients.cookieButton} style={styles.cookieButton}>
                <CookieImage
                  imageKey={activeCookie.imageKey}
                  size={stats.cookieRenderSize}
                />
              </LinearGradient>
            </Animated.View>
            <CookieSpecialFeedback items={specialFeedbacks} onDone={handleSpecialDone} />
          </View>
        </Animated.View>
        <View style={styles.infoGroup}>
          <Text style={[styles.infoText, styles.medalInfo]}>
            🏅 전투 훈장 {formatNumber(medalBonuses.battleMedals)}개 · {uniformMedalBonus
              ? `쿠키 성장 +${formatNumber(medalBonuses.clickPowerBonusPercent)}%`
              : '영구 성장 보너스'}
          </Text>
          <Text style={[styles.infoText, styles.autoInfo]}>
            자동 생산 {formatNumber(stats.autoProduction)}개/초
          </Text>
          <Text style={[styles.infoText, styles.clickInfo]}>
            클릭 시 획득 개수 {formatNumber(stats.clickPower)}개
          </Text>
          <Text style={[styles.infoText, styles.clickerInfo]}>
            🔨 클릭커 로봇 {formatNumber(stats.clickerRobotCount)}대 · 초당 {formatNumber(stats.clickerRobotCookiesPerSecond)}개
          </Text>
          <Text style={[styles.infoText, styles.flyingInfo]}>
            🚁 플라잉 클릭커 {CLICKER_ROBOTS.flyingFragmentCollector.freeCount}대 · 쿠키 조각 자동 수집
          </Text>
          <CookieRareStats
            criticalChance={formatCriticalChancePercent(stats.criticalChanceUnits)}
            criticalMultiplier={formatNumber(stats.criticalRewardMultiplier)}
            superCriticalChance={formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}
            superCriticalMultiplier={formatNumber(stats.superCriticalRewardMultiplier)}
            magmaChance={formatCookieFragmentChancePercent(magmaFragment.chanceUnits, 'magma')}
            magmaMultiplier={formatNumber(magmaFragment.rewardMultiplier)}
            electricChance={formatCookieFragmentChancePercent(electricFragment.chanceUnits, 'electric')}
            electricMultiplier={formatNumber(electricFragment.rewardMultiplier)}
          />
        </View>
      </Pressable>

      {activeFragment ? (
        <CookieFragmentCollectible
          key={activeFragment.id}
          {...activeFragment}
          rewardMultiplier={activeFragment.kind === 'magma'
            ? magmaFragment.rewardMultiplier
            : electricFragment.rewardMultiplier}
          onClaim={claimFragment}
          onExpire={expireFragment}
        />
      ) : null}
      <FlyingFragmentCollector mission={activeFragment} onCollect={claimFragment} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingVertical: 4 },
  statsRow: { flexDirection: 'row', gap: 6 },
  hero: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 6,
  },
  evolutionRemaining: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.purple,
    textAlign: 'center',
  },
  evolutionSummary: { width: '92%', maxWidth: 360, alignItems: 'center' },
  evolutionProgressTrack: {
    width: '100%',
    height: 10,
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#D9BEFF',
  },
  evolutionProgressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.purple },
  cookieStage: { width: 358, height: 358, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(255, 200, 61, 0.22)', borderWidth: 3, borderColor: 'rgba(255, 169, 61, 0.32)',
  },
  ringInner: {
    position: 'absolute', width: 314, height: 314, borderRadius: 157,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cookieButton: {
    width: 310, height: 310, borderRadius: 155, alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#FFD97A', shadowColor: colors.shadow, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  infoGroup: { alignItems: 'center', maxWidth: '98%', gap: 2 },
  infoText: { fontFamily: fonts.extraBold, fontSize: 12, textAlign: 'center' },
  medalInfo: { color: colors.purple },
  autoInfo: { color: colors.muted },
  clickInfo: { color: colors.blue },
  clickerInfo: { color: colors.orange },
  flyingInfo: { color: colors.greenDark },
});
