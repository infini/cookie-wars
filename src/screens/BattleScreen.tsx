import { ImageBackground, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { BATTLE_FEEDBACK, BOSS_SPECIAL_ATTACK, GIANT_DISC } from '../config';
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
import {
  CookieCastleControl,
  GiantDiscButton,
} from './battle/BattleActionControls';
import { BattleHud } from './battle/BattleHud';
import { BattleReadyOverlay } from './battle/BattleReadyOverlay';
import { BattleResultModal } from './battle/BattleResultModal';
import { getBattleScreenPresentation } from './battle/battlePresentation';
import { styles } from './battle/battleScreenStyles';
import { useBattleScreenSession } from './battle/useBattleScreenSession';

export { getHealthColor } from '../components/battle/BattleHealthBar';

interface BattleScreenProps {
  onReturnToGame: () => void;
}

export function BattleScreen({ onReturnToGame }: BattleScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const {
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
    hasWeapon,
  } = useBattleScreenSession(onReturnToGame);
  const giantDiscRenderSize = Math.round(screenWidth * GIANT_DISC.renderWidthRatio);
  const presentation = getBattleScreenPresentation({
    now: engine.state.now,
    enemies: engine.state.enemies,
    presentationEvent: engine.state.presentationEvent,
  });

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
              { translateX: presentation.bossSpecialAttackScreenShake },
              { translateY: Math.abs(presentation.bossSpecialAttackScreenShake) },
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
          <BattleHud
            difficultyName={difficulty.name}
            currentBattleNumber={difficultyProgress.currentBattleNumber}
            requiredWins={difficultyProgress.requiredWins}
            remainingEnemyCount={presentation.remainingEnemyCount}
            displayedBoss={presentation.displayedBoss}
            status={engine.state.status}
            screenWidth={screenWidth}
            battleSpeedMultiplier={game.battleSpeedMultiplier}
            onCycleBattleSpeed={() => {
              cycleBattleSpeed();
              feedback.tap();
            }}
          />

          <BattleEnemyLayer
            enemies={engine.state.enemies}
            enemyProjectiles={engine.state.enemyProjectiles}
            status={engine.state.status}
            now={engine.state.now}
            enemyDiscCooldownMs={engine.enemyDisc.cooldownMs}
            enemyDiscSpeed={engine.enemyDisc.speed}
            presentationEvent={presentation.presentationEvent}
            presentationEventAgeMs={presentation.presentationEventAgeMs}
          />

          <EnemyProjectileLayer
            projectiles={engine.state.enemyProjectiles}
            now={engine.state.now}
          />

          <BattleImpactEffect event={presentation.presentationEvent} now={engine.state.now} />

          {presentation.castleHitVisible ? (
            <View
              pointerEvents="none"
              style={[
                styles.castleHitFlash,
                {
                  backgroundColor: BATTLE_FEEDBACK.screenFlashColor,
                  opacity: BATTLE_FEEDBACK.screenFlashMaximumOpacity * presentation.castleHitWave,
                },
              ]}
            />
          ) : null}

          {presentation.bossSpecialAttackProgress !== null ? (
            <View
              pointerEvents="none"
              style={[
                styles.bossSpecialAttackFlash,
                {
                  backgroundColor: BOSS_SPECIAL_ATTACK.screenFlashColor,
                  opacity: presentation.bossSpecialAttackFlashOpacity,
                },
              ]}
            />
          ) : null}

          <PlayerProjectileLayer
            projectiles={engine.state.playerProjectiles}
            now={engine.state.now}
            giantDiscRenderSize={giantDiscRenderSize}
          />

          <GiantDiscButton
            status={engine.state.status}
            giantDiscCount={game.giantDiscCount}
            canThrow={engine.canGiantThrow}
            onThrow={() => {
              if (engine.throwGiantDisc()) feedback.tap();
            }}
          />

          {engine.state.notice ? <Text style={styles.notice}>{engine.state.notice}</Text> : null}

          <BattleBotFormation
            bots={activeBots}
            enemies={engine.state.enemies}
            status={engine.state.status}
            now={engine.state.now}
            lastAttackAt={engine.state.lastBotAttackAt}
            lastAttackPerformedAt={engine.state.lastBotAttackPerformedAt}
          />

          <CookieCastleControl
            status={engine.state.status}
            canThrow={engine.canCastleThrow}
            baseHealth={engine.state.baseHealth}
            maxHealth={stats.maxHealth}
            cookieImageKey={activeCookie.imageKey}
            castleHitVisible={presentation.castleHitVisible}
            castleHitWave={presentation.castleHitWave}
            castleHitShake={presentation.castleHitShake}
            onThrow={() => {
              if (engine.throwCastleDisc()) feedback.tap();
            }}
          />

          <BattleReadyOverlay
            visible={engine.state.status === 'idle'}
            difficulty={difficulty}
            difficultyProgress={difficultyProgress}
            hasWeapon={hasWeapon}
            onStart={startBattle}
          />
        </ImageBackground>
      </Pressable>

      <BattleResultModal
        status={engine.state.status}
        rewardResult={rewardResult}
        onLeave={leaveBattle}
        onStart={startBattle}
      />
    </View>
  );
}
