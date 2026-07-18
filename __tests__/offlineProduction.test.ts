import { PROGRESSION } from '../src/config';
import {
  calculateOfflineProduction,
  calculateProductionForElapsedTime,
} from '../src/domain/offlineProduction';
import { gameReducer, initialGameState } from '../src/state/gameReducer';

describe('오프라인 자동 생산', () => {
  const savedAt = 1_000;
  const autoProductionState = {
    ...initialGameState,
    cookies: 10,
    lifetimeCookies: 20,
    lastSavedAt: savedAt,
    upgradeLevels: {
      ...initialGameState.upgradeLevels,
      autoProduction: 2,
    },
  };

  test('앱 종료 중 지난 완전한 생산 주기만큼 쿠키를 지급한다', () => {
    const elapsedMs = PROGRESSION.autoProductionIntervalMs * 5
      + PROGRESSION.autoProductionIntervalMs / 2;
    const production = calculateOfflineProduction(
      autoProductionState,
      savedAt + elapsedMs,
    );

    expect(production.completedIntervals).toBe(5);
    expect(production.cookiesEarned).toBe(5);
  });

  test('저장 복원 시 오프라인 생산량을 현재·누적 쿠키에 한 번 정산한다', () => {
    const now = savedAt + PROGRESSION.autoProductionIntervalMs * 7;
    const restored = gameReducer(initialGameState, {
      type: 'HYDRATE',
      payload: autoProductionState,
      now,
    });

    expect(restored.cookies).toBe(autoProductionState.cookies + 7);
    expect(restored.lifetimeCookies).toBe(autoProductionState.lifetimeCookies + 7);
    expect(restored.lastSavedAt).toBe(now);

    const restoredAgain = gameReducer(restored, {
      type: 'HYDRATE',
      payload: restored,
      now,
    });
    expect(restoredAgain.cookies).toBe(restored.cookies);
    expect(restoredAgain.lifetimeCookies).toBe(restored.lifetimeCookies);
  });

  test('기존 저장처럼 시각이 없거나 기기 시계가 뒤로 간 경우 보상을 만들지 않는다', () => {
    expect(calculateOfflineProduction(
      { ...autoProductionState, lastSavedAt: 0 },
      savedAt + PROGRESSION.autoProductionIntervalMs,
    ).cookiesEarned).toBe(0);
    expect(calculateOfflineProduction(
      autoProductionState,
      savedAt - 1,
    ).cookiesEarned).toBe(0);

    const rolledBack = gameReducer(initialGameState, {
      type: 'HYDRATE',
      payload: autoProductionState,
      now: savedAt - 1,
    });
    expect(rolledBack.lastSavedAt).toBe(savedAt);
  });

  test('앱이 켜진 채 백그라운드에서 멈춘 시간도 같은 계산식으로 따라잡는다', () => {
    const production = calculateProductionForElapsedTime(
      3,
      PROGRESSION.autoProductionIntervalMs * 4,
    );
    expect(production.completedIntervals).toBe(4);
    expect(production.cookiesEarned).toBe(12);
  });

  test('오프라인 시간에는 임의 최대 누적 제한을 두지 않는다', () => {
    const oneDayMs = 24 * 60 * 60 * 1_000;
    const production = calculateProductionForElapsedTime(2, oneDayMs);
    expect(production.cookiesEarned).toBe(2 * 24 * 60 * 60);
  });
});
