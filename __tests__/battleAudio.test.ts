import { BATTLE_AUDIO } from '../src/config';
import { canPlayBattleActionSound } from '../src/services/battleAudio';

describe('전투 효과음 제어', () => {
  test('같은 액션음은 테이블의 최소 간격 안에서 중복 재생하지 않는다', () => {
    const lastPlayedAt = { hit: 1000 };
    expect(canPlayBattleActionSound(
      'hit',
      lastPlayedAt,
      1000 + BATTLE_AUDIO.minimumIntervalMs.hit - 1,
    )).toBe(false);
    expect(canPlayBattleActionSound(
      'hit',
      lastPlayedAt,
      1000 + BATTLE_AUDIO.minimumIntervalMs.hit,
    )).toBe(true);
  });

  test('아직 재생하지 않은 액션음은 즉시 재생할 수 있다', () => {
    expect(canPlayBattleActionSound('disc', {}, 1000)).toBe(true);
  });
});
