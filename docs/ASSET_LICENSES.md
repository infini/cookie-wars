# 외부 리소스와 라이선스

쿠키전쟁은 실행 중 외부 사이트에서 파일을 내려받지 않습니다. 아래 리소스를 프로젝트에 포함해 오프라인으로 사용합니다.

## 이미지

| 파일 | 원본 | 라이선스 |
|---|---|---|
| `cookie.png`, 앱 아이콘·스플래시 | Google Noto Emoji | Apache License 2.0 |
| `assets/images/cookies/*.png` 20종 진화 이미지 | Google Noto Emoji | Apache License 2.0 |
| `cookie-castle.png`, `cookie-bot.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/*.png` 5종 | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/cookie-tyrant-hammer.png` | 기존 폭군과 신규 쿠키 전쟁망치를 결합한 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/enemies/boss-*.webp` 15종 | 난이도별 고유 망치 보스 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-*.jpg` 15종 | 난이도별 고유 전장 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-medieval.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-glacier.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-desert.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `assets/images/maps/battle-map-volcanic.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |
| `flying-disc.png`, `enemy-disc.png` | 쿠키전쟁용 OpenAI 이미지 생성 결과 | 프로젝트 전용 원본 |

생성 이미지는 특정 상용 게임의 캐릭터나 로고를 복제하지 않고 독자적인 3D 모바일 게임 아트 방향으로 제작했습니다. 아군 원반은 파랑·금색, 적 원반은 빨강·검붉은색입니다. 현재 전투에서 사용하는 15개 JPG 맵은 모두 세로 9:16, 상단 고유 랜드마크, 낮은 디테일의 중앙 70%, 동적 쿠키 성을 위한 열린 하단 지면을 유지합니다. 초원·과수원·설원·침수 정글·폭풍 절벽·악마계 5종·신계 5종은 지형과 건축 자체가 다르며 단순 색상·재질 변형을 사용하지 않았습니다. 15개 WebP 보스는 갑옷·몸체 재료·실루엣·전쟁망치가 모두 다르고, 모든 원본에서 망치를 처음부터 손으로 쥐고 있습니다.

망치 보스는 Codex 내장 `imagegen`으로 제작했습니다. 먼저 `거대한 초콜릿 비스킷 망치 머리, 황금 보강재와 붉은 보석, 긴 코코아 목재 손잡이, 단일 무기, 3D 모바일 게임 렌더` 프롬프트로 망치를 생성했습니다. 이어 기존 `cookie-tyrant.png`를 편집 대상으로, 망치를 보조 입력으로 사용해 `기존 얼굴·왕관·갑옷·비율을 유지하고 왼손으로 망치를 쥔 전투 대기 자세`를 만들었습니다. 균일한 녹색 배경을 로컬 크로마키 처리해 최종 투명 PNG `cookie-tyrant-hammer.png`로 저장했습니다.

### 전투 맵 생성 기록

세 신규 테마는 Codex의 내장 `imagegen`으로 새로 생성했으며 기존 초원 맵을 입력 이미지로 사용하지 않았습니다.

- 빙하 협곡 원본: `exec-58184bdb-358a-4885-bbee-70448be273d0.png`. 핵심 프롬프트는 `9:16 세로, 붉은 북유럽 목조 요새와 자연 빙하 절벽, 아래 푸른 원정대 보루, 중앙 70% 열린 얼음 분지, 길·유닛·UI·텍스트 없음`입니다.
- 태양 신전 원본: `exec-fdb34860-db0c-4a6d-ada1-225645018530.png`. 핵심 프롬프트는 `9:16 세로, 협곡 위 붉은 지구라트·자칼 신전, 아래 푸른 오아시스 수정 주둔지, 중앙 70% 열린 모래 전장, 길·유닛·UI·텍스트 없음`입니다.
- 흑요석 균열 원본: `exec-823dbe12-f547-445e-bde0-92b73d28ecf6.png`. 핵심 프롬프트는 `9:16 세로, 붉은 흑요석 악마 성채, 아래 푸른 수정 보루, 중앙 70% 열린 검은 화산 분지와 용암 균열, 길·유닛·UI·텍스트 없음`입니다.

세 프롬프트 모두 상용 모바일 디펜스 게임용 높은 시점, 가장자리 고해상도·중앙 낮은 디테일, 기존 중세 안뜰의 재색칠 금지를 명시했습니다.

현재 사용하는 15개 난이도별 전장·보스의 최종 파일, 원본 생성 경로, 공통 프롬프트와 난이도별 지시는 [`GENERATED_ASSETS.md`](GENERATED_ASSETS.md)에 기록했습니다. 맵은 941×1672 progressive JPG quality 84, 보스는 크로마키 제거 후 512×512 투명 WebP quality 86으로 최적화했습니다.

## 효과음

| 사용처 | 원본 팩 | 라이선스 |
|---|---|---|
| 쿠키 클릭 | Kenney UI Audio | CC0 1.0 |
| 메뉴 선택 | Kenney Interface Sounds `click_003.ogg` | CC0 1.0 |
| 강화 성공 | Kenney Interface Sounds `confirmation_002.ogg` | CC0 1.0 |
| 사용 불가 | Kenney Interface Sounds `back_003.ogg` | CC0 1.0 |
| 아군 원반 | Kenney RPG Audio `knifeSlice.ogg` | CC0 1.0 |
| 적·거대 원반, 분노 | Kenney Digital Audio `phaserDown3.ogg`, `phaseJump3.ogg`, `powerUp10.ogg` | CC0 1.0 |
| 약한 피격 3종, 강한 피격, 근접 타격 | Kenney Impact Sounds `impactGeneric_light_000~002.ogg`, `impactPunch_heavy_001.ogg`, `impactWood_heavy_003.ogg` | CC0 1.0 |
| 전투 배경 음악 | MintoDog, `Hope (Orchestral battle music)` | CC0 1.0 |

## 글꼴과 아이콘

- Jua: SIL Open Font License 1.1 (`@expo-google-fonts/jua`)
- MaterialCommunityIcons 글꼴·아이콘: Apache License 2.0 (Pictogrammers)
- `@expo/vector-icons` 코드: MIT License

원문 라이선스 사본은 `assets/licenses`에 포함되어 있습니다.

## 원본 페이지

- [Google Noto Emoji](https://github.com/googlefonts/noto-emoji)
- [Kenney Monster Builder Pack](https://kenney.nl/assets/monster-builder-pack)
- [Kenney Robot Pack](https://kenney.nl/assets/robot-pack)
- [Kenney Medieval RTS Pack](https://kenney.nl/assets/medieval-rts)
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)
- [Kenney UI Audio](https://kenney.nl/assets/ui-audio)
- [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds)
- [Kenney Digital Audio](https://kenney.nl/assets/digital-audio)
- [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio)
- [Hope (Orchestral battle music)](https://opengameart.org/content/hopeorchestral-battle-music)
