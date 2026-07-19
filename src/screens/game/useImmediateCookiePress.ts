import { useCallback, useEffect, useRef } from 'react';
import { COOKIE_INPUT } from '../../config';

/**
 * 손가락이 닿는 순간 보상을 주되, 같은 터치에서 뒤따르는 onPress는 중복 처리하지 않는다.
 * 접근성 서비스나 키보드처럼 onPress만 발생하는 입력도 그대로 지원한다.
 */
export function useImmediateCookiePress(onActivate: () => void) {
  const handledPressIn = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current === null) return;
    clearTimeout(resetTimer.current);
    resetTimer.current = null;
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  const onPressIn = useCallback(() => {
    clearResetTimer();
    handledPressIn.current = true;
    onActivate();
  }, [clearResetTimer, onActivate]);

  const onPressOut = useCallback(() => {
    clearResetTimer();
    resetTimer.current = setTimeout(() => {
      handledPressIn.current = false;
      resetTimer.current = null;
    }, COOKIE_INPUT.releaseDeduplicationWindowMs);
  }, [clearResetTimer]);

  const onPress = useCallback(() => {
    if (handledPressIn.current) {
      handledPressIn.current = false;
      return;
    }
    onActivate();
  }, [onActivate]);

  return { onPress, onPressIn, onPressOut };
}
