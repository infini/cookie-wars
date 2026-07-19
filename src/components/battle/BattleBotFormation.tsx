import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BATTLE_UI } from '../../config';
import {
  getBotAnimationFrame,
  getBotCombatPosition,
  isBotTargetInRange,
} from '../../domain/botCombatMotion';
import type { ActiveBot } from '../../domain/gameSelectors';
import { closestEnemy } from '../../engine/battleModel';
import type { BattleEnemy, BattleStatus } from '../../engine/battleTypes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { formatNumber } from '../../utils/format';
import { BotAnimationSprite } from './BotAnimationSprite';
import { getPerspectiveScale } from './battleUnitLayout';

interface BattleBotFormationProps {
  bots: ActiveBot[];
  enemies: BattleEnemy[];
  status: BattleStatus;
  now: number;
  lastAttackAt: Record<string, number>;
  lastAttackPerformedAt: Record<string, number>;
}

export const BattleBotFormation = React.memo(function BattleBotFormation({
  bots,
  enemies,
  status,
  now,
  lastAttackAt,
  lastAttackPerformedAt,
}: BattleBotFormationProps) {
  const target = closestEnemy(enemies, now);
  return (
    <>
      {bots.map((bot, index) => {
        const currentPosition = getBotCombatPosition(
          index,
          now,
          target,
          status === 'active',
        );
        const targetInRange = Boolean(
          target && isBotTargetInRange(currentPosition, target),
        );
        const frame = getBotAnimationFrame({
          botId: bot.config.id,
          botIndex: index,
          now,
          status,
          targetInRange,
          attackIntervalMs: bot.config.attackIntervalMs,
          lastAttackAt: lastAttackAt[bot.config.id] ?? now,
          lastAttackPerformedAt: lastAttackPerformedAt[bot.config.id],
        });
        const position = getBotCombatPosition(
          index,
          frame.positionTime,
          target,
          status === 'active',
        );
        const renderSize = BATTLE_UI.botRenderSize * getPerspectiveScale(position.y);
        return (
          <View
            key={bot.config.id}
            style={[
              styles.bot,
              {
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                width: BATTLE_UI.botLabelWidth,
                marginLeft: -BATTLE_UI.botLabelWidth / 2,
                marginTop: -(renderSize + BATTLE_UI.enemyAnchorLabelOffset),
                zIndex: Math.round(position.y * 1000),
              },
            ]}
          >
            <Text style={styles.botName} numberOfLines={1}>
              {bot.config.name}{bot.count > 1 ? ` ×${formatNumber(bot.count)}` : ''}
            </Text>
            <View style={{ width: renderSize, height: renderSize }}>
              <View
                pointerEvents="none"
                style={[
                  styles.groundShadow,
                  {
                    left: renderSize * (1 - BATTLE_UI.groundShadowWidthRatio) / 2,
                    bottom: renderSize * BATTLE_UI.groundShadowBottomRatio,
                    width: renderSize * BATTLE_UI.groundShadowWidthRatio,
                    height: renderSize * BATTLE_UI.groundShadowHeightRatio,
                    borderRadius: renderSize,
                    backgroundColor: BATTLE_UI.groundShadowColor,
                  },
                ]}
              />
              <BotAnimationSprite imageKey={frame.imageKey} size={renderSize} />
            </View>
          </View>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  bot: { position: 'absolute', alignItems: 'center' },
  groundShadow: { position: 'absolute' },
  botName: {
    maxWidth: '100%',
    fontFamily: fonts.extraBold,
    fontSize: 6,
    color: colors.blue,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 2,
    borderRadius: 5,
  },
});
