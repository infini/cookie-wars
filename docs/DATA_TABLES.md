# 쿠키전쟁 데이터 테이블 가이드

게임 밸런스와 동작 상수는 `src/config`의 JSON 파일이 원본입니다. TypeScript 코드는 값을 중복 선언하지 않고 `src/config/index.ts`를 통해 읽습니다. JSON을 바꾼 뒤 `npm run verify`로 타입과 규칙 테스트를 확인합니다.

## 테이블 목록

| 파일 | 제어 범위 |
|---|---|
| `cookie-upgrades.json` | 쿠키 업그레이드의 초기 레벨, 능력치, 가격 |
| `cookie-upgrade-rules.json` | 클릭 힘·자동 생산·쿠키 성 체력의 무한 강화 증가량 |
| `discs.json` | 5종 원반의 영구 구매 가격과 초기 레벨 능력·강화 가격 |
| `disc-upgrade-rules.json` | 명시 레벨 이후 무한 강화 증가량과 쿨타임 하한 |
| `bots.json` | 봇 종류, 최초 가격, 가격 증가율, 피해, 공격 간격 |
| `monsters.json` | 적 이미지·등급, 기본 HP·공격, 속도·원반·크기 배율 |
| `enemy-waves.json` | 거대 보스 한 종류의 전투 구성 |
| `difficulties.json` | 난이도 순서, 보스 HP·공격 배율·이동 속도 |
| `boss-balance.json` | 성장한 쿠키봇 군단에 대한 보스 최소 생존 시간·즉사 방지 |
| `boss-behavior.json` | 보스 전역 공격력·공격 간격·이동 배율과 HP 분노 페이즈 |
| `boss-special-attack.json` | 보스 주기 망치 강공격의 시간·몸 동작·지면 충격·발사체·플래시 |
| `battle-stage-rules.json` | 같은 난이도의 승리별 보스 HP·공격·속도·원반 증가식 |
| `battle-maps.json` | 전투 배경 테마 ID·이름·정적 이미지 키 |
| `battle-map-rules.json` | 배경 교체 전투 간격과 난이도별 시작 테마 오프셋 |
| `enemy-discs.json` | 적 원반 레벨별 피해·크기·속도·쿨타임 |
| `giant-disc.json` | 거대 원반 피해·비행·크기·연출·버튼 표시 |
| `progression.json` | 다음 난이도 해금 승수, 최초 클리어 거대 원반 수, 저장·생산 주기 |
| `battle-rules.json` | 전투 좌표, 이동·충돌·공격 시간 |
| `battle-ui.json` | 성·봇·적 표시 크기, 상단 보스 HP, 체력 게이지 스타일 |
| `battle-feedback.json` | 보스 공격 예고·돌진, 다중 피격 폭발·전장 충격파·피해 숫자 연출 |
| `battle-audio.json` | 전투 효과음 그룹별 최소 간격과 음악·효과음 상대 음량 |
| `audio-settings.json` | 효과음 5단계별 실제 볼륨과 기본 단계 |
| `cookies.json` | 20종 쿠키의 자동 진화 조건, 이미지, 최종 능력 배율 |
| `save-migrations.json` | 이전 버전 데이터 ID를 현재 ID로 옮기는 호환 규칙 |

## 상점과 성장

현재 원반·쿠키봇 각 5종의 초기 가격은 다음과 같습니다. 실제 원본은 JSON이며 이 표도 변경 시 함께 갱신합니다.

| 원반 | 최초 가격 | Lv.1 공격력 | 쿠키봇 | 첫 가격 | 피해 배율 | 발사 간격 |
|---|---:|---:|---|---:|---:|---:|
| 초코칩 원반 | 30 | 3 | 초코 쿠키봇 | 35 | ×1 | 1.8초 |
| 우유 원반 | 60 | 10 | 밀크 쿠키봇 | 60 | ×2.2 | 1.4초 |
| 민트 원반 | 90 | 24 | 민트 쿠키봇 | 90 | ×4.6 | 1.0초 |
| 무지개 원반 | 135 | 50 | 무지개 쿠키봇 | 135 | ×9 | 0.7초 |
| 왕관 원반 | 250 | 130 | 로열 쿠키봇 | 250 | ×25 | 0.35초 |

### `cookie-upgrades.json`

- `id`: 저장 키이자 코드가 읽는 고유 ID
- `name`, `description`, `unit`: 한국어 UI 문구와 단위
- `levels[].level`: 단계 번호
- `levels[].value`: 해당 단계의 실제 능력치
- `levels[].cost`: 그 단계로 올라갈 때 소모할 쿠키. 첫 단계는 기본 보유이므로 0

`cookie-upgrade-rules.json`에 ID가 있는 클릭 힘(`clickPower`), 자동 생산(`autoProduction`), 쿠키 성 체력(`cookieHealth`)은 명시 레벨 뒤에도 무한히 강화됩니다.

- `valueIncreasePerLevel`: 이후 한 레벨마다 증가하는 능력치
- `costGrowthMultiplier`: 이후 강화 비용 증가 배율

쿠키 크기(`cookieSize`)는 이 규칙 테이블에 없으므로 `cookie-upgrades.json`의 마지막 단계가 최대입니다.

업그레이드 화면은 현재 쿠키 잔액으로 바로 살 수 있는 항목을 첫 그룹, 다음 단계는 있지만 쿠키가 부족한 항목을 두 번째 그룹, `next`가 없는 강화 완료 항목을 마지막 그룹에 둡니다. 잔액이나 레벨이 바뀔 때 selector가 다시 정렬하며 같은 그룹 안에서는 이 JSON 배열 순서를 그대로 유지합니다.

### `discs.json`과 무한 강화

- `purchaseCost`: 원반 최초 영구 구매 가격
- `levels[].damage`, `size`, `speed`, `cooldownMs`: 레벨별 전투 능력치
- `levels[].cost`: 해당 레벨로 강화하는 가격. Lv.1은 구매 직후 단계라 0

각 원반은 별도로 영구 구매하고 강화합니다. 구매한 원반 중 하나를 장착하며 쿠키봇과 쿠키 성은 모두 장착 원반의 현재 능력치를 사용합니다. 화면은 가격을 표시만 하고 구매 시 리듀서가 이 파일을 다시 읽어 잔액과 가격을 검증합니다.

`discs.json`의 마지막 명시 레벨 뒤에는 `disc-upgrade-rules.json`으로 다음 레벨을 계속 생성하므로 최고 레벨이 없습니다.

- `damageGrowthMultiplier`: 이후 레벨마다 곱할 공격력 성장 배율
- `sizeIncreasePerLevel`: 이후 레벨마다 더할 원반 크기
- `speedIncreasePerLevel`: 이후 레벨마다 더할 이동 속도
- `cooldownReductionMsPerLevel`: 이후 레벨마다 줄일 쿨타임
- `minimumCooldownMs`: 쿨타임이 더 내려가지 않는 안전 하한
- `costGrowthMultiplier`: 직전 기준 강화 비용의 단계별 증가 배율

쿨타임이 하한에 닿아도 공격력·크기·속도는 계속 증가합니다. `battle-rules.json`의 `maxRenderedPlayerDiscSize`는 높은 레벨에서 화면이 원반 하나로 가려지지 않게 그림만 제한하며 저장된 크기 능력치를 제한하지 않습니다.

### `bots.json`

- `baseCost`: 첫 번째 봇 가격
- `costMultiplier`: 보유 수량이 늘 때마다 적용하는 배율
- 실제 다음 가격: `floor(baseCost × costMultiplier ^ 보유수량)`
- `discDamageMultiplier`: 장착 원반 피해에 곱하는 봇 배율
- `attackIntervalMs`: 쿠키 원반 자동 발사 간격
- `accentColor`: 쿠키봇 화면에서 종류를 구분하는 테마 색상

봇 추가 시 새 고유 `id` 행을 추가합니다. 초기 저장 키, 상점 목록, 구매 가격, 전투의 활성 봇 목록은 테이블을 순회하여 자동 생성됩니다.

## 난이도와 몬스터

`difficulties.json`의 배열 순서가 실제 해금 순서입니다. 현재 순서는 easy부터 extreme god까지 15단계입니다.

- `enemyWaveId`: `enemy-waves.json`의 `id` 참조
- `enemyCount`: 전투에 등장하는 적 수
- `hpMultiplier`, `attackMultiplier`: 몬스터 기본값에 곱하는 배율
- `moveSpeed`: 중앙 쿠키 성으로 접근하는 속도
- `enemyDiscLevel`: `enemy-discs.json`의 단계

`progression.json`의 `winsToUnlockNextDifficulty`가 다음 단계 해금에 필요한 승리 수입니다. 현재 값은 20입니다. 1~20번 전투는 각각 처음 클리어할 때마다 `giantDiscRewardPerFirstClear` 수량만큼 거대 원반을 지급하며 현재 값은 1개입니다. 전투 승리로 쿠키는 지급하지 않습니다. 완료한 전투를 재도전할 때는 `rewardClaimedStageIds`에 같은 `난이도ID:전투번호` 키가 있으므로 거대 원반도 다시 지급하지 않습니다. 20승 뒤 재도전은 20번 전투로 처리됩니다.

현재 모든 난이도의 `enemyCount`는 1입니다. 스테이지 성장 테이블도 적 추가량을 0으로 유지하므로 1~20번째 전투 모두 보스 한 마리만 등장합니다.

### 단일 보스 자동 밸런스

`boss-balance.json`은 다수 적 전투 시절부터 성장한 쿠키봇 저장 데이터가 단일 보스를 한 발에 쓰러뜨리지 않도록 최소 HP만 보정합니다.

- `playerPowerBaseSurvivalSeconds`: 자동 공격 DPS 기준 easy 초반의 최소 목표 생존 시간
- `hpMultiplierReference`: 난이도 HP 배율을 생존 시간으로 환산하는 기준점
- `hpScalingExponent`: 난이도·스테이지 HP 배율이 목표 생존 시간에 반영되는 곡선
- `maximumPowerScaledSurvivalSeconds`: 매우 높은 난이도에서도 자동 보정이 넘지 않는 시간 상한
- `minimumAutomaticHitsToDefeat`: 가장 강한 쿠키봇 자동 원반을 최소 몇 번 맞아야 하는지 정하는 즉사 방지 하한

엔진은 먼저 `몬스터 기본 HP × 실효 난이도 HP 배율`을 계산합니다. 그다음 현재 장착 원반과 종류별 쿠키봇 수·피해 배율·발사 간격으로 자동 공격 DPS를 계산합니다. 테이블 기본 HP, `자동 DPS × 목표 생존 시간`, `가장 강한 자동 한 발 × 최소 명중 수` 가운데 가장 큰 값이 최종 보스 HP입니다. 초반처럼 전력이 낮으면 기존 HP가 우선되고, 과도하게 성장해 한 발 처치가 가능한 저장에서만 자동 하한이 크게 작동합니다. 쿠키 성 수동 공격과 소모품 거대 원반은 이 자동 DPS 보정에 포함하지 않습니다.

`enemy-waves.json`에는 `giant-boss-duel` 한 행만 있고 일반 패턴과 보스 ID가 모두 `cookie-tyrant`를 가리킵니다. `bossEveryEnemies`도 1이므로 다른 적이 생성될 수 없습니다. `monsters.json`의 추가 필드는 다음과 같습니다.

- `imageKey`, `rank`: 전투·도감의 이미지와 한국어 등급
- `moveSpeedMultiplier`: 난이도 이동 속도에 곱하는 개별 속도
- `discDamageMultiplier`: 적 원반 피해에 곱하는 개별 배율
- `sizeMultiplier`: 전투 표시 크기 배율. 최종 크기는 UI 테이블의 최소·최대 범위로 제한

### 같은 난이도의 전투 단계

`battle-stage-rules.json`은 완료한 승리 수를 기준으로 다음 전투를 강화합니다. 현재 전투 번호는 `min(승리 수 + 1, 20)`입니다.

- `hpMultiplierPerWin`: 승리 1회마다 기본 HP 배율에 추가할 비율
- `attackMultiplierPerWin`: 승리 1회마다 기본 공격 배율에 추가할 비율
- `moveSpeedMultiplierPerWin`: 승리 1회마다 기본 이동 속도에 추가할 비율
- `extraEnemyEveryWins`: 적 한 마리를 추가하는 승리 간격
- `extraEnemiesPerStep`: 위 간격마다 한 번에 늘어나는 적 수
- `maximumExtraEnemies`: 한 난이도에서 추가할 수 있는 최대 적 수
- `enemyDiscLevelEveryWins`: 적 원반 레벨을 하나 올리는 승리 간격

현재 `hpMultiplierPerWin=0.08`, `attackMultiplierPerWin=0.05`, `moveSpeedMultiplierPerWin=0.001`입니다. 이 값은 현재 난이도 자체가 아니라 easy 기준값에 곱한 뒤 각 난이도 기준값에 더하므로, 한 승리마다 실효 HP 배율 0.008, 공격 배율 0.005, 이동 속도 0.012가 일정하게 증가합니다. `enemyDiscLevelEveryWins=20`이라 같은 등급 1~20전투에서는 적 원반 레벨이 유지되고 다음 난이도에서 1레벨 오릅니다. `difficulties.json`의 각 다음 등급 첫 기준값은 이전 등급 20번째보다 위의 한 증가분만큼 높아 등급 경계가 항상 단조 증가합니다. `extraEnemiesPerStep`과 `maximumExtraEnemies`는 모두 0이므로 보스 수는 늘지 않습니다. 승리할 때만 다음 단계로 올라가고 패배는 진행도를 바꾸지 않습니다.

## 전투 배경 테마

`battle-maps.json`은 초원 왕국, 빙하 협곡, 태양 신전, 흑요석 균열의 네 행을 정의합니다. `imageKey`는 React Native 정적 번들 요구사항 때문에 `BattleMapImage.ts`의 `require` 매핑과 함께 추가해야 합니다. 각 이미지는 단순 색상 변형이 아니라 지형·건축·성 실루엣이 다른 독립 원본입니다.

`battle-map-rules.json`의 `stagesPerTheme`은 같은 배경을 유지할 전투 수이며 현재 5입니다. `difficultyThemeOffset`은 다음 난이도의 첫 전투가 이전 난이도와 다른 테마에서 시작하도록 난이도 인덱스에 곱하는 값입니다.

## 쿠키 진화

`cookies.json` 배열 순서가 진화 순서입니다. 현재 20종은 클래식 초코칩 → 행운 → 도넛 → 와플 → 컵케이크 → 딸기 케이크 → 달빛 → 파티 → 별빛 쌀쿠키 → 로열 초콜릿 → 별사탕 → 무지개 롤리팝 → 황금 푸딩 → 별빛 쇼트케이크 → 삼색 경단 → 은하수 빙수 → 황금 꿀단지 → 마법 파이 → 다이아몬드 → 천상 왕관입니다.

- `imageKey`: `CookieImage`가 정적으로 포함한 Noto 이미지 키
- `requiredTotalUpgradeLevels`: 네 가지 쿠키 업그레이드 현재 레벨 합계의 진화 조건
- `clickMultiplier`: 클릭당 획득량 배율
- `autoProductionMultiplier`: 자동 생산량 배율
- `healthMultiplier`: 전투의 쿠키 성 최대 HP 배율

조건을 만족한 가장 높은 쿠키가 자동 활성화됩니다. 별도 구매나 수동 장착은 없고 능력 배율은 누적하지 않으며 현재 쿠키 행 하나만 적용합니다. 새 쿠키를 추가할 때 요구 총레벨과 배율은 앞 단계보다 크게 설정하고 `CookieImage`의 이미지 키 매핑도 함께 추가합니다.

## 전투 규칙

`battle-rules.json`의 좌표는 대부분 화면 비율(0~1)입니다. `*Ms`는 밀리초입니다.

- 프레임: `tickMs`, `maxDeltaMs`
- 보스 이동: `enemyX`, `enemyStartY`, `enemyStopY`, `enemyMoveDivisor`
- 보스 공격: `enemyFirstShotDelayMs`, `enemyMeleeTriggerY`, `enemyMeleeIntervalMs`, `enemyAttackRadius`, `maximumSimultaneousEnemyProjectiles`
- 적 원반: `enemyProjectileStartOffsetY`, `enemyProjectileMoveDivisor`, `coreProjectileHitY`
- 아군 원반: `playerStartX/Y`, `playerHomingMs`, `playerProjectileMoveDivisor`, `playerProjectileMinimumFlightMs`, `playerHitToleranceX/Y`, `playerProjectileEndY`
- 공격 반경: `castleAttackRadius`, `botAttackRadius`. 현재 성 0.44, 봇 0.5이며 반경 밖의 적은 발사 대상으로 선택하지 않음
- 쿠키봇 편성·발사: `botFormationSlots[].x/y`. 봇 그림과 실제 발사 시작점이 같은 슬롯을 사용
- 쿠키봇 원반 크기: `botDiscSizeMultiplier`(성 원반 크기 대비 배율)
- 쿠키 성: `castleDiscDamageMultiplier`(장착 원반 기본 피해 대비 배율)
- 표시 안전값: `maxRenderedPlayerDiscSize`
- 결과 표시: `resultNoticeMs`

이 파일의 값은 전투 엔진만 해석합니다. 화면 컴포넌트에 같은 전투 수치를 다시 쓰지 않습니다.

### `boss-behavior.json`

- `globalAttackDamageMultiplier`: 난이도·스테이지 공격 결과에 곱하는 보스 기본 피해 배율. 현재 2이며 아래 전체 난이도 배율이 한 번 더 적용됨
- `globalAttackCooldownMultiplier`: 적 원반·근접 공격 간격 배율. 현재 0.5이므로 공격 속도가 정확히 2배
- `globalMoveSpeedMultiplier`: 난이도·스테이지 이동 속도에 마지막으로 곱하는 배율. 현재 0.8이므로 보스가 20% 느림
- `globalDifficultyMultiplier`: 최종 보스 HP와 원거리·근접 피해에 곱하는 전체 난이도 배율. 현재 1.2
- `enrageHealthRatio`: 분노 페이즈가 시작되는 남은 HP 비율. 현재 0.5
- `enrageAttackCooldownMultiplier`: 분노 후 공격 간격에 추가로 곱하는 배율
- `enrageProjectileDamageMultiplier`, `enrageMeleeDamageMultiplier`: 분노 후 원거리·근접 피해 배율
- `enrageAnnouncementMs`: `보스 분노!` 안내 유지 시간

### `battle-feedback.json`

- `enemyAttackWindupMs`, `enemyAttackDurationMs`: 공격 예고와 돌진 지속 시간
- `enemyAttack*`, `enemyHit*`, `castleHit*`: 공격·피격 크기, 이동, 흔들림, 지속 시간
- `aura*`, `enrage*`: 발사 예고와 분노 오라 크기·색·맥동
- `impact*`, `damageText*`: 명중 지점 충격 링·방사형 파편·피해 숫자 크기·표시 폭·색·시간
- `impactBursts[]`: 한 번의 명중에서 시간차로 터지는 효과의 상대 좌표·지연·크기·회전. 현재 다섯 위치
- `fieldShockwave*`: 성 수동 원반·거대 원반 강타 때 전장에 퍼지는 얇은 충격파
- `enemyProjectileTrail*`: 적 원반의 빨간 궤적과 발광

전투 엔진은 공격 종류·명중 위치·피해량을 이벤트로 보내고, 화면은 이 테이블을 이용해 동일 좌표에 연출을 그립니다. 원거리와 근접 공격은 같은 피해 경로를 사용하지만 공격 종류 이벤트로 동작을 구분합니다.

### `boss-special-attack.json`

- `intervalMs`: 마지막 강공격 이후 다음 기존 원거리 공격을 강공격으로 표시할 최소 주기. 현재 5초
- `windupMs`, `animationDurationMs`, `windupPeakProgress`, `slamPeakProgress`: 예고·전체 동작·망치를 들어 올리고 내려찍는 시점
- `windupRotationDeg`, `slamRotationDeg`, `*Pixels`, `*Scale*`: 망치를 든 보스 전체의 회전·상하 이동·충돌 압축
- `impact*`: 내려찍는 지점의 타원 충격파, 지면 균열 SVG 경로, 크기·선·색·발광
- `dust*`: 충돌 좌우로 퍼지는 먼지 입자의 좌표·반경·색
- `screenFlash*`: 강공격 순간 전장 전체의 짧은 플래시
- `screenShake*`: 내려찍은 뒤 짧게 감쇠하는 전장 흔들림
- `projectile*`: 강공격으로 표시된 기존 적 원반의 확대·색·궤적·발광

보스 기본 스프라이트는 항상 망치를 든 별도 이미지입니다. 강공격은 별도 발사나 피해 배율이 아닙니다. 엔진은 주기가 지난 기존 원거리 공격 한 발에 `special` 종류만 기록하며 피해는 `enemy-discs.json`과 `boss-behavior.json`의 일반 공식을 그대로 사용합니다.

### `giant-disc.json`

- `damageMultiplier`: 현재 최강 쿠키봇이 날리는 일반 원반 피해에 곱하는 값. 현재 정확히 30배. 봇이 없으면 장착 원반 기본 피해가 기준
- `speedMultiplier`: 일반 원반 속도에 곱하는 거대 원반 비행 속도 배율
- `attackRadius`: 거대 원반을 사용할 수 있는 보스 탐색 반경
- `renderWidthRatio`: 휴대폰 화면 너비 대비 표시 크기. 현재 0.34로 화면 약 1/3
- `effectPulseDurationMs`, `effectPulseScale`: 발사 중 오라가 맥동하는 주기와 크기
- `effectRingBorderWidth`, `effect*Color`: 두 겹 원형 오라, 발광, 안내 문구 색상
- `launchNoticeMs`: `거대 원반!` 전투 안내 표시 시간
- `button*Color`: 보유량·30배 수치를 표시하는 전투 버튼 색상

거대 원반은 전투에서만 사용할 수 있는 소모형 무기입니다. 버튼을 눌러 실제 발사에 성공하면 저장 상태의 `giantDiscCount`가 1 감소합니다. 보유량이 없거나 살아 있는 보스가 없으면 발사와 소모가 모두 일어나지 않습니다. 장착 원반·봇 종류·보유 수량이 성장하면 현재 최강 쿠키봇의 일반 한 발과 거대 원반이 함께 성장합니다. 최종 피해가 실제 발사체에 저장되어 충돌 시 보스 HP에서 차감됩니다.

### `battle-ui.json`

- `castleRenderSize`, `castleTouchWidth`: 성 그림과 터치 영역
- `botRenderSize`, `botLabelWidth`: 봇 그림과 이름 영역
- `enemyBaseRenderSize`, `enemyMinimumRenderSize`, `enemyMaximumRenderSize`: 등급별 배율 적용 전후 적 크기
- `enemyLabelWidth`, `enemyHealthWidth`, `castleHealthWidth`: 이름과 체력 게이지 폭
- `bossHealthHudTop`, `bossHealthWidthRatio`, `bossHealthBarHeight`: 화면 상단의 긴 보스 HP 표시 위치·폭·높이
- `giantDiscButtonTop`: 상단 보스 HP와 겹치지 않는 거대 원반 버튼 위치
- `unitPerspective*`: 맵의 위·아래 위치에 따른 유닛 원근 크기
- `groundShadow*`: 유닛 발밑 접촉 그림자 크기·위치·색상
- `projectileSpinDurationMs`: 원반 한 바퀴 회전 시간
- `healthBarHeight`, `healthBarOutlineWidth`, `healthBarOutlineColor`, `healthBarTrackColor`: 게이지 외곽선과 바탕
- `healthBarLowHue`, `healthBarHighHue`, `healthBarSaturationPercent`, `healthBarLightnessPercent`: 남은 체력 비율에 따라 빨강에서 초록으로 보간하는 HSL 범위

## 진행·사운드

`progression.json`:

- `winsToUnlockNextDifficulty`: 다음 난이도 해금 승수
- `giantDiscRewardPerFirstClear`: 전투 번호별 최초 클리어에 지급할 거대 원반 개수
- `saveDebounceMs`: 상태 변화 후 저장을 합쳐 처리하는 시간
- `autoProductionIntervalMs`: 자동 쿠키 생산 적용 주기

자동 생산은 이 주기의 완료 횟수에 현재 `개/초` 능력치를 곱합니다. 저장 시 `lastSavedAt`을 기록하고 재실행·백그라운드 복귀 시 같은 계산을 사용하므로 타이머가 멈춘 시간도 누적됩니다. 이전 저장처럼 시각이 없거나 기기 시계가 뒤로 간 경우에는 지급하지 않으며 임의의 최대 오프라인 기간은 두지 않습니다.

`audio-settings.json`:

- `defaultLevel`: 최초 효과음 단계
- `previewDelayMs`: 설정 버튼을 누른 뒤 새 볼륨으로 미리듣는 지연
- `levels[].level`, `volume`: UI 단계와 오디오 엔진 볼륨(0~1)의 대응

`battle-audio.json`:

- `minimumIntervalMs`: 아군·적·거대 원반, 약·강 피격, 보스 근접·분노 그룹별 최소 재생 간격
- `volumeMultipliers`: 5단계 전역 음량에 곱하는 액션별 상대 음량. 오케스트라 배경 음악은 효과음을 가리지 않도록 현재 0.28

## 안전하게 테이블을 변경하는 절차

1. JSON의 기존 ID는 저장 호환성을 위해 바꾸지 않습니다.
2. 새 항목에는 중복되지 않는 ID를 사용합니다.
3. 난이도의 `enemyWaveId`, 웨이브의 몬스터 ID처럼 다른 테이블을 참조하는 값이 실제로 존재하는지 확인합니다.
4. 레벨은 오름차순으로 연속되게 추가합니다.
5. `npm run verify`를 실행합니다.
6. Android 릴리스 APK를 빌드해 실제 기기에서 구매, 저장 복구, 전투를 확인합니다.

새 필드가 필요할 때는 JSON만 임의로 추가하지 말고 `src/types/game.ts`의 계약, `src/config/index.ts`, 관련 selector/engine, 테스트, 이 문서를 함께 갱신합니다.

기존 ID를 꼭 바꿔야 한다면 `save-migrations.json`에 이전 ID와 새 ID의 대응을 먼저 추가합니다. 현재 10종 시절 제거된 원반 5종의 소유·레벨과 쿠키봇 5종의 수량은 대응되는 현재 5종에 합산 복구됩니다. 이전 `cookie-bot` 수량과 이전 3종 몬스터 ID도 각각 현재 ID로 이전됩니다.
