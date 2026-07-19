jest.mock('@react-native-async-storage/async-storage', () => (
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadGame, saveGame } from '../src/services/storage';
import { initialGameState } from '../src/state/gameReducer';

describe('게임 저장 서비스', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('호출자가 지정한 생산 체크포인트 시각을 저장한다', async () => {
    const savedAt = 12_345;

    await expect(saveGame(initialGameState, savedAt)).resolves.toBe(true);
    const payload = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(payload.lastSavedAt).toBe(savedAt);
    expect(payload.cookies).toBe('0');
    expect(payload.lifetimeCookies).toBe('0');
    expect(Object.values(payload.discUpgradeSpentCookies).every(
      (value) => value === '0',
    )).toBe(true);
  });

  test('MAX_SAFE를 넘는 쿠키도 10진수 문자열로 정확히 저장한다', async () => {
    const hugeCookies = BigInt('1234567890123456789012345678901234567890');
    await expect(saveGame({
      ...initialGameState,
      cookies: hugeCookies,
      lifetimeCookies: hugeCookies + BigInt(7),
    })).resolves.toBe(true);

    const payload = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(payload.cookies).toBe(hugeCookies.toString());
    expect(payload.lifetimeCookies).toBe((hugeCookies + BigInt(7)).toString());
  });

  test('저장된 체크포인트를 손실 없이 불러온다', async () => {
    await AsyncStorage.setItem(
      '@cookie-wars/save-v1',
      JSON.stringify({ cookies: 9, lastSavedAt: 7_654 }),
    );
    await expect(loadGame()).resolves.toEqual({ cookies: 9, lastSavedAt: 7_654 });
  });
});
