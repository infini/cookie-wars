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
import { hasCookieRareStatImage } from '../src/components/CookieRareStatImage';
import { hasMonsterImage } from '../src/components/MonsterSprite';
import { hasBossAnimationImage } from '../src/components/battle/BossAnimationSprite';
import { hasBotAnimationImage } from '../src/components/battle/BotAnimationSprite';
import {
  ELECTRIC_BOLT_IMAGES,
  hasCookieFragmentVfxImage,
} from '../src/components/cookieFragments/externalVfxImages';
import { MAGMA_FIRE_PLUME } from '../src/components/cookieFragments/MagmaFragmentClaimVisual';

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

  test('일반·슈퍼 크리티컬 HUD가 전용 정적 WebP에 연결된다', () => {
    expect(hasCookieRareStatImage('critical')).toBe(true);
    expect(hasCookieRareStatImage('superCritical')).toBe(true);
  });

  test('화산 화염 기둥과 외부 CC0 번개가 정적 WebP에 연결된다', () => {
    expect(MAGMA_FIRE_PLUME).toBeDefined();
    expect(ELECTRIC_BOLT_IMAGES.length).toBeGreaterThanOrEqual(
      COOKIE_FRAGMENTS.claimEffect.electricBoltCount,
    );
    ELECTRIC_BOLT_IMAGES.forEach((_, index) => {
      expect(hasCookieFragmentVfxImage(index)).toBe(true);
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
