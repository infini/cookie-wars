# 난이도별 전장·보스 생성 기록

## 제작 방식

15개 전장과 15개 보스는 Codex 내장 `imagegen`을 에셋마다 한 번씩 호출해 별도 원본으로 생성했습니다. 특정 상용 게임, 캐릭터, 로고를 입력 이미지로 사용하지 않았습니다. 전장은 중심 자르기 후 941×1672 progressive JPG quality 84로 저장했습니다. 보스는 단색 크로마키 원본을 `remove_chroma_key.py`의 soft matte·despill로 제거하고 512×512 투명 WebP quality 86으로 저장했습니다.

최종 검수 조건은 다음과 같습니다.

- 전장은 색상 변형이 아니라 지형과 상단 랜드마크 자체가 다를 것
- 중앙 70%와 하단 성 배치 구역에 길·레인·고정 유닛·UI가 없을 것
- 보스의 전신과 망치가 잘리지 않고, 망치를 처음부터 손으로 쥐고 있을 것
- 보스 이미지 네 모서리 알파가 0이고 크로마 잔색이 없을 것
- 문자, 로고, 상표, 워터마크가 없을 것

## 최종 프롬프트 세트

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

## 난이도별 변형과 파일

| 난이도 | 전장 고유 지시 | 보스·망치 고유 지시 | 최종 전장 | 최종 보스 |
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

최종 파일은 각각 `assets/images/maps/`와 `assets/images/enemies/`에 있습니다. 15개 맵 총 용량은 약 4.3MB, 15개 보스 총 용량은 약 0.8MB입니다.
