import { BATTLE_AUDIO } from '../src/config';
import {
  canPlayBattleActionSound,
  getLightHitSoundName,
} from '../src/services/battleAudio';

describe('전투 효과음 제어', () => {
  test('같은 액션음은 테이블의 최소 간격 안에서 중복 재생하지 않는다', () => {
    const lastPlayedAt = { hitLight: 1000 };
    expect(canPlayBattleActionSound(
      'hitLight1',
      lastPlayedAt,
      1000 + BATTLE_AUDIO.minimumIntervalMs.hitLight - 1,
    )).toBe(false);
    expect(canPlayBattleActionSound(
      'hitLight2',
      lastPlayedAt,
      1000 + BATTLE_AUDIO.minimumIntervalMs.hitLight,
    )).toBe(true);
  });

  test('아직 재생하지 않은 액션음은 즉시 재생할 수 있다', () => {
    expect(canPlayBattleActionSound('enemyDisc', {}, 1000)).toBe(true);
  });

  test('약한 타격음은 세 개의 고품질 원본을 순환한다', () => {
    expect(new Set([0, 1, 2].map(getLightHitSoundName))).toEqual(new Set([
      'hitLight1',
      'hitLight2',
      'hitLight3',
    ]));
    expect(getLightHitSoundName(3)).toBe(getLightHitSoundName(0));
  });
});
