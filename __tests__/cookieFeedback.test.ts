import {
  canPlayCookieClick,
  getCookieFeedbackTier,
  selectCookieVoiceIndex,
} from '../src/services/cookieFeedback';

describe('쿠키 클릭 피드백 정책', () => {
  test('일반·강한 크리티컬·축소 크리티컬을 같은 시간 기준으로 구분한다', () => {
    expect(getCookieFeedbackTier('normal', 0, 0, 100, 280, 900)).toBe('normal');
    expect(getCookieFeedbackTier('critical', 0, 0, 280, 280, 900)).toBe('criticalFull');
    expect(getCookieFeedbackTier('critical', 100, 0, 379, 280, 900)).toBe('criticalCompact');
    expect(getCookieFeedbackTier('critical', 100, 0, 380, 280, 900)).toBe('criticalFull');
    expect(getCookieFeedbackTier('superCritical', 0, 100, 999, 280, 900))
      .toBe('superCriticalCompact');
    expect(getCookieFeedbackTier('superCritical', 0, 100, 1000, 280, 900))
      .toBe('superCriticalFull');
  });

  test('클릭 보이스는 직전에 재생한 보이스를 연속 선택하지 않는다', () => {
    const samples = [0, 0.1, 0.49, 0.5, 0.9, 1];
    for (let previous = 0; previous < 3; previous += 1) {
      samples.forEach((random) => {
        const selected = selectCookieVoiceIndex(previous, random, 3);
        expect(selected).toBeGreaterThanOrEqual(0);
        expect(selected).toBeLessThan(3);
        expect(selected).not.toBe(previous);
      });
    }
  });

  test('첫 보이스 선택은 난수 전체 구간을 사용하고 범위를 벗어난 난수를 제한한다', () => {
    expect(selectCookieVoiceIndex(-1, -1, 3)).toBe(0);
    expect(selectCookieVoiceIndex(-1, 0.4, 3)).toBe(1);
    expect(selectCookieVoiceIndex(-1, 2, 3)).toBe(2);
    expect(() => selectCookieVoiceIndex(-1, 0, 0)).toThrow();
  });

  test('일반 클릭음 최소 간격의 경계를 지킨다', () => {
    expect(canPlayCookieClick(100, 139, 40)).toBe(false);
    expect(canPlayCookieClick(100, 140, 40)).toBe(true);
  });
});
