import {
  BATTLE_MAPS,
  BOSS_ANIMATION,
  BOT_ANIMATION,
  COOKIES,
  COOKIE_FRAGMENTS,
  MONSTERS,
} from '../src/config';
import { hasBattleMapImage } from '../src/components/BattleMapImage';
import { hasCookieImage } from '../src/components/CookieImage';
import { hasCookieFragmentImage } from '../src/components/CookieFragmentImage';
import { hasMonsterImage } from '../src/components/MonsterSprite';
import { hasBossAnimationImage } from '../src/components/battle/BossAnimationSprite';
import { hasBotAnimationImage } from '../src/components/battle/BotAnimationSprite';
import {
  ELECTRIC_BOLT_IMAGES,
  MAGMA_ERUPTION_FRAMES,
  hasCookieFragmentVfxImage,
} from '../src/components/cookieFragments/externalVfxImages';

describe('데이터 테이블 이미지 레지스트리', () => {
  test('모든 난이도 전장과 몬스터 imageKey가 실제 정적 이미지에 연결된다', () => {
    BATTLE_MAPS.forEach((map) => expect(hasBattleMapImage(map.imageKey)).toBe(true));
    MONSTERS.forEach((monster) => expect(hasMonsterImage(monster.imageKey)).toBe(true));
  });

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

  test('외부 CC0 화산·번개 연출이 모든 정적 WebP 프레임에 연결된다', () => {
    expect(MAGMA_ERUPTION_FRAMES).toHaveLength(
      COOKIE_FRAGMENTS.claimEffect.magmaEruptionFrameCount,
    );
    expect(ELECTRIC_BOLT_IMAGES.length).toBeGreaterThanOrEqual(
      COOKIE_FRAGMENTS.claimEffect.electricBoltCount,
    );
    MAGMA_ERUPTION_FRAMES.forEach((_, index) => {
      expect(hasCookieFragmentVfxImage('magma', index)).toBe(true);
    });
    ELECTRIC_BOLT_IMAGES.forEach((_, index) => {
      expect(hasCookieFragmentVfxImage('electric', index)).toBe(true);
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
