# 전장·보스·쿠키봇·쿠키 생성 기록

## 범위와 소유 정책

현재 런타임에서 사용하는 아래 이미지는 Codex 내장 `imagegen`으로 쿠키전쟁을 위해 새로 제작했습니다. 특정 상용 게임의 캐릭터·로고·상표를 입력 이미지나 모사 대상으로 사용하지 않았습니다.

- 난이도별 전장 30개
- 난이도별 정적 망치 보스 30개
- 보스별 걷기 3프레임과 망치 강공격 3프레임: 30종 × 6 = 투명 WebP 180개
- 쿠키봇별 달리기 3프레임과 원반 투척 3프레임: 5종 × 6 = 투명 WebP 30개
- 천상 왕관 이후 신규 진화 쿠키 30개(21~50단계)와 별빛 쇼트케이크 교체 1개
- 마그마·전기 수집 조각 2종, 마그마 획득용 화산 1종과 수직 화염 기둥 1종
- 메인 HUD용 일반·슈퍼 크리티컬 아이콘 2종

생성 결과는 코드의 MIT License에 자동 포함하지 않는 `프로젝트 전용 원본`입니다. 별도 허가 없이 이미지 자체를 다른 프로젝트에 재사용·재배포하는 정책으로 만들지 않았습니다. 상세 구분은 [`ASSET_LICENSES.md`](ASSET_LICENSES.md)에 기록합니다.

## 공통 제작·변환 절차

전장은 중심 자르기 후 941×1672 progressive JPG quality 84로 저장했습니다. 기존 정적 보스는 단색 크로마키를 soft matte·despill로 제거해 512×512 투명 WebP quality 86, Blood Moon 정적 보스는 화면 최대 표시 크기보다 충분한 384×384 lossless 투명 WebP로 저장했습니다.

보스·봇 애니메이션은 한 원본 안에 정확히 3열×2행의 독립 정사각 셀 6개가 있는 atlas로 생성했습니다. `scripts/process_animation_atlases.py`가 atlas를 행 우선 순서로 자르고, Codex imagegen skill의 `remove_chroma_key.py`를 soft matte·despill 옵션으로 호출한 뒤 다음 조건을 검사합니다.

- atlas가 3×2로 정확히 나뉘고 각 셀이 정사각형일 것
- 투명·불투명 픽셀이 모두 존재하고 네 모서리 알파가 8 이하일 것
- 크로마키 제거 뒤 캐릭터가 남아 있을 것
- 완전 투명 픽셀의 RGB를 0으로 정리할 것
- 각 프레임을 384×384 lossless 투명 WebP로 저장할 것

신규·교체 쿠키는 `tmp/cookie-assets/<imageKey>.png`에 정사각형 RGB 크로마키 원본을 보관하고 `scripts/process_cookie_assets.py`로 변환했습니다. 21~30단계 원본은 1024×1024, 별빛 쇼트케이크와 31~50단계 원본은 1254×1254입니다. 이 스크립트는 soft matte·despill, 투명·불투명 범위, 모서리 투명도, 오브젝트 경계 여백을 검증한 뒤 `assets/images/cookies/<imageKey>.webp`에 512×512 투명 WebP quality 90으로 저장합니다. 이미 투명한 기존 PNG는 `--transparent-input`으로 크로마키 제거 없이 같은 검증·WebP 변환 경로를 사용합니다.

전체 atlas와 쿠키 raw를 다시 변환하는 명령은 다음과 같습니다. 기본 출력 크기는 각각 384와 512입니다.

```bash
python3 scripts/process_animation_atlases.py \
  --kind boss \
  --atlas-dir tmp/boss-atlases \
  --output-dir assets/images/enemies/animations

python3 scripts/process_animation_atlases.py \
  --kind bot \
  --atlas-dir tmp/bot-atlases \
  --output-dir assets/images/bots/animations

python3 scripts/process_cookie_assets.py \
  --input-dir tmp/cookie-assets \
  --output-dir assets/images/cookies
```

기존 투명 PNG를 런타임 WebP로 다시 만들 때는 입력 파일을 별도 원본 디렉터리에 둔 뒤 `--transparent-input`을 추가합니다. 다른 개발 환경에서는 크로마키 변환 명령의 `--chroma-helper`에 사용 가능한 `remove_chroma_key.py` 경로를 명시합니다.

## 보관 중인 마그마 조각 화산 폭발

마그마 조각을 얻었을 때 화면을 크게 채우는 전용 화산 원본을 Codex 내장 `imagegen`으로 생성했습니다. 원본은 `/Users/infini/.codex/generated_images/019f72f5-a7a4-7872-a715-f1335800694d/exec-47ef1a24-6c43-48b2-958a-6a1fa9fb4f89.png`, 최종 파일은 `assets/images/cookie-fragments/magma-volcano-eruption.webp`입니다.

```text
Create one premium stylized 3D mobile-game VFX sprite of a chocolate-cookie volcano erupting violently. Show a readable baked-cookie crater, a brilliant yellow-orange lava blast, thick lava streams flowing down the volcano, hot rocks, sparks and smoke. Strong child-friendly fantasy impact, centered square composition, no character, no text, no UI, no logo. Use a perfectly flat chroma-key green background with no floor, cast shadow, scenery, gradient or texture outside the effect.
```

원본의 녹색 배경은 `#03f908`을 기준으로 soft matte·despill 처리하고 512×512 투명 WebP로 축소했습니다. 최종 262,144픽셀 중 완전 투명 143,209픽셀, 부분 투명 10,382픽셀을 확인했으며 네 모서리는 투명합니다. 이 파일은 제작 이력과 재가공을 위해 보관하며 1.0.22 런타임에서는 불러오지 않습니다.

### 마그마 수직 화염 기둥

고정 16프레임 폭발 대신 분화구에서 직접 솟으면서 반복 맥동할 수 있는 단일 화염 기둥을 생성했습니다. 원본은 `/Users/infini/.codex/generated_images/019f72f5-a7a4-7872-a715-f1335800694d/exec-de119c13-8967-47e2-b9aa-70f3454048b3.png`, 최종 파일은 `assets/images/vfx/magma-fire-plume.webp`입니다.

```text
Create a premium production-ready 2D mobile game VFX sprite: a single dramatic vertical volcanic fire eruption plume, viewed straight-on, erupting upward from a narrow bottom-center crater point. Tall roaring orange-red flames, incandescent yellow-white core, molten lava streaks, glowing embers and dark smoke toward the top, strong readable silhouette, polished fantasy defense-game quality, no volcano or ground, no text, no border, no UI. Isolate the entire plume on a perfectly uniform pure green chroma-key background (#00FF00). Keep the bottom origin tightly centered and the plume fully inside frame with generous transparent-keyable margin. Square image, high detail.
```

균일 녹색을 soft matte·despill 처리해 투명 WebP로 저장하고, 바닥 중심의 좁은 발화점을 화산 분화구 중심과 맞췄습니다. 이 단일 화염 기둥과 이전 절차적 맥동은 제작 이력용으로 보관하며 1.0.22 런타임에서는 불러오지 않습니다.

## 외부 애니메이션 희귀 보상 VFX

1.0.22 런타임은 직접 제작한 고정 이미지·절차적 도형 대신 OpenGameArt의 CC0 atlas를 사용합니다. Sinestesia의 4×4 노란 타격은 크리티컬 16프레임, 8×8 화염 폭발은 마그마 64개 원본 프레임입니다. Esteban Díaz/Inguz Media의 8×8 금색·청록 충격은 슈퍼 크리티컬로 합성하고, 청록 충격과 Calinou 번개 9개를 세 구간에 배치해 전기 64개 원본 프레임을 만듭니다.

`scripts/process_external_cookie_feedback_vfx.py`는 전체 시퀀스의 합집합 알파 경계를 계산해 같은 정사각 crop을 모든 프레임에 적용한 뒤 384·512·576·640px animated WebP 6개를 생성합니다. 이 방식은 atlas의 큰 투명 여백 때문에 실제 효과가 작아지는 문제와 프레임별 crop 흔들림을 함께 막습니다. 최종 파일은 `assets/images/vfx/cookie-feedback/`에 있고 Android Fresco가 네이티브로 재생합니다. 원본 URL·라이선스 선택·다운로드 SHA-256은 `assets/licenses/OPENGAMEART_COOKIE_VFX_SOURCE.txt`를 기준으로 합니다.

### 메인 HUD 희귀 아이콘

일반·슈퍼 크리티컬 확률과 배수를 텍스트만으로 길게 표시하지 않도록 프로젝트 전용 정사각 아이콘을 생성했습니다. 일반 원본은 `/Users/infini/.codex/generated_images/019f72f5-a7a4-7872-a715-f1335800694d/exec-5c455f71-8710-4ce7-802d-4e3de8bd3828.png`, 슈퍼 원본은 `/Users/infini/.codex/generated_images/019f72f5-a7a4-7872-a715-f1335800694d/exec-b071e4a5-fc55-4801-be98-7e4421502a77.png`입니다. 두 이미지는 각각 `assets/images/ui/critical-stat-icon.webp`, `assets/images/ui/super-critical-stat-icon.webp`로 변환했습니다. 핵심 지시는 `작은 모바일 HUD에서도 구분되는 쿠키 충격/초강력 별폭발 엠블럼, 아이콘 한 개, 고대비, 투명 변환용 균일 크로마키, 텍스트·UI 프레임·로고·워터마크 없음`이었습니다.

## 전장 프롬프트

전장에는 아래 공통 프롬프트를 사용하고 표의 `전장 고유 지시`를 `Primary request`와 `Scene/backdrop`에 삽입했습니다.

```text
Use case: stylized-concept
Asset type: portrait mobile defense game battle-map background
Primary request: Create an original premium stylized 3D mobile defense battlefield for [난이도와 고유 테마].
Scene/backdrop: strict vertical 9:16 elevated/isometric battle board; [고유 지형과 상단 랜드마크]; landmark only in the upper 18–20%; set dressing only around the perimeter; central 70% is a broad simple readable arena; bottom 20–22% is open flat ground for a dynamic cookie castle overlay.
Style/medium: original premium stylized 3D mobile game environment, polished hand-painted PBR, chunky readable forms, child-friendly fantasy, commercially usable quality.
Composition/framing: portrait 9:16, elevated isometric camera, strong depth, quiet unobstructed center, fundamentally distinct terrain and architecture rather than a recolor.
Lighting/mood: thematic edge lighting with controlled contrast and neutral combat visibility.
Constraints: environment only; no road, path, lane, grid, characters, units, enemies, bottom castle, weapons, projectiles, UI, text, logos, trademarks, or watermark.
```

## 정적 보스 프롬프트

보스에는 아래 공통 프롬프트를 사용하고 표의 `보스·망치 고유 지시`를 `Primary request`와 `Subject`에 삽입했습니다.

```text
Use case: stylized-concept
Asset type: transparent-ready mobile defense game boss character sprite
Primary request: Create one original full-body [난이도와 고유 보스] for a cookie-themed fantasy defense game.
Subject: exactly one readable anthropomorphic cookie boss with [고유 몸체·갑옷]; permanently carry one enormous [고유 전쟁망치] with both hands visibly gripping the long handle; the weapon is a real permanent part of the silhouette, ready for a crushing downward slam, never floating, hidden, or summoned.
Style/medium: original premium stylized 3D mobile game character render, polished hand-painted PBR, chunky readable forms, child-friendly fantasy villain, strong unique silhouette.
Composition/framing: square canvas, complete full body and entire hammer visible, centered front three-quarter combat idle pose, braced stance, generous padding, no cropping.
Scene/backdrop: perfectly flat solid chroma-key background (#00ff00, or #ff00ff when the subject conflicts).
Constraints: one character and exactly one heavy war hammer; not a boomerang, crescent, axe, sword, staff, projectile, or temporary effect; uniform background with no shadow, floor, gradient, texture, reflections, scenery, particles, text, logos, trademarks, or watermark.
```

## 난이도별 전장·정적 보스 파일

| 난이도 | 전장 고유 지시 | 보스·망치 고유 지시 | 최종 전장 | 최종 정적 보스 |
|---|---|---|---|---|
| easy | 햇살 비스킷 초원, 풍차 마을, 석벽과 들꽃 | 버터 쿠키 기사, 낡은 철갑, 참나무·비스킷 망치 | `battle-map-easy-sunny-meadow.jpg` | `boss-easy-crumb-knight.webp` |
| normal | 카라멜 과수원과 농경 테라스, 시럽 물레방아 | 카라멜 황소 장군, 청동 갑옷, 주조 카라멜 망치 | `battle-map-normal-caramel-vale.jpg` | `boss-normal-caramel-general.webp` |
| hard | 설원 소나무 고원, 얼음 절벽, 북방 감시탑 | 서리 쿠키 바이킹, 털갑옷, 결정 얼음 망치 | `battle-map-hard-frostpine.jpg` | `boss-hard-frost-viking.webp` |
| harder | 침수 열대 코코아 유적, 뿌리와 청록 수변 | 코코아 석상 골렘, 덩굴 갑옷, 고대 석망치 | `battle-map-harder-jungle-ruins.jpg` | `boss-harder-jungle-golem.webp` |
| insane | 폭풍 바다 절벽, 현무암, 요새와 등대 | 폭풍 철갑 수호자, 번개 도체 망치 | `battle-map-insane-stormcliff.jpg` | `boss-insane-storm-warden.webp` |
| easy demon | 불탄 붉은 협곡, 악마 철문과 재 | 불씨 쿠키 악마 전사, 검붉은 갑옷, 용암 망치 | `battle-map-easy-demon-ember-gate.jpg` | `boss-easy-demon-ember-brute.webp` |
| medium demon | 보라·청록 독사탕 늪, 마녀 오두막 | 늪 쿠키 마녀 전사, 가마솥 갑옷, 독물 망치 | `battle-map-medium-demon-toxic-marsh.jpg` | `boss-medium-demon-marsh-witch.webp` |
| hard demon | 뼈설탕 대성당과 카타콤, 수정 가장자리 | 뼈설탕 왕, 해골 왕관, 뼈·수정 망치 | `battle-map-hard-demon-catacomb.jpg` | `boss-hard-demon-bone-king.webp` |
| insane demon | 핏빛달 황무지, 고딕 폐허와 죽은 숲 | 핏빛달 기사, 가시 암흑 갑옷, 사각 고딕 망치 | `battle-map-insane-demon-blood-moon.jpg` | `boss-insane-demon-blood-knight.webp` |
| extreme demon | 용암 칼데라, 흑요석 악마 성채 | 흑요석 악마 타이탄, 균열 갑옷, 용암 망치 | `battle-map-extreme-demon-inferno.jpg` | `boss-extreme-demon-inferno-titan.webp` |
| easy god | 구름 위 부유섬, 백금 신전과 구름 폭포 | 천공 구름 수호자, 백금 날개 갑옷, 천공 망치 | `battle-map-easy-god-cloud-sanctuary.jpg` | `boss-easy-god-cloud-guardian.webp` |
| medium god | 별빛 수정 정원과 프리즘 신전 | 수정 세라프 골렘, 프리즘 갑옷, 수정 망치 | `battle-map-medium-god-crystal-temple.jpg` | `boss-medium-god-crystal-seraph.webp` |
| hard god | 우주 시계장치 플랫폼과 거대 천문관 | 시간 수호 거상, 태엽 중갑, 시계 전쟁망치 | `battle-map-hard-god-time-observatory.jpg` | `boss-hard-god-time-colossus.webp` |
| insane god | 거대한 산 정상과 타이탄 기둥 신전 | 천둥 쿠키 타이탄, 청백금 갑옷, 천둥 망치 | `battle-map-insane-god-thunder-titan.jpg` | `boss-insane-god-thunder-titan.webp` |
| extreme god | 우주 공허 부유섬과 황금 왕좌 포털 | 신성 공허 황제, 금빛 우주 갑옷, 은하 전쟁망치 | `battle-map-extreme-god-divine-void.jpg` | `boss-extreme-god-void-emperor.webp` |
| blood moon easy | 수정 광산과 거대 청록 결정 | 수정 거인, 결정 갑옷과 수정 망치 | `battle-map-easy-titan-crystal-mine.jpg` | `boss-easy-titan-crystal-giant.webp` |
| blood moon normal | 거대 버섯 숲과 발광 포자 | 포자 거상, 균사 갑옷과 버섯 망치 | `battle-map-medium-titan-mushroom-forest.jpg` | `boss-medium-titan-spore-colossus.webp` |
| blood moon hard | 증기 주조소와 용광로 설비 | 증기 파괴자, 보일러 갑옷과 피스톤 망치 | `battle-map-hard-titan-steam-foundry.jpg` | `boss-hard-titan-steam-juggernaut.webp` |
| blood moon harder | 심해 산호 도시와 해저 유적 | 산호 레비아탄, 산호 갑옷과 닻 망치 | `battle-map-insane-titan-coral-city.jpg` | `boss-insane-titan-coral-leviathan.webp` |
| blood moon insane | 운석 분화구와 외계 결정 | 운석 핵 거인, 용융 운석 갑옷과 핵 망치 | `battle-map-extreme-titan-meteor-crater.jpg` | `boss-extreme-titan-meteor-core.webp` |
| blood moon easy demon | 마법 장난감 공방과 태엽 설비 | 태엽 장인, 목재·황동 갑옷과 톱니 망치 | `battle-map-easy-creator-toy-workshop.jpg` | `boss-easy-creator-clockwork-artisan.webp` |
| blood moon medium demon | 거대 마법 도서관과 룬 서가 | 룬 기록관, 양피지 갑옷과 서책 망치 | `battle-map-medium-creator-magic-library.jpg` | `boss-medium-creator-rune-archivist.webp` |
| blood moon hard demon | 그림자 극장과 가면 무대 | 가면 조각가, 암막 갑옷과 무대 망치 | `battle-map-hard-creator-shadow-theater.jpg` | `boss-hard-creator-mask-sculptor.webp` |
| blood moon insane demon | 연금 온실과 거대 유리 돔 | 생명 연금술사, 식물 갑옷과 플라스크 망치 | `battle-map-insane-creator-alchemy-greenhouse.jpg` | `boss-insane-creator-life-alchemist.webp` |
| blood moon extreme demon | 성운 설계실과 우주 작업대 | 성운 설계자, 별가루 갑옷과 천체 망치 | `battle-map-extreme-creator-nebula-studio.jpg` | `boss-extreme-creator-nebula-architect.webp` |
| blood moon easy god | 거울 미궁과 반사 수정 | 거울 기사, 은경 갑옷과 반사 망치 | `battle-map-easy-infinity-mirror-labyrinth.jpg` | `boss-easy-infinity-mirror-knight.webp` |
| blood moon medium god | 프랙탈 협곡과 반복 지형 | 프랙탈 거상, 반복 결정 갑옷과 기하 망치 | `battle-map-medium-infinity-fractal-canyon.jpg` | `boss-medium-infinity-fractal-colossus.webp` |
| blood moon hard god | 역중력 도시와 부유 건축 | 중력 군주, 반중력 갑옷과 중력 망치 | `battle-map-hard-infinity-inverted-city.jpg` | `boss-hard-infinity-gravity-sovereign.webp` |
| blood moon insane god | 영겁의 시계와 시간 기계 | 영겁 황제, 시간 갑옷과 시계 망치 | `battle-map-insane-infinity-eternal-clock.jpg` | `boss-insane-infinity-eternity-emperor.webp` |
| blood moon extreme god | 다중우주 균열과 겹친 차원 | 다중우주 군주, 차원 갑옷과 균열 망치 | `battle-map-extreme-infinity-multiverse-rift.jpg` | `boss-extreme-infinity-multiverse-lord.webp` |

최종 전장은 `assets/images/maps/`, 정적 보스는 `assets/images/enemies/`에 있습니다.

## 보스 애니메이션 atlas

각 정적 보스의 고유 디자인을 참조해 아래 공통 지시로 별도 3×2 atlas를 생성했습니다.

```text
Create one strict 3-column × 2-row game animation atlas of the same provided cookie boss.
Every cell must preserve exactly the same face, armor, body material, colors, hammer design, camera, scale, and lighting.
Top row, left to right: walk contact pose A; passing/weight-shift pose; walk contact pose B.
Bottom row, left to right: hammer windup with the hammer clearly raised; hammer impact with the hammer visibly striking downward; hammer recovery with recoil after impact.
The complete full body and complete permanent war hammer must be visible in every square cell with generous padding.
Use one exact flat chroma-key #00ff00 background across the entire atlas. No floor, cast shadow, panel border, label, text, particles, scenery, logo, or watermark.
```

원본은 `tmp/boss-atlases/<bossId>.png`, 최종 프레임은 `assets/images/enemies/animations/<bossId>-<frame>.webp`입니다. 프레임 suffix는 `walk-1`, `walk-2`, `walk-3`, `hammer-windup`, `hammer-impact`, `hammer-recovery`입니다. 30개 ID는 위 표의 정적 보스 파일명에서 확장자를 뺀 값과 같습니다. Blood Moon 신규 원본은 2026-07-19의 imagegen 세션 아래에서 서로 독립된 15개 전장·보스·atlas 호출로 생성했고, 기존 맵이나 보스를 재색칠 입력으로 사용하지 않았습니다.

런타임은 일반 공격마다 망치 강타를 재생하지 않습니다. 걷기 프레임은 보스 이동 중 사용하고, 망치 준비·충돌·복귀 프레임은 공격 사거리 진입 후 5초 주기로 우선 발사되는 원거리 공격이 `special`로 지정된 경우에만 사용합니다.

## 쿠키봇 애니메이션 atlas

각 봇은 기존 종류의 재질·색·장비와 들고 있는 쿠키 원반을 유지하면서 아래 공통 지시로 3×2 atlas를 생성했습니다.

```text
Create one strict 3-column × 2-row game animation atlas of exactly the same premium 3D cookie defense robot.
Every cell must preserve the same robot proportions, face, materials, colors, shield/equipment, cookie disc, camera, scale, and lighting.
Top row, left to right: run contact pose A; passing/airborne pose; run contact pose B, with clearly different leg and body positions.
Bottom row, left to right: cookie-disc throw windup; throw release with the disc visibly leaving the hand; throw recovery after release.
Keep one complete robot centered inside every square cell with generous padding.
Use one exact flat chroma-key #00ff00 background across the entire atlas. No floor, cast shadow, panel border, label, text, extra character, scenery, logo, or watermark.
```

| 봇 | ID | 원본 atlas | 최종 6프레임 패턴 |
|---|---|---|---|
| 초코 쿠키봇 | `choco-bot` | `tmp/bot-atlases/choco-bot.png` | `assets/images/bots/animations/choco-bot-*.webp` |
| 밀크 쿠키봇 | `milk-bot` | `tmp/bot-atlases/milk-bot.png` | `assets/images/bots/animations/milk-bot-*.webp` |
| 민트 쿠키봇 | `mint-bot` | `tmp/bot-atlases/mint-bot.png` | `assets/images/bots/animations/mint-bot-*.webp` |
| 무지개 쿠키봇 | `rainbow-bot` | `tmp/bot-atlases/rainbow-bot.png` | `assets/images/bots/animations/rainbow-bot-*.webp` |
| 로열 쿠키봇 | `royal-bot` | `tmp/bot-atlases/royal-bot.png` | `assets/images/bots/animations/royal-bot-*.webp` |

프레임 suffix는 `run-1`, `run-2`, `run-3`, `throw-windup`, `throw-release`, `throw-recovery`입니다.

## 신규 진화 쿠키 30종과 교체 1종

신규 쿠키에는 아래 공통 프롬프트 계약을 적용하고 표의 고유 지시를 주 피사체 설명에 추가했습니다. 기존 `classic.png`, `chocolate.png`, `crown.png`는 쿠키 재질과 렌더 방향을 확인하는 참고 이미지로만 사용했으며 신규 결과는 별개의 실루엣으로 만들었습니다.

```text
Use case: stylized-concept
Asset type: production mobile-game cookie evolution collectible
Create exactly one complete centered premium cute polished 3D mobile-game collectible on a square 1024×1024 canvas with at least 100px padding.
The dominant body must be recognizably baked cookie or shortbread with tactile toasted crumb detail; use attached edible icing, candy, crystal, or chocolate details to form the unique theme.
The entire background must be exact flat chroma key (#00ff00, or #ff00ff when green conflicts with the subject).
No humanoid face, arms, legs, extra object, floor, pedestal, cast shadow, reflection, gradient, texture, text, border, logo, trademark, or watermark. Do not make a simple recolor of another cookie.
```

| 순서 | 쿠키·고유 지시 | 크로마키 raw PNG | 최종 512×512 투명 WebP |
|---:|---|---|---|
| 14 | 별빛 쇼트케이크: 딸기 조각과 별빛 크림을 여러 층으로 쌓아 6단계 딸기 케이크와 구분 | `tmp/cookie-assets/shortcake.png` | `assets/images/cookies/shortcake.webp` |
| 21 | 오로라 보석: 육각 버터쿠키 메달, 다섯 오로라 설탕 결정과 중앙 다면체 보석 | `tmp/cookie-assets/aurora-gem.png` | `assets/images/cookies/aurora-gem.webp` |
| 22 | 심해 진주: 부채꼴 조개 쇼트브레드, 깊은 굴곡과 중앙 진주, 남색·아이보리 장식 | `tmp/cookie-assets/deepsea-pearl.png` | `assets/images/cookies/deepsea-pearl.webp` |
| 23 | 태양 불꽃: 원형 허니 진저 쿠키, 불규칙한 12개 불꽃 쿠키 날개와 호박색 캔디 소용돌이 | `tmp/cookie-assets/solar-flare.png` | `assets/images/cookies/solar-flare.webp` |
| 24 | 달빛 여왕: 세로형 코코아·바닐라 사블레 카메오, 초승달 왕관·아이보리 망토·월석 | `tmp/cookie-assets/lunar-empress.png` | `assets/images/cookies/lunar-empress.webp` |
| 25 | 시간 태엽: 톱니형 초코칩 쿠키, 황금 시계판·기어·태엽 열쇠 | `tmp/cookie-assets/clockwork.png` | `assets/images/cookies/clockwork.webp` |
| 26 | 차원 균열: 갈라진 구운 쿠키 사이의 보라·청록 수정 차원과 초콜릿 연결 구조 | `tmp/cookie-assets/dimension-rift.png` | `assets/images/cookies/dimension-rift.webp` |
| 27 | 용왕 비늘: 왕관·알 형태 쿠키, 붉고 푸른 다면체 비늘과 초콜릿 뿔 | `tmp/cookie-assets/dragon-scale.png` | `assets/images/cookies/dragon-scale.webp` |
| 28 | 은하 성운: 원형 구운 쿠키 위 별이 태어나는 소용돌이 성운과 별무리 | `tmp/cookie-assets/nebula.png` | `assets/images/cookies/nebula.webp` |
| 29 | 창세 수정: 각진 구운 쿠키 지오드와 창세의 다면 수정, 새 세계가 태어나는 빛 | `tmp/cookie-assets/genesis-crystal.png` | `assets/images/cookies/genesis-crystal.webp` |
| 30 | 무한 우주: 무한대 고리 실루엣의 구운 쿠키와 끝없이 이어지는 우주 표현 | `tmp/cookie-assets/infinite-cosmos.png` | `assets/images/cookies/infinite-cosmos.webp` |
| 31 | 혜성 꼬리: 불꽃 꼬리를 가진 혜성형 구운 쿠키 | `tmp/cookie-assets/comet-tail.png` | `assets/images/cookies/comet-tail.webp` |
| 32 | 북극성 나침반: 별침과 방향 표식을 가진 나침반형 쿠키 | `tmp/cookie-assets/polar-compass.png` | `assets/images/cookies/polar-compass.webp` |
| 33 | 세계수 잎: 잎맥과 세계수 빛을 강조한 잎형 쿠키 | `tmp/cookie-assets/world-tree-leaf.png` | `assets/images/cookies/world-tree-leaf.webp` |
| 34 | 불사조 깃털: 불꽃빛 깃털 실루엣 쿠키 | `tmp/cookie-assets/phoenix-feather.png` | `assets/images/cookies/phoenix-feather.webp` |
| 35 | 천둥 북: 번개 장식의 북형 쿠키 | `tmp/cookie-assets/thunder-drum.png` | `assets/images/cookies/thunder-drum.webp` |
| 36 | 꿈구름 마카롱: 구름과 별빛 장식의 마카롱 쿠키 | `tmp/cookie-assets/dream-cloud.png` | `assets/images/cookies/dream-cloud.webp` |
| 37 | 영혼 등불: 푸른 불빛을 품은 등불형 쿠키 | `tmp/cookie-assets/spirit-lantern.png` | `assets/images/cookies/spirit-lantern.webp` |
| 38 | 태고 룬: 고대 문양이 새겨진 룬석형 쿠키 | `tmp/cookie-assets/ancient-rune.png` | `assets/images/cookies/ancient-rune.webp` |
| 39 | 하늘섬: 떠 있는 섬과 구름을 결합한 쿠키 | `tmp/cookie-assets/sky-island.png` | `assets/images/cookies/sky-island.webp` |
| 40 | 별빛 대장간: 모루와 별불꽃을 결합한 쿠키 | `tmp/cookie-assets/stellar-forge.png` | `assets/images/cookies/stellar-forge.webp` |
| 41 | 영원의 모래시계: 빛나는 모래시계형 쿠키 | `tmp/cookie-assets/eternity-hourglass.png` | `assets/images/cookies/eternity-hourglass.webp` |
| 42 | 우주 연꽃: 성운빛 꽃잎의 연꽃형 쿠키 | `tmp/cookie-assets/cosmic-lotus.png` | `assets/images/cookies/cosmic-lotus.webp` |
| 43 | 운명 거울: 장식 테두리와 별빛 반사를 가진 거울형 쿠키 | `tmp/cookie-assets/destiny-mirror.png` | `assets/images/cookies/destiny-mirror.webp` |
| 44 | 천상의 하프: 금빛 현과 날개 장식의 하프형 쿠키 | `tmp/cookie-assets/celestial-harp.png` | `assets/images/cookies/celestial-harp.webp` |
| 45 | 무지개 프리즘: 스펙트럼 빛을 나누는 수정형 쿠키 | `tmp/cookie-assets/rainbow-prism.png` | `assets/images/cookies/rainbow-prism.webp` |
| 46 | 황혼 봉인: 해와 달 문양이 결합된 봉인형 쿠키 | `tmp/cookie-assets/twilight-seal.png` | `assets/images/cookies/twilight-seal.webp` |
| 47 | 기적의 성배: 빛을 품은 성배형 쿠키 | `tmp/cookie-assets/miracle-chalice.png` | `assets/images/cookies/miracle-chalice.webp` |
| 48 | 태초의 알: 창세 빛과 균열이 있는 알형 쿠키 | `tmp/cookie-assets/primordial-egg.png` | `assets/images/cookies/primordial-egg.webp` |
| 49 | 세계의 문: 차원 너머 빛을 품은 문형 쿠키 | `tmp/cookie-assets/world-gate.png` | `assets/images/cookies/world-gate.webp` |
| 50 | 쿠키왕국 심장: 왕국 문장과 빛나는 심장을 결합한 쿠키 | `tmp/cookie-assets/kingdom-heart.png` | `assets/images/cookies/kingdom-heart.webp` |

raw 31개는 모두 정사각형 RGB PNG이며 균일한 초록 또는 자홍 크로마키 외곽과 완전한 오브젝트 여백을 확인했습니다. 별빛 쇼트케이크와 31~50단계는 각각 독립된 이미지 생성 호출로 만들었습니다. 1~50단계 런타임 쿠키는 모두 512×512 RGBA WebP, 투명·불투명 알파 범위 `(0, 255)`, 네 모서리 알파 8 이하를 통과했으며 합계 크기는 2,265,782바이트입니다. 바닥·문자·워터마크는 포함하지 않았습니다.

### 교체 및 31~50단계 생성 결과 ID

| 쿠키 키 | imagegen 결과 |
|---|---|
| `shortcake` | `exec-8e5e488f-9f03-48b3-a093-699f5a57fc84.png` |
| `comet-tail` | `exec-d54e072d-60b2-45cd-99a5-633d53b4b1e2.png` |
| `polar-compass` | `exec-af388df7-07e3-433c-81d9-1c6c48139313.png` |
| `world-tree-leaf` | `exec-4dfdfba5-666a-44d6-adbe-efc508221b75.png` |
| `phoenix-feather` | `exec-28c6f679-8019-4a78-9592-247cf47fc795.png` |
| `thunder-drum` | `exec-10d90f09-f1d8-4e4b-84cf-dfbc014e3af8.png` |
| `dream-cloud` | `exec-4a43a508-4abb-4d4b-ad41-823fd1e494ba.png` |
| `spirit-lantern` | `exec-8605a883-2abd-4b1d-8384-b774e2744781.png` |
| `ancient-rune` | `exec-c340e4fa-f23d-4ea5-9904-a7ab859e58e9.png` |
| `sky-island` | `exec-92ab6755-e7d9-4b42-aedb-08ab649fc0ac.png` |
| `stellar-forge` | `exec-34a27fc2-e014-4b85-a714-990cff48baeb.png` |
| `eternity-hourglass` | `exec-08267b3b-d6f2-457f-b0ca-1ba292d56b03.png` |
| `cosmic-lotus` | `exec-378ce1b9-05cf-4582-a369-7aee8c0c6ec7.png` |
| `destiny-mirror` | `exec-4ab75da2-e02c-4435-8e7b-d8f163455f20.png` |
| `celestial-harp` | `exec-896b8b1b-2667-432b-801f-3d2060af0ef3.png` |
| `rainbow-prism` | `exec-36b72b91-ee9e-4212-9c6c-740a3f55e693.png` |
| `twilight-seal` | `exec-c409322a-0ea6-4fda-bda8-0e5f319b6fed.png` |
| `miracle-chalice` | `exec-bcc49767-3978-41b8-9d6b-343851b67c90.png` |
| `primordial-egg` | `exec-fb0e1eb1-b0a0-430e-b8d9-6a05616745f8.png` |
| `world-gate` | `exec-b702bfd3-1f55-4d01-b766-aa0cc6ffaf82.png` |
| `kingdom-heart` | `exec-2e662712-c4e4-44f6-a61b-04080c0799af.png` |

### 51~80단계 생성 결과

신규 30종은 고유 실루엣을 선명하게 유지하면서 생성 호출 수와 일관성을 관리하기 위해 2×2 크로마키 atlas 7개와 2종 atlas 1개로 제작했습니다. `scripts/process_cookie_atlas.py`가 행 우선으로 셀을 자르고 90% 중앙 축소 여백을 만든 뒤 기존 soft matte·despill·경계·알파 검증을 재사용합니다.

| 결과 ID | 포함 imageKey |
|---|---|
| `exec-863e25cb-cd3b-4d1c-91e4-9ea2dcb8c691.png` | `crystal-dragon-egg`, `solar-lion`, `moon-rabbit`, `star-whale` |
| `exec-8d3af11f-6d7f-417d-a0da-f365d02e0d78.png` | `storm-pegasus`, `desert-sphinx`, `deepsea-trident`, `volcano-heart` |
| `exec-fa1bf173-79d7-40d6-a97e-bae294255072.png` | `ice-palace`, `emerald-guardian-tree`, `candy-mecha-dragon`, `time-library` |
| `exec-106d8ee1-4fce-45ed-8aa2-123ab6f22408.png` | `dream-butterfly`, `aurora-castle`, `thunder-crown`, `phoenix-crown` |
| `exec-10f5af63-0ccd-4ee1-9113-69fa5abe9c0a.png` | `world-tree-crown`, `fate-star-map`, `creation-compass`, `void-beacon` |
| `exec-803a905b-4fdf-4d67-a371-eac8e04f3da2.png` | `galaxy-key`, `celestial-dragon`, `dimension-cube`, `eternity-throne` |
| `exec-b05b4ae5-c5a5-4e78-b597-cbea53c8da9a.png` | `cosmic-ark`, `genesis-clock`, `infinity-sanctuary`, `multiverse-gem` |
| `exec-1a46e2d4-9ee1-4b75-8130-df3a69ec1834.png` | `transcendence-crown`, `cookie-universe-core` |

30종 모두 서로 다른 알·사자·토끼·고래·페가수스·스핑크스·삼지창·화산 심장·궁전·나무·기계용·책·나비·왕관·지도·나침반·등대·열쇠·천상 용·큐브·왕좌·방주·시계·성전·보석·우주핵 실루엣을 직접 확인했습니다. 최종 파일은 512×512 투명 RGBA WebP 30개, 합계 2,020,494바이트입니다. 전체 쿠키 런타임 에셋은 80개, 4,286,276바이트이며 정적 레지스트리 테스트를 통과합니다.

## 마그마·전기 쿠키 조각

두 수집 조각은 Codex 내장 `imagegen`으로 각각 새로 생성했습니다. 마그마는 결과 `exec-5a77bdcf-ef97-4525-90b9-7c0a3040c97c.png`, 전기는 `exec-55b75199-fa83-4ebf-937d-b8aa452c4e32.png`입니다.

- 마그마 핵심 프롬프트: `broken triangular baked-cookie shard, molten orange-red lava fissures, compact fiery aura, premium polished child-friendly 3D mobile-game collectible, flat #00ff00 chroma key, no text·frame·shadow·watermark`
- 전기 핵심 프롬프트: `broken angular baked-cookie shard, cyan-white branching electric fissures and compact lightning arcs, premium polished child-friendly 3D mobile-game collectible, flat #ff00ff chroma key, no text·frame·shadow·watermark`

원본을 384×384로 축소한 뒤 내장 `remove_chroma_key.py`의 border 자동 키, soft matte, despill을 적용해 `assets/images/cookie-fragments/magma-cookie-fragment.webp`와 `electric-cookie-fragment.webp`로 저장했습니다. 마그마는 147,456픽셀 중 99,432개 완전 투명·2,427개 부분 투명, 전기는 93,891개 완전 투명·2,137개 부분 투명입니다. 두 결과 모두 투명 모서리, 완전한 조각 실루엣, 문자·로고·프레임 부재를 직접 확인했습니다.

## 최종 런타임 검수

- `boss-animation.json`의 30개 세트가 `monsters.json`의 모든 보스 ID와 일치할 것
- `bot-animation.json`의 5개 세트가 `bots.json`의 모든 봇 ID와 일치할 것
- 보스 180개·봇 30개 프레임 키가 정적 `require` 매핑에 모두 존재할 것
- 보스 걷기와 봇 달리기는 실제 자세가 달라야 하며 단일 이미지를 좌우로 흔드는 대체 애니메이션을 사용하지 않을 것
- 망치 강공격은 `special` 공격에만 준비·충돌·복귀를 재생하고 일반 원거리·근접 공격에는 재생하지 않을 것
- 봇 투척 원반은 표시된 봇의 실제 이동 좌표에 테이블의 손 높이 offset을 적용해 시작할 것
- 쿠키 80개의 `imageKey`가 `cookies.json`과 `CookieImage` 정적 WebP 매핑에 모두 존재할 것
- 런타임 마그마 화염 1개와 외부 CC0 번개 11종이 전용 정적 VFX 레지스트리에 모두 존재할 것. 이전 CC0 화산 16프레임은 출처 추적용으로 보관하되 런타임에서 참조하지 않을 것
- 마그마·전기 조각 2개의 ID가 `CookieFragmentImage` 정적 WebP 매핑에 모두 존재할 것
- 일반·슈퍼 크리티컬 HUD 아이콘 2개가 `CookieRareStatImage` 정적 WebP 매핑에 존재할 것
- 모든 생성 이미지에 문자, 로고, 상표, 워터마크와 크로마 잔색이 없을 것
