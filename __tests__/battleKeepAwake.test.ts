import { shouldKeepBattleScreenAwake } from '../src/screens/battle/useBattleKeepAwake';

describe('전투 화면 절전 방지 정책', () => {
  test('실제 전투 진행 중에만 화면 켜짐을 유지한다', () => {
    expect(shouldKeepBattleScreenAwake('active')).toBe(true);
    expect(shouldKeepBattleScreenAwake('idle')).toBe(false);
    expect(shouldKeepBattleScreenAwake('victory')).toBe(false);
    expect(shouldKeepBattleScreenAwake('defeat')).toBe(false);
  });
});
