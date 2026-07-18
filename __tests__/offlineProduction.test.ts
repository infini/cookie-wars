import { PROGRESSION } from '../src/config';
import {
  calculateOfflineProduction,
  calculateProductionForElapsedTime,
} from '../src/domain/offlineProduction';
import { gameReducer, initialGameState } from '../src/state/gameReducer';
import { calculateAutoProductionTick } from '../src/state/useAutoProduction';

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

  test('MAX_SAFE로 손상된 미래 체크포인트는 현재 시각으로 복구되어 생산이 다시 시작된다', () => {
    const now = 50_000;
    const corrupted = {
      ...autoProductionState,
      lastSavedAt: Number.MAX_SAFE_INTEGER,
    };
    const recovered = gameReducer(initialGameState, {
      type: 'HYDRATE',
      payload: corrupted,
      now,
    });

    expect(recovered.cookies).toBe(corrupted.cookies);
    expect(recovered.lifetimeCookies).toBe(corrupted.lifetimeCookies);
    expect(recovered.lastSavedAt).toBe(now);

    const resumed = gameReducer(initialGameState, {
      type: 'HYDRATE',
      payload: recovered,
      now: now + PROGRESSION.autoProductionIntervalMs,
    });
    expect(resumed.cookies).toBe(recovered.cookies + 1);
    expect(resumed.lifetimeCookies).toBe(recovered.lifetimeCookies + 1);
    expect(resumed.lastSavedAt).toBe(now + PROGRESSION.autoProductionIntervalMs);
  });

  test('앱이 켜진 채 백그라운드에서 멈춘 시간도 같은 계산식으로 따라잡는다', () => {
    const production = calculateProductionForElapsedTime(
      3,
      PROGRESSION.autoProductionIntervalMs * 4,
    );
    expect(production.completedIntervals).toBe(4);
    expect(production.cookiesEarned).toBe(12);
  });

  test('실행 중 생산 시계는 완성된 주기만 이동하고 남은 시간을 다음 틱에 이어 쓴다', () => {
    const interval = PROGRESSION.autoProductionIntervalMs;
    const first = calculateAutoProductionTick(3, savedAt, savedAt + interval * 4.5);
    const second = calculateAutoProductionTick(
      3,
      first.lastProductionAt,
      savedAt + interval * 5,
    );

    expect(first.production.completedIntervals).toBe(4);
    expect(first.production.cookiesEarned).toBe(12);
    expect(first.lastProductionAt).toBe(savedAt + interval * 4);
    expect(second.production.completedIntervals).toBe(1);
    expect(second.production.cookiesEarned).toBe(3);
    expect(second.lastProductionAt).toBe(savedAt + interval * 5);
  });

  test('실행 중 기기 시계가 뒤로 가면 생산도 시계 기준점도 변경하지 않는다', () => {
    const tick = calculateAutoProductionTick(3, savedAt, savedAt - 1);

    expect(tick.production.completedIntervals).toBe(0);
    expect(tick.production.cookiesEarned).toBe(0);
    expect(tick.lastProductionAt).toBe(savedAt);
  });

  test('오프라인 시간에는 임의 최대 누적 제한을 두지 않는다', () => {
    const oneDayMs = 24 * 60 * 60 * 1_000;
    const production = calculateProductionForElapsedTime(2, oneDayMs);
    expect(production.cookiesEarned).toBe(2 * 24 * 60 * 60);
  });
});
