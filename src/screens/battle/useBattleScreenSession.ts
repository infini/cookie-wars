import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BATTLE_AUTO,
  DIFFICULTIES,
  getBattleMapForDifficulty,
  getCookie,
  getDifficulty,
  getEnemyWaveMonsterIds,
} from '../../config';
import {
  getActiveBots,
  getBattleDifficulty,
  getDifficultyProgress,
  getDiscProgress,
} from '../../domain/gameSelectors';
import { type BattleEvent, useBattleEngine } from '../../engine/useBattleEngine';
import { useFeedback } from '../../services/FeedbackContext';
import { getLightHitSoundName } from '../../services/battleAudio';
import { useGame } from '../../state/GameContext';
import type { BattleRewardResult } from '../../types/game';

export function useBattleScreenSession(onReturnToGame: () => void) {
  const {
    state: game,
    stats,
    discoverMonster,
    completeBattle,
    consumeGiantDisc,
    cycleBattleSpeed,
    toggleAutoBattle,
  } = useGame();
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
  const completedDifficultyId = useRef<string | null>(null);

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
    speedMultiplier: game.battleSpeedMultiplier,
  });

  useEffect(() => {
    if (engine.state.status === 'victory' && !handledResult.current) {
      handledResult.current = true;
      completedDifficultyId.current = difficulty.id;
      setRewardResult(completeBattle(difficulty.id));
    }
  }, [completeBattle, difficulty.id, engine.state.status]);

  useEffect(() => {
    if (engine.state.status !== 'active') feedback.stopBattleSounds();
  }, [engine.state.status, feedback.stopBattleSounds]);

  useEffect(() => () => {
    feedback.stopBattleSounds();
  }, [feedback.stopBattleSounds]);

  const startBattle = useCallback((withManualFeedback = true) => {
    feedback.stopBattleSounds();
    handledResult.current = false;
    completedDifficultyId.current = null;
    setRewardResult(null);
    getEnemyWaveMonsterIds(difficulty.enemyWaveId).forEach(discoverMonster);
    engine.start();
    if (withManualFeedback) feedback.play('menu');
    feedback.startBattleMusic();
    if (withManualFeedback) feedback.tap();
  }, [
    difficulty.enemyWaveId,
    discoverMonster,
    engine.start,
    feedback,
  ]);

  useEffect(() => {
    if (
      !game.autoBattleEnabled
      || !discAvailable
      || activeBots.length === 0
      || engine.state.status !== 'idle'
    ) return undefined;
    const timer = setTimeout(() => startBattle(false), BATTLE_AUTO.initialStartDelayMs);
    return () => clearTimeout(timer);
  }, [
    activeBots.length,
    discAvailable,
    engine.state.status,
    game.autoBattleEnabled,
    startBattle,
  ]);

  useEffect(() => {
    if (
      game.autoBattleEnabled
      && engine.state.status === 'active'
      && engine.canCastleThrow
    ) {
      engine.throwCastleDisc();
    }
  }, [
    engine.canCastleThrow,
    engine.state.status,
    engine.throwCastleDisc,
    game.autoBattleEnabled,
  ]);

  useEffect(() => {
    if (
      !game.autoBattleEnabled
      || engine.state.status !== 'victory'
      || rewardResult === null
    ) return undefined;
    const finalDifficulty = DIFFICULTIES[DIFFICULTIES.length - 1];
    const completedFinalBattle = completedDifficultyId.current === finalDifficulty.id
      && rewardResult.difficultyWins >= rewardResult.winsRequired;
    if (completedFinalBattle) return undefined;
    const timer = setTimeout(() => startBattle(false), BATTLE_AUTO.nextBattleDelayMs);
    return () => clearTimeout(timer);
  }, [
    engine.state.status,
    game.autoBattleEnabled,
    rewardResult,
    startBattle,
  ]);

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

  return {
    game,
    stats,
    feedback,
    difficultyProgress,
    difficulty,
    battleMap,
    activeCookie,
    activeBots,
    rewardResult,
    engine,
    startBattle,
    leaveBattle,
    throwCastleDiscFromBattleField,
    cycleBattleSpeed,
    toggleAutoBattle,
    hasWeapon: discAvailable && activeBots.length > 0,
  };
}
