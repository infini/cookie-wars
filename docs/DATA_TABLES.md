# 쿠키전쟁 데이터 테이블 가이드

게임 밸런스와 동작 상수는 `src/config`의 JSON 파일이 원본입니다. TypeScript 코드는 값을 중복 선언하지 않고 `src/config/index.ts`를 통해 읽습니다. JSON을 바꾼 뒤 `npm run verify`로 타입과 규칙 테스트를 확인합니다.

## 테이블 목록

| 파일 | 제어 범위 |
|---|---|
| `cookie-upgrades.json` | 쿠키 업그레이드의 초기 레벨, 능력치, 가격 |
| `cookie-upgrade-rules.json` | 클릭 힘·자동 생산·쿠키 성 체력의 무한 강화 증가량 |
| `discs.json` | 10종 원반의 영구 구매 가격과 초기 레벨 능력·강화 가격 |
| `disc-upgrade-rules.json` | 명시 레벨 이후 무한 강화 증가량과 쿨타임 하한 |
| `bots.json` | 봇 종류, 최초 가격, 가격 증가율, 피해, 공격 간격 |
| `monsters.json` | 몬스터 이름, 기본 HP·공격력, 설명 |
| `difficulties.json` | 난이도 순서, 출전 몬스터, 적 수·배율·이동 속도·보상 |
| `battle-stage-rules.json` | 같은 난이도의 승리별 HP·공격·속도·적 수·적 원반 증가식 |
| `enemy-discs.json` | 적 원반 레벨별 피해·크기·속도·쿨타임 |
| `progression.json` | 다음 난이도 해금 승수, 저장·생산 주기 |
| `battle-rules.json` | 전투 좌표, 이동·충돌·공격 시간 |
| `audio-settings.json` | 효과음 5단계별 실제 볼륨과 기본 단계 |
| `cookies.json` | 10종 쿠키의 자동 진화 조건, 이미지, 최종 능력 배율 |
| `save-migrations.json` | 이전 버전 데이터 ID를 현재 ID로 옮기는 호환 규칙 |

## 상점과 성장

현재 10종 콘텐츠의 초기 가격은 다음과 같습니다. 실제 원본은 JSON이며 이 표도 변경 시 함께 갱신합니다.

| 원반 | 최초 가격 | Lv.1 공격력 | 쿠키봇 | 첫 가격 | 피해 배율 | 발사 간격 |
|---|---:|---:|---|---:|---:|---:|
| 초코칩 원반 | 30 | 3 | 초코 쿠키봇 | 35 | ×1 | 1.8초 |
| 딸기 원반 | 45 | 6 | 베리 쿠키봇 | 45 | ×1.5 | 1.6초 |
| 우유 원반 | 60 | 10 | 밀크 쿠키봇 | 60 | ×2.2 | 1.4초 |
| 카라멜 원반 | 75 | 16 | 카라멜 쿠키봇 | 75 | ×3.2 | 1.2초 |
| 민트 원반 | 90 | 24 | 민트 쿠키봇 | 90 | ×4.6 | 1.0초 |
| 땅콩 원반 | 110 | 35 | 땅콩 쿠키봇 | 110 | ×6.5 | 0.85초 |
| 무지개 원반 | 135 | 50 | 무지개 쿠키봇 | 135 | ×9 | 0.7초 |
| 별빛 원반 | 165 | 70 | 별빛 쿠키봇 | 165 | ×12.5 | 0.575초 |
| 용암 원반 | 200 | 95 | 용암 쿠키봇 | 205 | ×17.5 | 0.45초 |
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

- `monsterId`: `monsters.json`의 `id` 참조
- `enemyCount`: 전투에 등장하는 적 수
- `hpMultiplier`, `attackMultiplier`: 몬스터 기본값에 곱하는 배율
- `moveSpeed`: 중앙 쿠키 성으로 접근하는 속도
- `enemyDiscLevel`: `enemy-discs.json`의 단계
- `reward`: 그 난이도의 첫 승리에서만 주는 쿠키

`progression.json`의 `winsToUnlockNextDifficulty`가 다음 단계 해금에 필요한 승리 수입니다. 현재 값은 20이며 보상 횟수와는 무관합니다. 2승부터 20승까지도 승리 횟수는 오르지만 쿠키 보상은 다시 지급하지 않습니다.

### 같은 난이도의 전투 단계

`battle-stage-rules.json`은 완료한 승리 수를 기준으로 다음 전투를 강화합니다. 현재 전투 번호는 `min(승리 수 + 1, 20)`입니다.

- `hpMultiplierPerWin`: 승리 1회마다 기본 HP 배율에 추가할 비율
- `attackMultiplierPerWin`: 승리 1회마다 기본 공격 배율에 추가할 비율
- `moveSpeedMultiplierPerWin`: 승리 1회마다 기본 이동 속도에 추가할 비율
- `extraEnemyEveryWins`: 적 한 마리를 추가하는 승리 간격
- `maximumExtraEnemies`: 한 난이도에서 추가할 수 있는 최대 적 수
- `enemyDiscLevelEveryWins`: 적 원반 레벨을 하나 올리는 승리 간격

첫 승리 전에는 난이도 원본값을 그대로 사용합니다. 승리할 때만 다음 단계로 올라가고 패배는 진행도를 바꾸지 않습니다. 20승 후에는 20번째 전투의 배율을 유지하며 적 원반 레벨은 `enemy-discs.json`의 마지막 단계를 넘지 않습니다.

## 쿠키 진화

`cookies.json` 배열 순서가 진화 순서입니다. 현재 10종은 클래식 초코칩 → 행운 → 도넛 → 와플 → 컵케이크 → 딸기 케이크 → 달빛 → 파티 → 별빛 쌀쿠키 → 로열 초콜릿입니다.

- `imageKey`: `CookieImage`가 정적으로 포함한 Noto 이미지 키
- `requiredTotalUpgradeLevels`: 네 가지 쿠키 업그레이드 현재 레벨 합계의 진화 조건
- `clickMultiplier`: 클릭당 획득량 배율
- `autoProductionMultiplier`: 자동 생산량 배율
- `healthMultiplier`: 전투의 쿠키 성 최대 HP 배율

조건을 만족한 가장 높은 쿠키가 자동 활성화됩니다. 별도 구매나 수동 장착은 없고 능력 배율은 누적하지 않으며 현재 쿠키 행 하나만 적용합니다. 새 쿠키를 추가할 때 요구 총레벨과 배율은 앞 단계보다 크게 설정하고 `CookieImage`의 이미지 키 매핑도 함께 추가합니다.

## 전투 규칙

`battle-rules.json`의 좌표는 대부분 화면 비율(0~1)입니다. `*Ms`는 밀리초입니다.

- 프레임: `tickMs`, `maxDeltaMs`
- 적 배치: `enemyColumns`, `enemyStartX/Y`, `enemyColumnGap`
- 적 순차 출현: `initialEnemySpawnCount`, `enemySpawnIntervalMs`
- 적 이동 범위: `enemyStopY`, `enemyMinX`, `enemyMaxX`, `enemyMoveDivisor`
- 적 공격: `enemyFirstShotDelayMs`, `enemyShotStaggerMs`, `enemyMeleeTriggerY`, `enemyMeleeIntervalMs`
- 적 원반: `enemyProjectileStartOffsetY`, `enemyProjectileMoveDivisor`, `coreProjectileHitY`
- 아군 원반: `playerStartX/Y`, `playerHomingMs`, `playerProjectileMoveDivisor`, `playerHitToleranceX/Y`, `playerProjectileEndY`
- 쿠키 성: `castleDiscDamageMultiplier`(봇 원반 대비 피해 배율)
- 표시 안전값: `maxRenderedPlayerDiscSize`
- 결과 표시: `resultNoticeMs`

이 파일의 값은 전투 엔진만 해석합니다. 화면 컴포넌트에 같은 전투 수치를 다시 쓰지 않습니다.

## 진행·사운드

`progression.json`:

- `winsToUnlockNextDifficulty`: 다음 난이도 해금 승수
- `saveDebounceMs`: 상태 변화 후 저장을 합쳐 처리하는 시간
- `autoProductionIntervalMs`: 자동 쿠키 생산 적용 주기

`audio-settings.json`:

- `defaultLevel`: 최초 효과음 단계
- `previewDelayMs`: 설정 버튼을 누른 뒤 새 볼륨으로 미리듣는 지연
- `levels[].level`, `volume`: UI 단계와 오디오 엔진 볼륨(0~1)의 대응

## 안전하게 테이블을 변경하는 절차

1. JSON의 기존 ID는 저장 호환성을 위해 바꾸지 않습니다.
2. 새 항목에는 중복되지 않는 ID를 사용합니다.
3. 난이도의 `monsterId`처럼 다른 테이블을 참조하는 값이 실제로 존재하는지 확인합니다.
4. 레벨은 오름차순으로 연속되게 추가합니다.
5. `npm run verify`를 실행합니다.
6. Android 릴리스 APK를 빌드해 실제 기기에서 구매, 저장 복구, 전투를 확인합니다.

새 필드가 필요할 때는 JSON만 임의로 추가하지 말고 `src/types/game.ts`의 계약, `src/config/index.ts`, 관련 selector/engine, 테스트, 이 문서를 함께 갱신합니다.

기존 ID를 꼭 바꿔야 한다면 `save-migrations.json`에 이전 ID와 새 ID의 대응을 먼저 추가합니다. 현재 이전 버전의 `cookie-bot` 보유 수량은 첫 번째 10종 봇인 `choco-bot`으로 합산 복구됩니다.
