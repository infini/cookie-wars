import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, StoredGameState } from '../types/game';
import { serializeCookieAmount } from '../domain/cookieAmounts';

const STORAGE_KEY = '@cookie-wars/save-v1';

export async function loadGame(): Promise<StoredGameState | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as StoredGameState) : null;
  } catch (error) {
    console.warn('저장 데이터를 불러오지 못했습니다.', error);
    return null;
  }
}

export async function saveGame(
  state: GameState,
  savedAt: number = Date.now(),
): Promise<boolean> {
  try {
    const normalizedSavedAt = Number.isFinite(savedAt)
      ? Math.max(0, Math.floor(savedAt))
      : Date.now();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        cookies: serializeCookieAmount(state.cookies),
        lifetimeCookies: serializeCookieAmount(state.lifetimeCookies),
        discUpgradeSpentCookies: Object.fromEntries(
          Object.entries(state.discUpgradeSpentCookies).map(([discId, amount]) => [
            discId,
            serializeCookieAmount(amount),
          ]),
        ),
        lastSavedAt: normalizedSavedAt,
      }),
    );
    return true;
  } catch (error) {
    console.warn('게임을 저장하지 못했습니다.', error);
    return false;
  }
}
