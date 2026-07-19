# 외부 리소스와 라이선스

쿠키전쟁은 실행 중 외부 사이트에서 파일을 내려받지 않습니다. 아래 리소스를 프로젝트에 포함해 오프라인으로 사용합니다.

## 이미지

| 파일 | 원본 | 라이선스 |
|---|---|---|
| `cookie.png`, 앱 아이콘·스플래시 | Google Noto Emoji | Apache License 2.0 |
| `assets/images/cookies/`의 1~20단계 중 `shortcake.webp`를 제외한 런타임 WebP와 보관 PNG | Google Noto Emoji를 바탕으로 한 기존 진화 이미지 | Apache License 2.0 |
| `assets/images/cookies/shortcake.webp` | 중복되던 기존 이미지를 대체한 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/cookies/`의 21~50단계 런타임 WebP (`aurora-gem`~`kingdom-heart`) | 쿠키전쟁용 OpenAI 이미지 생성 결과 30종 | 프로젝트 전용 원본 |
| `monster-body.png`, `monster-eye.png`, `monster-mouth.png` 보관 원본 | Kenney Monster Builder Pack | CC0 1.0 |
| `cookie-castle.png`, `cookie-bot.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `crumb-minion.png`, `sugar-guard.png`, `chocolate-brute.png`, `wafer-sorcerer.png`, `cookie-tyrant.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/cookie-tyrant-hammer.png` | 기존 폭군과 신규 쿠키 전쟁망치를 결합한 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/boss-*.webp` 15종 | 난이도별 고유 망치 보스 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/animations/*.webp` 90개 | 난이도별 보스 15종의 걷기·망치 강공격 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/bots/animations/*.webp` 30개 | 쿠키봇 5종의 달리기·원반 투척 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-*.jpg` 15종 | 난이도별 고유 전장 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-medieval.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-glacier.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-desert.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-volcanic.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `flying-disc.png`, `enemy-disc.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |

생성 이미지는 특정 상용 게임의 캐릭터나 로고를 복제하지 않고 독자적인 3D 모바일 게임 아트 방향으로 제작했습니다. 아군 원반은 파랑·금색, 적 원반은 빨강·검붉은색입니다. 현재 전투에서 사용하는 15개 JPG 맵은 모두 세로 9:16, 상단 고유 랜드마크, 낮은 디테일의 중앙 70%, 동적 쿠키 성을 위한 열린 하단 지면을 유지합니다. 초원·과수원·설원·침수 정글·폭풍 절벽·악마계 5종·신계 5종은 지형과 건축 자체가 다르며 단순 색상·재질 변형을 사용하지 않았습니다. 15개 정적 WebP 보스와 보스별 6프레임은 갑옷·몸체 재료·실루엣·전쟁망치가 다르고 모든 프레임에서 망치를 실제로 들고 있습니다. 5종 봇의 30프레임은 종류별 재질과 장비를 유지하면서 달리기와 원반 투척 자세를 구분합니다. 21~50단계 생성 쿠키 30종은 구운 쿠키 질감을 중심 재료로 유지하면서 단계별 고유 실루엣과 장식을 사용합니다. 14단계 별빛 쇼트케이크도 6단계 딸기 케이크와 중복되지 않는 별·크림 층 실루엣의 프로젝트 전용 이미지로 교체했습니다.

표에서 `프로젝트 전용 원본`으로 표시한 생성 이미지는 코드의 MIT License 범위에 포함하지 않습니다. 별도 표기가 없는 한 이미지 자체의 재사용·재배포에는 프로젝트 소유자의 별도 허가가 필요합니다.

망치 보스는 Codex 내장 `imagegen`으로 제작했습니다. 먼저 `거대한 초콜릿 비스킷 망치 머리, 황금 보강재와 붉은 보석, 긴 코코아 목재 손잡이, 단일 무기, 3D 모바일 게임 렌더` 프롬프트로 망치를 생성했습니다. 이어 기존 `cookie-tyrant.png`를 편집 대상으로, 망치를 보조 입력으로 사용해 `기존 얼굴·왕관·갑옷·비율을 유지하고 왼손으로 망치를 쥔 전투 대기 자세`를 만들었습니다. 균일한 녹색 배경을 로컬 크로마키 처리해 최종 투명 PNG `cookie-tyrant-hammer.png`로 저장했습니다.

### 전투 맵 생성 기록

세 신규 테마는 Codex의 내장 `imagegen`으로 새로 생성했으며 기존 초원 맵을 입력 이미지로 사용하지 않았습니다.

- 빙하 협곡 원본: `exec-58184bdb-358a-4885-bbee-70448be273d0.png`. 핵심 프롬프트는 `9:16 세로, 붉은 북유럽 목조 요새와 자연 빙하 절벽, 아래 푸른 원정대 보루, 중앙 70% 열린 얼음 분지, 길·유닛·UI·텍스트 없음`입니다.
- 태양 신전 원본: `exec-fdb34860-db0c-4a6d-ada1-225645018530.png`. 핵심 프롬프트는 `9:16 세로, 협곡 위 붉은 지구라트·자칼 신전, 아래 푸른 오아시스 수정 주둔지, 중앙 70% 열린 모래 전장, 길·유닛·UI·텍스트 없음`입니다.
- 흑요석 균열 원본: `exec-823dbe12-f547-445e-bde0-92b73d28ecf6.png`. 핵심 프롬프트는 `9:16 세로, 붉은 흑요석 악마 성채, 아래 푸른 수정 보루, 중앙 70% 열린 검은 화산 분지와 용암 균열, 길·유닛·UI·텍스트 없음`입니다.

세 프롬프트 모두 상용 모바일 디펜스 게임용 높은 시점, 가장자리 고해상도·중앙 낮은 디테일, 기존 중세 안뜰의 재색칠 금지를 명시했습니다.

현재 사용하는 전장·보스·보스 애니메이션·쿠키봇 애니메이션·신규 쿠키의 최종 파일, 생성 방식, 공통 프롬프트와 변환·검수 절차는 [`GENERATED_ASSETS.md`](GENERATED_ASSETS.md)에 기록했습니다. 맵은 941×1672 progressive JPG quality 84, 정적 보스는 512×512 투명 WebP quality 86, 애니메이션 프레임은 384×384 lossless 투명 WebP, 쿠키 런타임 이미지는 512×512 투명 WebP quality 90으로 최적화했습니다. PNG 원본은 재가공용으로만 보관하고 앱은 50개 WebP를 정적 번들합니다.

## 효과음

| 사용처 | 원본 팩 | 라이선스 |
|---|---|---|
| 일반 쿠키 클릭·크리티컬 기본 깨짐음 | qubodup, Freesound `Crunch` | CC0 1.0 |
| 쿠키 크리티컬 충격 | Mixkit `Short explosion` | Mixkit Sound Effects Free License |
| 쿠키 크리티컬 반짝임 | Mixkit `Fairy arcade sparkle` | Mixkit Sound Effects Free License |
| 쿠키 슈퍼 크리티컬 충격 | Mixkit `Movie trailer epic impact` | Mixkit Sound Effects Free License |
| 쿠키 슈퍼 크리티컬 마법 광채 | Mixkit `Choir magic shine` | Mixkit Sound Effects Free License |
| 메뉴 선택 | Kenney Interface Sounds `click_003.ogg` | CC0 1.0 |
| 강화 성공 | Kenney Interface Sounds `confirmation_002.ogg` | CC0 1.0 |
| 사용 불가 | Kenney Interface Sounds `back_003.ogg` | CC0 1.0 |
| 아군 원반 | Kenney RPG Audio `knifeSlice.ogg` | CC0 1.0 |
| 적·거대 원반, 분노 | Kenney Digital Audio `phaserDown3.ogg`, `phaseJump3.ogg`, `powerUp10.ogg` | CC0 1.0 |
| 약한 피격 3종, 강한 피격, 근접 타격 | Kenney Impact Sounds `impactGeneric_light_000~002.ogg`, `impactPunch_heavy_001.ogg`, `impactWood_heavy_003.ogg` | CC0 1.0 |
| 전투 배경 음악 | MintoDog, `Hope (Orchestral battle music)` | CC0 1.0 |
| 보관 중인 이전 피격·원반·적 처치 `hit.ogg`, `disc-throw.ogg`, `enemy-defeated.ogg` | Kenney Impact Sounds / Sci-Fi Sounds | CC0 1.0 |
| 보관 중인 이전 쿠키봇 `bot-laser.ogg` | Kenney Sci-Fi Sounds | CC0 1.0 |
| 보관 중인 이전 결과음 `victory.ogg`, `defeat.ogg` | Kenney Music Jingles | CC0 1.0 |

`보관 중` 파일과 이전 `cookie-click.ogg`, `cookie-critical-explosion.wav`는 소스 호환과 원본 추적을 위해 저장소에 남아 있지만 현재 코드에서 불러오지 않으며, 클린 릴리스 APK에는 포함하지 않습니다.

일반 클릭에는 Freesound의 `Crunch` 공식 HQ 미리듣기 MP3를 사용합니다. 원본은 qubodup이 공개한 첫 번째 바삭한 토스트 한입 녹음이며 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)입니다. 앱은 같은 녹음을 세 플레이어와 세 가지 작은 재생 속도 차이로 번갈아 사용해 연속 클릭의 반복감을 줄입니다. 원본 페이지, 로컬 인코딩과 SHA-256은 `assets/licenses/FREESOUND_COOKIE_SOUND_SOURCE.txt`에 기록했습니다.

강한 크리티컬은 같은 깨짐음 위에 Mixkit `Short explosion` 충격음과 70ms 뒤의 `Fairy arcade sparkle`을 겹칩니다. 두 파일은 Mixkit 미리듣기 MP3이며 [Mixkit Free License](https://mixkit.co/license/)의 Sound Effects 항목을 따릅니다. 항목 ID, 다운로드 URL, 로컬 파일명과 SHA-256은 `assets/licenses/MIXKIT_SOUND_EFFECT_SOURCE.txt`에 기록했습니다. 짧은 시간에 크리티컬이 연속 발생하면 큰 레이어는 최소 간격으로 제한하고 작은 시각·기본 클릭 피드백만 유지합니다. 재생 속도, 상대 음량, 최소 간격과 지연은 `cookie-feedback.json`에서 관리합니다.

슈퍼 크리티컬은 Mixkit `Movie trailer epic impact`와 90ms 뒤의 `Choir magic shine`을 전용으로 겹칩니다. 일반 크리티컬과 다른 두 원본을 사용하며, 4초 안에 다시 발동하면 보상은 전부 지급하고 긴 음원 레이어만 축약합니다. 두 파일의 항목 ID·직접 다운로드 주소·SHA-256도 같은 출처 기록 파일에 남겼습니다.

## 글꼴과 아이콘

- Jua: SIL Open Font License 1.1 (`@expo-google-fonts/jua`)
- MaterialCommunityIcons 글꼴·아이콘: Apache License 2.0 (Pictogrammers)
- `@expo/vector-icons` 코드: MIT License

재배포 가능한 원문 라이선스 사본과 에셋별 출처 기록은 `assets/licenses`에 포함되어 있습니다. Mixkit은 로컬 출처 기록과 위 공식 라이선스 페이지를 함께 확인합니다.

## 원본 페이지

- [Google Noto Emoji](https://github.com/googlefonts/noto-emoji)
- [Kenney Monster Builder Pack](https://kenney.nl/assets/monster-builder-pack)
- [Kenney Robot Pack](https://kenney.nl/assets/robot-pack)
- [Kenney Medieval RTS Pack](https://kenney.nl/assets/medieval-rts)
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)
- [Kenney UI Audio](https://kenney.nl/assets/ui-audio)
- [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds)
- [Kenney Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds)
- [Kenney Music Jingles](https://kenney.nl/assets/music-jingles)
- [Kenney Digital Audio](https://kenney.nl/assets/digital-audio)
- [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio)
- [Hope (Orchestral battle music)](https://opengameart.org/content/hopeorchestral-battle-music)
- [Freesound · Crunch by qubodup](https://freesound.org/people/qubodup/sounds/816237/)
- [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- [Mixkit Boom Sound Effects · Short explosion](https://mixkit.co/free-sound-effects/boom/)
- [Mixkit Video Game Sound Effects · Fairy arcade sparkle](https://mixkit.co/free-sound-effects/video-game/)
- [Mixkit Impact Sound Effects · Movie trailer epic impact](https://mixkit.co/free-sound-effects/impact/)
- [Mixkit Magic Sound Effects · Choir magic shine](https://mixkit.co/free-sound-effects/magic/)
- [Mixkit Free License](https://mixkit.co/license/)
