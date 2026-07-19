import { MINI_GAME } from '../src/config';
import {
  adjustMiniGameDuration,
  getMiniGamePlayer,
  getMiniGameWinner,
  getNextMiniGamePhaseAfterTimer,
} from '../src/domain/miniGame';

describe('순차 A·B 쿠키 클릭 대결', () => {
  test('시간은 10초씩 바꾸고 최소·최대 범위를 넘지 않는다', () => {
    expect(adjustMiniGameDuration(30, -1, MINI_GAME)).toBe(20);
    expect(adjustMiniGameDuration(30, 1, MINI_GAME)).toBe(40);
    expect(adjustMiniGameDuration(MINI_GAME.minimumDurationSeconds, -1, MINI_GAME))
      .toBe(MINI_GAME.minimumDurationSeconds);
    expect(adjustMiniGameDuration(MINI_GAME.maximumDurationSeconds, 1, MINI_GAME))
      .toBe(MINI_GAME.maximumDurationSeconds);
  });

  test('A가 먼저 플레이하고 인계 뒤 B가 같은 흐름으로 플레이한다', () => {
    expect(getMiniGamePlayer('countdownA')).toBe('A');
    expect(getNextMiniGamePhaseAfterTimer('countdownA')).toBe('playingA');
    expect(getNextMiniGamePhaseAfterTimer('playingA')).toBe('handoff');
    expect(getMiniGamePlayer('countdownB')).toBe('B');
    expect(getNextMiniGamePhaseAfterTimer('countdownB')).toBe('playingB');
    expect(getNextMiniGamePhaseAfterTimer('playingB')).toBe('result');
  });

  test('두 기록을 비교해 승자와 무승부를 판정한다', () => {
    expect(getMiniGameWinner({ A: 101, B: 99 })).toBe('A');
    expect(getMiniGameWinner({ A: 99, B: 101 })).toBe('B');
    expect(getMiniGameWinner({ A: 100, B: 100 })).toBe('draw');
  });
});
