import { BOSS_ANIMATION, BOT_ANIMATION, COOKIES, COOKIE_FRAGMENTS } from '../src/config';
import { hasCookieImage } from '../src/components/CookieImage';
import { hasCookieFragmentImage } from '../src/components/CookieFragmentImage';
import { hasBossAnimationImage } from '../src/components/battle/BossAnimationSprite';
import { hasBotAnimationImage } from '../src/components/battle/BotAnimationSprite';

describe('데이터 테이블 이미지 레지스트리', () => {
  test('모든 쿠키 imageKey가 실제 정적 이미지에 연결된다', () => {
    COOKIES.forEach((cookie) => {
      expect(hasCookieImage(cookie.imageKey)).toBe(true);
    });
  });

  test('두 쿠키 조각이 실제 정적 WebP에 연결된다', () => {
    COOKIE_FRAGMENTS.types.forEach((fragment) => {
      expect(hasCookieFragmentImage(fragment.id)).toBe(true);
    });
  });

  test('모든 보스 애니메이션 키가 실제 정적 WebP에 연결된다', () => {
    BOSS_ANIMATION.sets.forEach((set) => {
      [
        ...set.walkImageKeys,
        set.hammerWindupImageKey,
        set.hammerImpactImageKey,
        set.hammerRecoveryImageKey,
      ].forEach((imageKey) => {
        expect(hasBossAnimationImage(imageKey)).toBe(true);
      });
    });
  });

  test('모든 쿠키봇 애니메이션 키가 실제 정적 WebP에 연결된다', () => {
    BOT_ANIMATION.sets.forEach((set) => {
      [
        ...set.runImageKeys,
        set.throwWindupImageKey,
        set.throwReleaseImageKey,
        set.throwRecoveryImageKey,
      ].forEach((imageKey) => {
        expect(hasBotAnimationImage(imageKey)).toBe(true);
      });
    });
  });
});
