import { BOTS, getBot } from '../../config';
import { BotConfig, GameState } from '../../types/game';
import {
  clampSafeInteger,
  MAX_GAME_INTEGER,
  saturatingAdd,
  saturatingExponentialInteger,
} from '../safeNumbers';
import { canAffordCookieAmount } from '../cookieAmounts';

export interface BotOffer {
  config: BotConfig;
  count: number;
  price: number;
  affordable: boolean;
}

export interface ActiveBot {
  config: BotConfig;
  count: number;
}

export function calculateBotPrice(config: BotConfig, ownedCount: number): number {
  return saturatingExponentialInteger(
    config.baseCost,
    config.costMultiplier,
    clampSafeInteger(ownedCount),
    'floor',
  );
}

export function getBotOffer(state: GameState, botId: string): BotOffer | undefined {
  const config = getBot(botId);
  if (!config) return undefined;
  const count = clampSafeInteger(state.botCounts[botId]);
  const price = calculateBotPrice(config, count);
  return {
    config,
    count,
    price,
    affordable: count < MAX_GAME_INTEGER && canAffordCookieAmount(state.cookies, price),
  };
}

export function getBotOffers(state: GameState): BotOffer[] {
  return BOTS.map((bot) => getBotOffer(state, bot.id)).filter(
    (offer): offer is BotOffer => offer !== undefined,
  );
}

export function getTotalBotCount(state: GameState): number {
  return BOTS.reduce(
    (total, bot) => saturatingAdd(total, state.botCounts[bot.id]),
    0,
  );
}

export function getActiveBots(state: GameState): ActiveBot[] {
  return BOTS.flatMap((config) => {
    const count = clampSafeInteger(state.botCounts[config.id]);
    return count > 0 ? [{ config, count }] : [];
  });
}
