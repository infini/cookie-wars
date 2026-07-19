import { formatNumber } from '../src/utils/format';

describe('게임 수치 축약 표기', () => {
  test.each([
    [999, '999'],
    [1_000, '1천'],
    [1_250, '1.3천'],
    [10_000, '1만'],
    [25_000_000, '2500만'],
    [125_000_000, '1.3억'],
    [3_400_000_000_000, '3.4조'],
  ])('%d를 %s로 표시한다', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });
});
