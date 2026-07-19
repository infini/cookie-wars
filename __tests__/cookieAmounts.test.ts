import {
  addCookieAmounts,
  canAffordCookieAmount,
  normalizeCookieAmount,
  serializeCookieAmount,
  subtractCookieAmounts,
} from '../src/domain/cookieAmounts';
import { mergeSavedGame } from '../src/state/gameReducer';
import { formatNumber } from '../src/utils/format';

describe('BigInt 쿠키 재화', () => {
  const beyondSafe = BigInt('9007199254740991000000000000000000000');

  test('문자열 저장값을 MAX_SAFE 상한 없이 정확히 복원한다', () => {
    const restored = mergeSavedGame({
      cookies: beyondSafe.toString(),
      lifetimeCookies: (beyondSafe + BigInt(9)).toString(),
    });

    expect(restored.cookies).toBe(beyondSafe);
    expect(restored.lifetimeCookies).toBe(beyondSafe + BigInt(9));
  });

  test('덧셈·차감·구매 가능 판정이 큰 정수를 잃지 않는다', () => {
    const gained = addCookieAmounts(beyondSafe, BigInt(123));
    expect(gained).toBe(beyondSafe + BigInt(123));
    expect(canAffordCookieAmount(gained, beyondSafe + BigInt(100))).toBe(true);
    expect(subtractCookieAmounts(gained, beyondSafe)).toBe(BigInt(123));
    expect(subtractCookieAmounts(BigInt(5), BigInt(9))).toBe(BigInt(0));
  });

  test('손상된 값은 0으로 복구하고 저장값은 10진수 문자열로 만든다', () => {
    expect(normalizeCookieAmount('-1')).toBe(BigInt(0));
    expect(normalizeCookieAmount('12.3')).toBe(BigInt(0));
    expect(normalizeCookieAmount(Number.NaN)).toBe(BigInt(0));
    expect(serializeCookieAmount(beyondSafe)).toBe(beyondSafe.toString());
  });

  test('큰 수도 한국어 축약 단위로 표시한다', () => {
    expect(formatNumber(BigInt('10000000000000000'))).toBe('1경');
    expect(formatNumber(BigInt('12500000000000000'))).toBe('1.2경');
  });
});
