import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { CookieImage } from '../components/CookieImage';
import { MINI_GAME, getCookie } from '../config';
import {
  adjustMiniGameDuration,
  getMiniGamePlayer,
  getMiniGameWinner,
  getNextMiniGamePhaseAfterTimer,
} from '../domain/miniGame';
import { useFeedback } from '../services/FeedbackContext';
import { useGame } from '../state/GameContext';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { MiniGamePhase, MiniGameScores } from '../types/game';
import { formatNumber } from '../utils/format';
import { useMiniGamePhaseTimer } from './miniGame/useMiniGamePhaseTimer';

const INITIAL_SCORES: MiniGameScores = { A: 0, B: 0 };

export function MiniGameScreen() {
  const { stats } = useGame();
  const feedback = useFeedback();
  const [phase, setPhase] = useState<MiniGamePhase>('setup');
  const [durationSeconds, setDurationSeconds] = useState(
    MINI_GAME.defaultDurationSeconds,
  );
  const [scores, setScores] = useState<MiniGameScores>(INITIAL_SCORES);
  const cookieScale = useRef(new Animated.Value(1)).current;
  const player = getMiniGamePlayer(phase);
  const countdown = phase === 'countdownA' || phase === 'countdownB';
  const playing = phase === 'playingA' || phase === 'playingB';
  const timedPhaseDurationMs = countdown
    ? MINI_GAME.countdownSeconds * 1_000
    : playing
      ? durationSeconds * 1_000
      : 0;

  const finishTimedPhase = useCallback(() => {
    setPhase((current) => getNextMiniGamePhaseAfterTimer(current));
    feedback.success();
  }, [feedback]);
  const timer = useMiniGamePhaseTimer({
    active: countdown || playing,
    durationMs: timedPhaseDurationMs,
    refreshIntervalMs: MINI_GAME.timerRefreshIntervalMs,
    onFinished: finishTimedPhase,
  });

  const startA = useCallback(() => {
    setScores(INITIAL_SCORES);
    setPhase('countdownA');
    feedback.play('menu');
  }, [feedback]);
  const startB = useCallback(() => {
    setPhase('countdownB');
    feedback.play('menu');
  }, [feedback]);
  const resetSetup = useCallback(() => {
    setScores(INITIAL_SCORES);
    setPhase('setup');
  }, []);
  const changeDuration = useCallback((direction: -1 | 1) => {
    setDurationSeconds((current) => adjustMiniGameDuration(current, direction, MINI_GAME));
    feedback.play('menu');
    feedback.tap();
  }, [feedback]);
  const pressCookie = useCallback(() => {
    if (!playing || !player || !timer.acceptsClick()) return;
    setScores((current) => ({ ...current, [player]: current[player] + 1 }));
    feedback.playCookieClick('normal');
    feedback.tap();
    cookieScale.stopAnimation();
    Animated.sequence([
      Animated.timing(cookieScale, {
        toValue: MINI_GAME.pressedCookieScale,
        duration: MINI_GAME.pressInDurationMs,
        useNativeDriver: true,
      }),
      Animated.spring(cookieScale, {
        toValue: 1,
        speed: MINI_GAME.releaseSpringSpeed,
        bounciness: MINI_GAME.releaseSpringBounciness,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cookieScale, feedback, player, playing, timer]);

  const activeCookie = getCookie(stats.activeCookieId);
  const secondsRemaining = Math.max(0, Math.ceil(timer.remainingMs / 1_000));
  const timerRatio = playing
    ? Math.min(1, timer.remainingMs / (durationSeconds * 1_000))
    : 1;
  const winner = useMemo(() => getMiniGameWinner(scores), [scores]);

  if (phase === 'setup') {
    return (
      <View style={styles.card}>
        <MaterialCommunityIcons name="account-group" size={58} color={colors.purple} />
        <Text style={styles.title}>A·B 쿠키 클릭 대결</Text>
        <Text style={styles.description}>A가 먼저 도전하고, 같은 시간 동안 B가 이어서 도전해요.</Text>
        <Text style={styles.settingLabel}>제한 시간</Text>
        <View style={styles.durationRow}>
          <RoundButton
            label="10초 줄이기"
            icon="minus"
            disabled={durationSeconds === MINI_GAME.minimumDurationSeconds}
            onPress={() => changeDuration(-1)}
          />
          <Text style={styles.duration}>{durationSeconds}초</Text>
          <RoundButton
            label="10초 늘리기"
            icon="plus"
            disabled={durationSeconds === MINI_GAME.maximumDurationSeconds}
            onPress={() => changeDuration(1)}
          />
        </View>
        <ActionButton label="A부터 시작" onPress={startA} colors={gradients.blue} />
        <Text style={styles.notice}>미니게임 점수는 보유 쿠키에 합산되지 않아요.</Text>
      </View>
    );
  }

  if (phase === 'handoff') {
    return (
      <View style={styles.card}>
        <Text style={[styles.playerTitle, styles.playerA]}>A 완료!</Text>
        <Text style={styles.bigScore}>{formatNumber(scores.A)}개</Text>
        <Text style={styles.description}>폰을 B에게 넘겨주세요.</Text>
        <ActionButton label="B 준비 완료" onPress={startB} colors={gradients.red} />
      </View>
    );
  }

  if (phase === 'result') {
    const resultLabel = winner === 'draw' ? '무승부!' : `${winner} 승리!`;
    return (
      <View style={styles.card}>
        <MaterialCommunityIcons
          name={winner === 'draw' ? 'handshake' : 'trophy'}
          size={64}
          color={winner === 'draw' ? colors.purple : colors.yellowDark}
        />
        <Text style={styles.resultTitle}>{resultLabel}</Text>
        <View style={styles.scoreComparison}>
          <ScoreCard player="A" score={scores.A} winner={winner === 'A'} />
          <Text style={styles.versus}>VS</Text>
          <ScoreCard player="B" score={scores.B} winner={winner === 'B'} />
        </View>
        <ActionButton label="같은 시간으로 다시 하기" onPress={startA} colors={gradients.green} />
        <Pressable accessibilityRole="button" onPress={resetSetup} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>시간 다시 설정</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.playRoot}>
      <Text style={[styles.playerTitle, player === 'A' ? styles.playerA : styles.playerB]}>
        {player} 차례
      </Text>
      {player === 'B' ? <Text style={styles.target}>A 기록 {formatNumber(scores.A)}개</Text> : null}
      {countdown ? (
        <View style={styles.countdownWrap}>
          <Text style={styles.countdown}>{secondsRemaining}</Text>
          <Text style={styles.ready}>준비!</Text>
        </View>
      ) : (
        <>
          <Text style={styles.timer}>{secondsRemaining}초</Text>
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${timerRatio * 100}%` }]} />
          </View>
          <Text style={styles.liveScore}>{formatNumber(scores[player!])}개</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${player} 쿠키 클릭`}
            onPressIn={pressCookie}
            android_disableSound
            style={styles.cookiePressArea}
          >
            <Animated.View style={{ transform: [{ scale: cookieScale }] }}>
              <LinearGradient colors={gradients.cookieButton} style={styles.cookieButton}>
                <CookieImage imageKey={activeCookie.imageKey} size={MINI_GAME.cookieSizePixels} />
              </LinearGradient>
            </Animated.View>
          </Pressable>
          <Text style={styles.tapLabel}>빠르게 눌러요!</Text>
        </>
      )}
    </View>
  );
}

function RoundButton({ label, icon, disabled, onPress }: {
  label: string;
  icon: 'minus' | 'plus';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.roundButton, disabled && styles.disabled]}
    >
      <MaterialCommunityIcons name={icon} size={34} color={colors.white} />
    </Pressable>
  );
}

function ActionButton({ label, onPress, colors: buttonColors }: {
  label: string;
  onPress: () => void;
  colors: readonly [string, string];
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionPressable}>
      <LinearGradient colors={buttonColors} style={styles.actionButton}>
        <Text style={styles.actionText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function ScoreCard({ player, score, winner }: { player: 'A' | 'B'; score: number; winner: boolean }) {
  return (
    <View style={[styles.scoreCard, player === 'A' ? styles.scoreCardA : styles.scoreCardB]}>
      <Text style={[styles.scorePlayer, player === 'A' ? styles.playerA : styles.playerB]}>
        {winner ? '👑 ' : ''}{player}
      </Text>
      <Text style={styles.scoreValue}>{formatNumber(score)}개</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
    padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2, borderColor: colors.line,
  },
  title: { fontFamily: fonts.display, fontSize: 29, color: colors.chocolate, textAlign: 'center' },
  description: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted, textAlign: 'center' },
  settingLabel: { marginTop: 12, fontFamily: fonts.extraBold, fontSize: 17, color: colors.ink },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  duration: { minWidth: 100, fontFamily: fonts.display, fontSize: 34, color: colors.chocolate, textAlign: 'center' },
  roundButton: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  actionPressable: { width: '88%', maxWidth: 340, marginTop: 12 },
  actionButton: { minHeight: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  actionText: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  notice: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center' },
  playerTitle: { fontFamily: fonts.display, fontSize: 34, textAlign: 'center' },
  playerA: { color: colors.blue },
  playerB: { color: colors.red },
  bigScore: { fontFamily: fonts.display, fontSize: 58, color: colors.chocolate },
  resultTitle: { fontFamily: fonts.display, fontSize: 38, color: colors.chocolate },
  scoreComparison: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scoreCard: { flex: 1, maxWidth: 150, minHeight: 122, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  scoreCardA: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  scoreCardB: { backgroundColor: colors.redSoft, borderColor: colors.red },
  scorePlayer: { fontFamily: fonts.display, fontSize: 26 },
  scoreValue: { fontFamily: fonts.extraBold, fontSize: 21, color: colors.ink },
  versus: { fontFamily: fonts.display, fontSize: 20, color: colors.purple },
  secondaryButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 22 },
  secondaryButtonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.purple },
  playRoot: { flex: 1, alignItems: 'center', paddingTop: 8 },
  target: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.muted },
  countdownWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdown: { fontFamily: fonts.display, fontSize: 128, color: colors.orange },
  ready: { fontFamily: fonts.display, fontSize: 30, color: colors.chocolate },
  timer: { fontFamily: fonts.display, fontSize: 30, color: colors.chocolate },
  timerTrack: { width: '88%', height: 13, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: colors.chocolate, backgroundColor: colors.white },
  timerFill: { height: '100%', backgroundColor: colors.green },
  liveScore: { fontFamily: fonts.display, fontSize: 36, color: colors.chocolate, marginTop: 4 },
  cookiePressArea: { flex: 1, width: '100%', minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  cookieButton: { width: 250, height: 250, borderRadius: 125, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: colors.yellow, elevation: 8 },
  tapLabel: { marginBottom: 6, fontFamily: fonts.display, fontSize: 21, color: colors.orange },
});
