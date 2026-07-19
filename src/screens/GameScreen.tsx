import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatNumber } from '../utils/format';
import { CookieImage } from '../components/CookieImage';
import { CookieFragmentCollectible } from '../components/CookieFragmentCollectible';
import { GameButton } from '../components/GameButton';
import { StatChip } from '../components/StatChip';
import { COOKIE_FEEDBACK, COOKIE_INPUT, getCookie } from '../config';
import { getBattleMedalBonuses, getCookieEvolutionProgress } from '../domain/gameSelectors';
import { formatCriticalChancePercent } from '../domain/cookieCritical';
import { formatSuperCriticalChancePercent } from '../domain/cookieSuperCritical';
import {
  formatCookieFragmentChancePercent,
  getCookieFragmentStats,
} from '../domain/cookieFragments';
import type { CookieFragmentRewardResult } from '../types/game';
import { CookieGainFeedback, CookieGainItem } from './game/CookieGainFeedback';
import {
  CookieSpecialFeedback,
  CookieSpecialFeedbackItem,
} from './game/CookieSpecialFeedback';
import { useImmediateCookiePress } from './game/useImmediateCookiePress';
import { useCookieFragmentCollection } from './game/useCookieFragmentCollection';

export function GameScreen({ onGoBattle }: { onGoBattle: () => void }) {
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
        duration: COOKIE_FEEDBACK.superCriticalEffect.durationMs,
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
    if (result.kind !== 'normal') {
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
    const superEffect = COOKIE_FEEDBACK.superCriticalEffect;
    const inputRange = [
      0,
      superEffect.shakeFirstProgress,
      superEffect.shakeSecondProgress,
      superEffect.shakeThirdProgress,
      superEffect.shakeEndProgress,
      1,
    ];
    return [
      stageShake.interpolate({
        inputRange,
        outputRange: [
          0,
          -superEffect.shakeDistancePixels,
          superEffect.shakeDistancePixels,
          -superEffect.shakeDistancePixels * superEffect.shakeReturnRatio,
          0,
          0,
        ],
      }),
      stageShake.interpolate({
        inputRange,
        outputRange: [
          0,
          superEffect.shakeDistancePixels * superEffect.shakeReturnRatio,
          -superEffect.shakeDistancePixels,
          superEffect.shakeDistancePixels,
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
        <StatChip icon="arrow-up-bold" label="진화 레벨" value={`Lv.${stats.cookieLevel}`} tint={colors.purple} />
        <StatChip icon="gesture-tap" label="한 번에" value={`+${formatNumber(stats.clickPower)}`} tint={colors.blue} />
      </View>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`전투 훈장 ${formatNumber(medalBonuses.battleMedals)}개, 클릭 힘 영구 보너스 ${formatNumber(medalBonuses.clickPowerBonusPercent)}퍼센트, 자동 생산 영구 보너스 ${formatNumber(medalBonuses.autoProductionBonusPercent)}퍼센트, 쿠키 성 체력 영구 보너스 ${formatNumber(medalBonuses.castleHealthBonusPercent)}퍼센트`}
        style={styles.medalPill}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.medalText}>
          🏅 전투 훈장 {formatNumber(medalBonuses.battleMedals)}개 · {uniformMedalBonus
            ? `쿠키 성장 +${formatNumber(medalBonuses.clickPowerBonusPercent)}%`
            : '영구 성장 보너스'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={evolution.next
          ? `쿠키 얻기, 한 번에 ${formatNumber(stats.clickPower)}개, 크리티컬 확률 ${formatCriticalChancePercent(stats.criticalChanceUnits)}퍼센트, 슈퍼 크리티컬 확률 ${formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}퍼센트, 다음 쿠키 ${evolution.next.name}, 현재 진화 ${evolution.totalUpgradeLevels}레벨, 필요 ${evolution.next.requiredTotalUpgradeLevels}레벨, ${evolution.remainingLevels}번 더 강화하면 진화합니다`
          : `쿠키 얻기, 한 번에 ${formatNumber(stats.clickPower)}개, 크리티컬 확률 ${formatCriticalChancePercent(stats.criticalChanceUnits)}퍼센트, 슈퍼 크리티컬 확률 ${formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}퍼센트, 현재 진화 ${evolution.totalUpgradeLevels}레벨, 최고 쿠키 진화를 완료했습니다`}
        accessibilityHint="화면 가운데 아무 곳이나 두 번 탭하면 쿠키를 얻어요. 강화 화면에 보이는 일곱 가지 강화는 모두 쿠키 진화 레벨을 올려요."
        {...cookiePressHandlers}
        android_disableSound
        hitSlop={COOKIE_INPUT.hitSlopPixels}
        pressRetentionOffset={COOKIE_INPUT.pressRetentionOffsetPixels}
        style={styles.hero}
      >
        <Text style={styles.guide}>가운데 어디든 눌러요!</Text>
        <View style={styles.evolutionSummary}>
          <Text style={styles.evolutionTitle}>
            {evolution.next
              ? `다음 쿠키 · ${evolution.next.name}`
              : '최고 쿠키 진화 완료!'}
          </Text>
          <Text style={styles.evolutionCondition}>
            {evolution.next
              ? `현재 진화 Lv.${evolution.totalUpgradeLevels} / 필요 Lv.${evolution.next.requiredTotalUpgradeLevels}`
              : `현재 진화 Lv.${evolution.totalUpgradeLevels}`}
          </Text>
          <View style={styles.evolutionProgressTrack}>
            <View
              style={[
                styles.evolutionProgressFill,
                { width: `${evolution.progressRatio * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.evolutionProgressText}>
            {evolution.next
              ? `쿠키 강화에서 ${evolution.remainingLevels}번만 더 강화하면 진화!`
              : '모든 쿠키 진화를 완료했어요!'}
          </Text>
        </View>
        <Animated.View style={{
          transform: [{ translateX: stageTranslateX }, { translateY: stageTranslateY }],
        }}>
          <View style={styles.cookieStage}>
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />
            <CookieGainFeedback gains={gains} onDone={removeGain} />
            <CookieSpecialFeedback items={specialFeedbacks} onDone={handleSpecialDone} />
            <Animated.View style={{ transform: [{ scale }] }}>
              <LinearGradient colors={gradients.cookieButton} style={styles.cookieButton}>
                <CookieImage
                  imageKey={activeCookie.imageKey}
                  size={stats.cookieRenderSize}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>
        <Text style={styles.autoText}>
          자동 생산 {formatNumber(stats.autoProduction)}개/초
        </Text>
        <Text style={styles.criticalInfo}>
          💥 크리티컬 {formatCriticalChancePercent(stats.criticalChanceUnits)}% · 획득 ×{formatNumber(stats.criticalRewardMultiplier)}
        </Text>
        <Text style={styles.superCriticalInfo}>
          ✨ 슈퍼 {formatSuperCriticalChancePercent(stats.superCriticalChanceUnits)}% · 획득 ×{formatNumber(stats.superCriticalRewardMultiplier)}
        </Text>
        <Text style={styles.fragmentInfo}>
          🔥 조각 {formatCookieFragmentChancePercent(magmaFragment.chanceUnits, 'magma')}% · ×{formatNumber(magmaFragment.rewardMultiplier)}
          {'  '}⚡ {formatCookieFragmentChancePercent(electricFragment.chanceUnits, 'electric')}% · ×{formatNumber(electricFragment.rewardMultiplier)}
        </Text>
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

      <GameButton title="⚔ 전투하러 가기" onPress={onGoBattle} variant="red" style={styles.battleButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingVertical: 4 },
  statsRow: { flexDirection: 'row', gap: 6 },
  medalPill: { alignSelf: 'center', maxWidth: '94%', minHeight: 30, justifyContent: 'center', marginTop: 4, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#D9BEFF' },
  medalText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.purple, textAlign: 'center' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  guide: { fontFamily: fonts.display, fontSize: 25, color: colors.cookieDark, marginBottom: 4 },
  evolutionSummary: { width: '92%', maxWidth: 360, alignItems: 'center', marginBottom: 2, paddingHorizontal: 2 },
  evolutionTitle: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.purple, textAlign: 'center' },
  evolutionCondition: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, textAlign: 'center', marginTop: 2 },
  evolutionProgressTrack: { width: '100%', height: 10, borderRadius: 5, backgroundColor: colors.white, overflow: 'hidden', marginTop: 5 },
  evolutionProgressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.purple },
  evolutionProgressText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.cookieDark, marginTop: 3, textAlign: 'center' },
  cookieStage: { width: 286, height: 286, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute', width: 278, height: 278, borderRadius: 139,
    backgroundColor: 'rgba(255, 200, 61, 0.22)', borderWidth: 3, borderColor: 'rgba(255, 169, 61, 0.32)',
  },
  ringInner: {
    position: 'absolute', width: 244, height: 244, borderRadius: 122,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cookieButton: {
    width: 225, height: 225, borderRadius: 113, alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#FFD97A', shadowColor: colors.shadow, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  autoText: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, marginTop: 2 },
  criticalInfo: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.red, marginTop: 2 },
  superCriticalInfo: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.purple, marginTop: 1 },
  fragmentInfo: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.cookieDark, marginTop: 1 },
  battleButton: { marginHorizontal: 10, marginBottom: 2 },
});
