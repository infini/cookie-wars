import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types/game';

const STORAGE_KEY = '@cookie-wars/save-v1';

export async function loadGame(): Promise<Partial<GameState> | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Partial<GameState>) : null;
  } catch (error) {
    console.warn('저장 데이터를 불러오지 못했습니다.', error);
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, lastSavedAt: Date.now() }),
    );
  } catch (error) {
    console.warn('게임을 저장하지 못했습니다.', error);
  }
}
