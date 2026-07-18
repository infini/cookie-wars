# 쿠키전쟁 데이터 테이블 가이드

게임 밸런스와 동작 상수는 `src/config`의 JSON 파일이 원본이며 메뉴 구성은 `src/navigation/navigation.json`이 원본입니다. TypeScript 코드는 값을 중복 선언하지 않고 검증된 모델을 통해 읽습니다. JSON을 바꾼 뒤 `npm run verify`로 타입과 규칙 테스트를 확인합니다.

## 테이블 목록

| 파일 | 제어 범위 |
|---|---|
| `cookie-upgrades.json` | 쿠키 업그레이드의 초기 레벨, 능력치, 가격 |
| `cookie-upgrade-rules.json` | 클릭 힘·쿠키 크리티컬·자동 생산·쿠키 성 체력의 무한 강화 증가량 |
| `cookie-critical.json` | 크리티컬 확률 단위·상한·획득 배수와 붉은 폭발 연출 |
| `discs.json` | 5종 원반의 영구 구매 가격과 초기 레벨 능력·강화 가격 |
| `disc-upgrade-rules.json` | 명시 레벨 이후 무한 강화 증가량과 쿨타임 하한 |
| `bots.json` | 봇 종류, 최초 가격, 가격 증가율, 피해, 공격 간격 |
| `monsters.json` | 적 이미지·등급, 기본 HP·공격, 속도·원반·크기 배율 |
| `enemy-waves.json` | 난이도별 고유 보스와 전투 구성 연결 |
| `difficulties.json` | 난이도 순서, 보스 HP·공격 배율·이동 속도 |
| `boss-balance.json` | 성장한 쿠키봇 군단에 대한 보스 최소 생존 시간·즉사 방지 |
| `boss-behavior.json` | 보스 전역 공격력·공격 간격·이동 배율과 HP 분노 페이즈 |
| `boss-special-attack.json` | 보스 주기 망치 강공격의 예고·지면 충격·발사체·플래시 |
| `boss-animation.json` | 15종 보스의 걷기·망치 강공격 프레임과 전환 시간 |
| `bot-animation.json` | 5종 쿠키봇의 순찰·표적 추종, 달리기·투척 프레임 |
| `battle-stage-rules.json` | 같은 난이도의 승리별 보스 HP·공격·속도·원반 증가식 |
| `battle-maps.json` | 난이도 ID별 고유 전투 배경 테마·정적 이미지 키 |
| `enemy-discs.json` | 적 원반 레벨별 피해·크기·속도·쿨타임 |
| `giant-disc.json` | 거대 원반 피해·비행·크기·연출·버튼 표시 |
| `battle-rewards.json` | 스테이지 진행 승리당 전투 훈장 수와 훈장당 영구 쿠키 능력 보너스 |
| `progression.json` | 다음 난이도 해금 승수, 최초 클리어 거대 원반 수, 저장·생산 주기 |
| `battle-rules.json` | 전투 좌표, 이동·충돌·공격 시간과 X1·X2·X3 속도 |
| `battle-ui.json` | 성·봇·적 표시 크기, 상단 보스 HP, 체력 게이지 스타일 |
| `battle-feedback.json` | 보스 공격 예고·돌진, 다중 피격 폭발·전장 충격파·피해 숫자 연출 |
| `battle-audio.json` | 전투 효과음 그룹별 최소 간격과 음악·효과음 상대 음량 |
| `audio-settings.json` | 효과음 5단계별 실제 볼륨과 기본 단계 |
| `cookies.json` | 30종 쿠키의 자동 진화 조건, 이미지, 최종 능력 배율 |
| `save-migrations.json` | 현재 저장 스키마 버전과 이전 데이터 ID 호환 규칙 |
| `../navigation/navigation.json` | 4대 메뉴, 소메뉴 소속·순서·아이콘·제목·기본 화면·배지 |

설정 로더는 레벨, 비용, 개수, 기준 HP·공격력, 원반 크기·속도·쿨타임처럼 게임 상태가 안전 정수로 다루는 필드에 소수나 `Number.MAX_SAFE_INTEGER` 초과 값을 허용하지 않습니다. 성장 배율, 난이도 배율, 좌표와 비율은 유한한 소수를 그대로 보존합니다. 불투명도·정규화 화면 비율·분노 체력 비율은 0~1, HSL 채도·명도는 0~100 범위로 제한합니다. 잘못된 값은 앱 시작 시 정확한 JSON 경로를 포함한 오류로 거부됩니다.

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
- `enabled`: `false`이면 현재 저장 레벨은 읽되 다음 단계 구매를 만들지 않음
- `visible`: `false`이면 강화 화면 목록에서 숨김
- `countsTowardCookieEvolution`: `true`인 행의 현재 레벨만 쿠키 진화 레벨 합계에 포함
- `renderBaseSizePixels`, `renderMaximumSizePixels`: 비율 값을 실제 메인 화면 크기로 바꾸는 기준·상한
- `levels[].level`: 단계 번호
- `levels[].value`: 해당 단계의 실제 능력치
- `levels[].cost`: 그 단계로 올라갈 때 소모할 쿠키. 첫 단계는 기본 보유이므로 0

`cookie-upgrade-rules.json`에 ID가 있는 클릭 힘(`clickPower`), 쿠키 크리티컬(`cookieCritical`), 자동 생산(`autoProduction`), 쿠키 성 체력(`cookieHealth`)은 명시 레벨 뒤에도 무한히 강화됩니다.

- `valueIncreasePerLevel`: 이후 한 레벨마다 증가하는 능력치
- `costGrowthMultiplier`: 이후 강화 비용 증가 배율

클릭 힘(`clickPower`), 쿠키 크리티컬(`cookieCritical`), 자동 생산(`autoProduction`), 쿠키 성 체력(`cookieHealth`)은 `countsTowardCookieEvolution: true`이고 쿠키 크기(`cookieSize`)는 `false`입니다. 네 활성 강화가 모두 Lv.1인 새 게임의 진화 기여 합계는 4입니다. 쿠키 크기 행은 `enabled: false`, `visible: false`인 호환·렌더 기준용 데이터로만 남으며 강화 화면에서 숨기고 새로 구매할 수 없습니다. v7 이하 저장의 쿠키 크기 진행분은 저장 이전 단계에서 `Lv - 1`만큼 `legacyCookieEvolutionBonusLevels`로 한 번 옮긴 뒤, 진화 selector는 `cookieSize`를 읽지 않습니다. 메인 화면 쿠키 이미지는 저장 레벨과 무관하게 이 행의 `levels[].value` 최고 비율을 `renderBaseSizePixels`에 적용하고 `renderMaximumSizePixels`로 제한한 크기로 고정합니다.

업그레이드 화면은 `visible`인 항목만 대상으로 현재 쿠키 잔액으로 바로 살 수 있는 항목을 첫 그룹, 다음 단계는 있지만 쿠키가 부족한 항목을 두 번째 그룹, `next`가 없는 강화 완료 항목을 마지막 그룹에 둡니다. 잔액이나 레벨이 바뀔 때 selector가 다시 정렬하며 같은 그룹 안에서는 이 JSON 배열 순서를 그대로 유지합니다.

### `cookie-critical.json`

- `upgradeId`: `cookie-upgrades.json`에서 확률 진행을 읽을 강화 ID. 현재 `cookieCritical`
- `probabilityScale`: 정수 난수와 확률 값을 대응시키는 전체 단위. 현재 10,000
- `maximumChanceUnits`: 실제 발동 확률 상한. 현재 5,000으로 정확히 50%
- `baseRewardMultiplier`: Lv.1 크리티컬 획득 배수. 현재 10배
- `rewardMultiplierIncreasePerLevel`: Lv.1 이후 한 단계마다 더할 획득 배수. 현재 +1배
- `displayMaximumFractionDigits`: 한국어 UI에서 확률을 표시할 최대 소수 자릿수
- `effectDurationMs`, `effectSizePixels`, `flash*`, `core*`, `ring*`, `particle*`: 붉은 화면 플래시·폭발 중심·확장 링·방사 파편의 시간·크기·색상

`cookie-upgrades.json`의 `levels[].value`와 무한 강화 규칙의 `valueIncreasePerLevel`은 확률 단위로 해석합니다. Lv.1 값 100은 1%, 이후 한 단계당 25는 0.25%p입니다. 계산된 확률 값은 50%에서 제한하지만 강화 단계와 배수는 제한하지 않습니다. 따라서 Lv.1은 1%·10배, Lv.2는 1.25%·11배이며 확률 상한에 도달한 뒤에도 레벨마다 배수가 계속 증가합니다. 클릭마다 0~1 난수 한 번을 정수 단위로 변환해 판정하고, 발동하면 최종 클릭 힘에 해당 배수를 곱합니다. 극단 단계의 결과는 공통 안전 정수 포화 정책을 따릅니다.

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

`progression.json`의 `winsToUnlockNextDifficulty`가 다음 단계 해금에 필요한 승리 수입니다. 현재 값은 20입니다. 1~20번 전투는 각각 처음 클리어할 때마다 `giantDiscRewardPerFirstClear` 수량만큼 거대 원반을 지급하며 현재 값은 1개입니다. 같은 승리에서 `battle-rewards.json`의 전투 훈장도 지급합니다. 전투 승리로 쿠키를 직접 지급하지 않습니다. 완료한 전투를 재도전할 때는 난이도 진행 단계가 더 오르지 않으므로 거대 원반과 전투 훈장을 모두 다시 지급하지 않습니다. 이 진행도 검사를 먼저 하므로 `rewardClaimedStageIds`의 키가 손상되어 누락된 완료 저장도 재승리 보상을 만들지 않습니다. 20승 뒤 재도전은 20번 전투로 처리됩니다.

현재 모든 난이도의 `enemyCount`는 1입니다. 스테이지 성장 테이블도 적 추가량을 0으로 유지하므로 1~20번째 전투 모두 보스 한 마리만 등장합니다.

### 단일 보스 자동 밸런스

`boss-balance.json`은 다수 적 전투 시절부터 성장한 쿠키봇 저장 데이터가 단일 보스를 한 발에 쓰러뜨리지 않도록 최소 HP만 보정합니다.

- `playerPowerBaseSurvivalSeconds`: 자동 공격 DPS 기준 easy 초반의 최소 목표 생존 시간
- `hpMultiplierReference`: 난이도 HP 배율을 생존 시간으로 환산하는 기준점
- `hpScalingExponent`: 난이도·스테이지 HP 배율이 목표 생존 시간에 반영되는 곡선
- `maximumPowerScaledSurvivalSeconds`: 매우 높은 난이도에서도 자동 보정이 넘지 않는 시간 상한
- `minimumAutomaticHitsToDefeat`: 가장 강한 쿠키봇 자동 원반을 최소 몇 번 맞아야 하는지 정하는 즉사 방지 하한

엔진은 먼저 `몬스터 기본 HP × 실효 난이도 HP 배율`을 계산합니다. 그다음 현재 장착 원반과 종류별 쿠키봇 수·피해 배율·발사 간격으로 자동 공격 DPS를 계산합니다. 테이블 기본 HP, `자동 DPS × 목표 생존 시간`, `가장 강한 자동 한 발 × 최소 명중 수` 가운데 가장 큰 값이 최종 보스 HP입니다. 초반처럼 전력이 낮으면 기존 HP가 우선되고, 과도하게 성장해 한 발 처치가 가능한 저장에서만 자동 하한이 크게 작동합니다. 쿠키 성 수동 공격과 소모품 거대 원반은 이 자동 DPS 보정에 포함하지 않습니다.

`enemy-waves.json`에는 난이도와 같은 순서의 15개 보스 결투 행이 있습니다. 각 난이도의 `enemyWaveId`가 고유 웨이브를 가리키고, 웨이브의 `monsterPatternIds`와 `bossMonsterId`는 같은 고유 보스 ID를 사용합니다. `bossEveryEnemies=1`과 `enemyCount=1`이므로 전투에는 해당 보스 한 마리만 생성됩니다. 15종 보스의 기준 HP·공격·속도·원반·크기 값은 동일하고 이름·이미지·설명만 달라, 외형 추가가 현재 난이도 밸런스를 바꾸지 않습니다. `monsters.json`의 추가 필드는 다음과 같습니다.

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

`battle-maps.json`은 easy부터 extreme god까지 15개 난이도와 일대일로 연결된 행을 정의합니다. `difficultyId`는 `difficulties.json`의 실제 ID이고 `imageKey`는 React Native 정적 번들 요구사항 때문에 `BattleMapImage.ts`의 `require` 매핑과 함께 추가해야 합니다. 초원·과수원·설원·침수 정글·폭풍 절벽·악마계·신계 전장은 색만 바꾼 변형이 아니라 지형과 상단 랜드마크가 서로 다른 독립 원본입니다. 같은 난이도의 1~20번째 전투는 진행 일관성을 위해 같은 테마를 유지합니다.

## 쿠키 진화

`cookies.json` 배열 순서가 진화 순서입니다. 현재 30종은 클래식 초코칩 → 행운 → 도넛 → 와플 → 컵케이크 → 딸기 케이크 → 달빛 → 파티 → 별빛 쌀쿠키 → 로열 초콜릿 → 별사탕 → 무지개 롤리팝 → 황금 푸딩 → 별빛 쇼트케이크 → 삼색 경단 → 은하수 빙수 → 황금 꿀단지 → 마법 파이 → 다이아몬드 → 천상 왕관 → 오로라 보석 → 심해 진주 → 태양 불꽃 → 달빛 여왕 → 시간 태엽 → 차원 균열 → 용왕 비늘 → 은하 성운 → 창세 수정 → 무한 우주입니다.

- `imageKey`: `CookieImage`가 정적으로 포함한 쿠키 이미지 키
- `requiredTotalUpgradeLevels`: 진화 기여 강화의 현재 레벨 합계와 `legacyCookieEvolutionBonusLevels`를 더한 값의 진화 조건
- `clickMultiplier`: 클릭당 획득량 배율
- `autoProductionMultiplier`: 자동 생산량 배율
- `healthMultiplier`: 전투의 쿠키 성 최대 HP 배율

현재 30종의 요구 조건은 3, 9, 15, …, 177로 6레벨 간격입니다. 진화 기여 강화는 클릭 힘·쿠키 크리티컬·자동 생산·쿠키 성 체력 4종이며 새 게임의 기본 합계는 4입니다. 조건을 만족한 가장 높은 쿠키가 자동 활성화됩니다. 별도 구매나 수동 장착은 없고 능력 배율은 누적하지 않으며 현재 쿠키 행 하나만 적용합니다. 새 쿠키를 추가할 때 요구 총레벨과 배율은 앞 단계보다 크게 설정하고 `CookieImage`의 이미지 키 매핑도 함께 추가합니다.

신규 10종은 클릭·자동 생산·쿠키 성 체력에 같은 행의 공통 배율을 적용합니다.

| 순서 | 쿠키 | `imageKey` | 필요 진화 레벨 | 공통 배율 |
|---:|---|---|---:|---:|
| 21 | 오로라 보석 쿠키 | `aurora-gem` | 123 | ×3.99 |
| 22 | 심해 진주 쿠키 | `deepsea-pearl` | 129 | ×4.36 |
| 23 | 태양 불꽃 쿠키 | `solar-flare` | 135 | ×4.77 |
| 24 | 달빛 여왕 쿠키 | `lunar-empress` | 141 | ×5.22 |
| 25 | 시간 태엽 쿠키 | `clockwork` | 147 | ×5.72 |
| 26 | 차원 균열 쿠키 | `dimension-rift` | 153 | ×6.28 |
| 27 | 용왕 비늘 쿠키 | `dragon-scale` | 159 | ×6.90 |
| 28 | 은하 성운 쿠키 | `nebula` | 165 | ×7.59 |
| 29 | 창세 수정 쿠키 | `genesis-crystal` | 171 | ×8.36 |
| 30 | 무한 우주 쿠키 | `infinite-cosmos` | 177 | ×9.22 |

## 전투 규칙

`battle-rules.json`의 좌표는 대부분 화면 비율(0~1)입니다. `*Ms`는 밀리초입니다.

- 프레임·속도: `tickMs`, `maxDeltaMs`, `battleSpeedMultipliers`, `defaultBattleSpeedMultiplier`. 현재 허용 속도는 X1·X2·X3이고 기본값은 X1
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

속도 배수는 화면 애니메이션에만 적용하지 않습니다. 엔진은 `tickMs` 주기의 한 타이머 콜백에서 측정하고 `maxDeltaMs`로 제한한 경과 시간의 순수 전투 단계를 선택 배수만큼 순차 실행하며 각 단계의 시각도 함께 증가시킵니다. 따라서 X2·X3에서는 이동, 발사 쿨타임, 충돌, 피해와 승패가 실제로 2배·3배 진행됩니다. 서브스텝 도중 전투가 끝나면 남은 단계는 실행하지 않습니다.

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

### `bot-animation.json`

- `patrolCycleMs`, `patrolPhaseOffsetMs`: 종류별 시간차를 둔 순찰 한 주기
- `patrolHorizontalRadius`, `patrolForwardDistance`: 편성 슬롯에서 실제로 움직이는 좌우·전진 거리
- `targetFollowRatio`: 보스 방향으로 제한적으로 이동하는 비율
- `projectileReleaseOffsetX`, `projectileReleaseOffsetY`: 봇 중심 좌표에서 투척 손 높이까지 더할 정규화 좌표. 현재 Y는 -0.04
- `runFrameSequence`: 순찰 진행률에서 사용할 3개 달리기 프레임 인덱스 순서. 현재 `0, 1, 2, 1`
- `throwWindupMs`, `throwReleaseHoldMs`, `throwRecoveryMs`: 다음 발사 전 준비, 원반을 놓은 프레임 유지, 복귀 시간
- `sets[].id`: `bots.json`의 봇 ID
- `sets[].runImageKeys`: 봇별 달리기 3프레임
- `sets[].throwWindupImageKey`, `throwReleaseImageKey`, `throwRecoveryImageKey`: 투척 3단계 프레임

현재 5종 봇은 각각 6프레임, 합계 30개 투명 WebP를 사용합니다. 표시 좌표와 원반 발사 좌표는 같은 순찰 계산을 사용하고 발사점에는 위 offset을 더해 원반이 봇 중심이 아니라 손 높이에서 시작합니다. 공격 시각에는 프레임의 기준 시각을 고정해 투척 자세와 원반 시작점이 어긋나지 않게 합니다. 설정 검증은 모든 봇 ID에 애니메이션 세트가 정확히 하나 있고 프레임 인덱스가 실제 배열 범위 안인지 확인합니다.

### `boss-animation.json`

- `walkDistancePerCycle`: 보스가 이 거리만큼 이동할 때 걷기 한 주기를 완료
- `walkFrameSequence`: 3개 걷기 프레임의 선택 순서. 현재 `0, 1, 2, 1`
- `impactHoldMs`, `recoveryMs`: `special` 충돌 프레임 유지 시간과 복귀 프레임 시간
- `impactEffectDurationMs`: 망치 충돌 지면 효과의 표시 수명
- `sets[].id`: `monsters.json`의 난이도별 보스 ID
- `sets[].walkImageKeys`: 보스별 실제 걷기 3프레임
- `sets[].hammerWindupImageKey`, `hammerImpactImageKey`, `hammerRecoveryImageKey`: 망치 준비·충돌·복귀 3프레임

현재 15종 보스는 각각 6프레임, 합계 90개 투명 WebP를 사용합니다. 이동 중에는 시작 위치부터 누적한 거리로 걷기 프레임을 고르며, `boss-special-attack.json`의 예고 구간과 실제 `special` 공격 시각에만 망치 3프레임으로 전환합니다. 일반 원거리 공격과 근접 공격에는 강한 망치 준비·충돌·복귀를 재생하지 않습니다. 설정 검증은 모든 보스 ID에 애니메이션 세트가 있고 모든 이미지 키가 고유하며 시퀀스가 실제 걷기 프레임 범위를 벗어나지 않는지 확인합니다.

### `boss-special-attack.json`

- `intervalMs`: 공격 사거리 진입 또는 직전 강공격부터 다음 원거리 공격을 강공격으로 우선 발사할 주기. 현재 5초
- `windupMs`: 다음 `special` 원거리 공격 전에 망치 준비 프레임을 보여 줄 시간. 현재 900ms
- `impact*`: 내려찍는 지점의 타원 충격파, 지면 균열 SVG 경로, 크기·선·색·발광
- `dust*`: 충돌 좌우로 퍼지는 먼지 입자의 좌표·반경·색
- `screenFlash*`: 강공격 순간 전장 전체의 짧은 플래시
- `screenShake*`: 내려찍은 뒤 짧게 감쇠하는 전장 흔들림
- `projectile*`: 강공격으로 표시된 기존 적 원반의 확대·색·궤적·발광

보스 기본·걷기·공격 프레임에는 망치가 항상 포함됩니다. `specialAttackCycleStartedAt`은 보스가 공격 사거리에 진입할 때 시작하고 다음 주기의 기준으로만 사용하며, `lastSpecialAttackAt`은 실제 강공격 실행 시각과 애니메이션 기준으로 분리합니다. 다음 강공격까지 남은 시간이 `적 원반 예상 비행시간 + windupMs` 안이면 원거리 채널을 예약해 일반탄을 새로 발사하지 않으므로 준비 동작과 일반탄 비행이 겹치지 않습니다. 주기가 끝난 `special`은 일반 공격 쿨다운을 무시하고 원거리 공격 한 발을 우선 발사하므로 강공격 주기가 일반탄 때문에 밀리지 않습니다. 피해 배율은 별도로 추가하지 않고 `enemy-discs.json`과 `boss-behavior.json`의 일반 공식을 그대로 사용합니다. 실제 몸 자세와 프레임 유지 시간은 `boss-animation.json`에 있고 이 파일에는 제거된 `transform` 계열 값이나 `animationDurationMs`가 없습니다.

### `giant-disc.json`

- `damageMultiplier`: 현재 최강 쿠키봇이 날리는 일반 원반 피해에 곱하는 값. 현재 정확히 30배. 봇이 없으면 장착 원반 기본 피해가 기준
- `speedMultiplier`: 일반 원반 속도에 곱하는 거대 원반 비행 속도 배율
- `attackRadius`: 거대 원반을 사용할 수 있는 보스 탐색 반경
- `renderWidthRatio`: 휴대폰 화면 너비 대비 표시 크기. 현재 0.34로 화면 약 1/3
- `effectPulseDurationMs`, `effectPulseScale`: 발사 중 오라가 맥동하는 주기와 크기
- `effectRingBorderWidth`, `effect*Color`: 두 겹 원형 오라, 발광, 안내 문구 색상
- `launchNoticeMs`: `거대 원반!` 전투 안내 표시 시간
- `button*Color`: 보유량·30배 수치를 표시하는 전투 버튼 색상

거대 원반은 전투에서만 사용할 수 있는 소모형 무기입니다. 엔진이 최신 전투 상태에서 유효한 발사 후보를 만든 뒤 저장 수량 소비를 승인받은 경우에만 후보를 커밋하고 `giantDiscCount`를 1 감소시킵니다. 보유량이 없거나 살아 있는 보스가 없으면 발사와 소모가 모두 일어나지 않으며, 빠른 연속 입력도 projected 수량에서 직렬화합니다. 장착 원반·봇 종류·보유 수량이 성장하면 현재 최강 쿠키봇의 일반 한 발과 거대 원반이 함께 성장합니다. 최종 피해가 실제 발사체에 저장되어 충돌 시 보스 HP에서 차감됩니다.

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

`battle-rewards.json`:

- `battleMedalsPerStageClear`: 아직 완료하지 않은 다음 스테이지를 이겼을 때 지급할 전투 훈장 개수. 현재 1개
- `clickPowerBonusPercentPerMedal`: 훈장 1개당 클릭 힘 증가율. 현재 1%
- `autoProductionBonusPercentPerMedal`: 훈장 1개당 자동 생산 증가율. 현재 1%
- `castleHealthBonusPercentPerMedal`: 훈장 1개당 쿠키 성 최대 체력 증가율. 현재 1%

훈장 보너스는 `1 + (보유 훈장 × 능력별 퍼센트) / 100` 배율입니다. 강화 능력과 현재 쿠키 진화 배율을 먼저 계산한 최종 값에 적용하며, 훈장 자체는 진화 레벨에 포함하지 않습니다. 자동 생산에도 같은 최종 배율이 적용되므로 실행 중 생산과 재실행 시 오프라인 정산이 동일한 훈장 효과를 사용합니다. 모든 값은 앱 시작 시 1 이상의 안전 정수인지 검증합니다.

`progression.json`:

- `winsToUnlockNextDifficulty`: 다음 난이도 해금 승수
- `giantDiscRewardPerFirstClear`: 전투 번호별 최초 클리어에 지급할 거대 원반 개수
- `saveDebounceMs`: 상태 변화 후 저장을 합쳐 처리하는 시간
- `autoProductionIntervalMs`: 자동 쿠키 생산 적용 주기

자동 생산은 이 주기의 완료 횟수에 현재 `개/초` 능력치를 곱합니다. 저장 시 `lastSavedAt`을 기록하고 재실행·백그라운드 복귀 시 같은 계산을 사용하므로 타이머가 멈춘 시간도 누적됩니다. 이전 저장처럼 시각이 없거나 기기 시계가 뒤로 간 경우에는 지급하지 않으며 임의의 최대 오프라인 기간은 두지 않습니다.

`audio-settings.json`:

- `defaultLevel`: 최초 효과음 단계
- `previewDelayMs`: 설정 버튼을 누른 뒤 새 볼륨으로 미리듣는 지연
- `soundVolumeMultipliers`: 일반 클릭·크리티컬·메뉴·강화·사용 불가 효과음의 상대 음량. 크리티컬은 `critical`
- `levels[].level`, `volume`: UI 단계와 오디오 엔진 볼륨(0~1)의 대응

`levels`는 정확히 1, 2, 3, 4, 5 순서여야 하고 `volume`은 단계가 오를 때마다 반드시 커야 합니다. 누락·역순·같거나 낮아지는 음량은 설정 검증에서 거부합니다. 크리티컬 플레이어는 `assets/audio/cookie-critical-explosion.wav`의 Mixkit `Short explosion`을 사용하고 일반 클릭음과 독립적으로 처음부터 재생합니다.

`battle-audio.json`:

- `minimumIntervalMs`: 아군·적·거대 원반, 약·강 피격, 보스 근접·분노 그룹별 최소 재생 간격
- `volumeMultipliers`: 5단계 전역 음량에 곱하는 액션별 상대 음량. 오케스트라 배경 음악은 효과음을 가리지 않도록 현재 0.28

## 메뉴와 저장 호환 테이블

`src/navigation/navigation.json`:

- `mainMenus[]`: 게임·전투·강화·정보 대분류의 순서, 라벨, 아이콘, 기본 화면
- `mainMenus[].leafIds`: 대분류에 속한 실제 화면. 강화는 쿠키·원반·쿠키봇 강화, 정보는 쿠키 도감·난이도·몬스터
- `leaves[]`: 화면별 한국어 라벨, 제목, 아이콘과 선택적 NEW 배지 키

모든 대분류와 기존 8개 화면은 정확히 한 번씩 정의되어야 하며 한 화면을 두 대분류가 공유할 수 없습니다. 게임·전투처럼 자식이 하나인 대분류는 소메뉴를 렌더하지 않습니다.

`save-migrations.json`:

- `currentSaveVersion`: 새 저장에 기록하고 이전 저장을 정규화할 현재 스키마 버전
- `cookieEvolutionBonusMigrationVersion`: 이전 쿠키 크기 진행도를 영구 진화 보너스로 한 번 옮기는 스키마 경계
- `battleMedalMigrationVersion`: 이전 난이도 진행도를 전투 훈장으로 한 번 소급하는 스키마 경계
- `battleMedalsPerLegacyWin`: 이전 저장의 정규화된 승리 1회당 소급 지급할 전투 훈장 수
- `cookieEvolutionLegacyUpgrade.id`, `baseLevel`, `maximumLevel`: v7 저장에서 읽을 고정 레거시 강화 ID와 유효 레벨 범위
- `botIdAliases`, `discIdAliases`, `monsterIdAliases`: 제거·변경된 ID를 현재 테이블 ID로 옮기는 대응표

현재 `currentSaveVersion`은 10입니다. v7 이하 저장은 고정 레거시 ID `cookieSize`의 정규화된 현재 레벨에서 기본 레벨 1을 뺀 값을 `legacyCookieEvolutionBonusLevels`에 한 번 기록합니다. 1~6 범위의 소수 레벨은 기존 저장 정책대로 내림하고, 범위 밖이거나 유한하지 않은 값은 기본 레벨로 복구해 보너스를 만들지 않습니다. 이 규칙은 현재 강화 테이블과 분리되어 향후 숨김 행을 제거하거나 다른 강화의 진화 기여도를 바꿔도 v7 직행 업데이트 결과가 변하지 않습니다. 새 저장과 해당 필드가 없던 v8 이상 저장은 0을 사용하고, v8 이상에서는 쿠키 크기를 다시 읽어 보너스를 만들지 않습니다.

v8 이하 저장은 각 난이도의 `difficultyWinCounts`를 먼저 `0..winsToUnlockNextDifficulty`로 정규화한 뒤 합산하고 `battleMedalsPerLegacyWin`을 곱해 `battleMedals`를 만듭니다. 현재 값은 완료 승리 1회당 훈장 1개이므로 과거에 보상 없이 진행한 모든 완료 스테이지가 정확히 소급됩니다. v9 이상 저장은 저장된 `battleMedals`를 정규화해 사용하고 승리 수에서 다시 계산하지 않으므로 재실행해도 중복 지급되지 않습니다. 새 게임은 0개에서 시작합니다.

v10 상태는 `battleSpeedMultiplier`를 영구 저장합니다. 값은 `battle-rules.json`의 `battleSpeedMultipliers`에 포함된 X1·X2·X3만 허용하며 누락·비유한 값·목록 밖 값은 `defaultBattleSpeedMultiplier`인 X1로 복구합니다. 쿠키 크리티컬 단계는 기존 `upgradeLevels` 레코드의 `cookieCritical` 키에 저장하고, 이전 저장에 키가 없으면 `cookie-upgrades.json`의 기본 Lv.1을 사용합니다.

`currentSaveVersion`은 양의 정수여야 하며 별칭 대상은 실제 현재 데이터에 존재해야 합니다.

앱은 양의 안전 정수인 `saveVersion`만 스키마 ID로 인정합니다. 그 값이 `currentSaveVersion`보다 높을 때만 구버전 다운그레이드로 판단해 원본 저장을 덮어쓰지 않습니다. 소수·비안전 정수·`NaN`·`Infinity`는 손상 저장으로 정규화해 현재 버전으로 복구하고 다시 저장할 수 있습니다. 새 스키마를 배포할 때는 버전 숫자만 올리지 말고 이전 버전에서 새 버전으로 올리는 정규화 규칙과 회귀 테스트를 함께 추가합니다.

## 안전하게 테이블을 변경하는 절차

1. JSON의 기존 ID는 저장 호환성을 위해 바꾸지 않습니다.
2. 새 항목에는 중복되지 않는 ID를 사용합니다.
3. 새 쿠키 강화에는 `countsTowardCookieEvolution`을 명시하고 진화에 포함할지 의도적으로 결정합니다.
4. 난이도의 `enemyWaveId`, 웨이브의 몬스터 ID처럼 다른 테이블을 참조하는 값이 실제로 존재하는지 확인합니다.
5. 레벨은 오름차순으로 연속되게 추가합니다.
6. `npm run verify`를 실행합니다.
7. Android 릴리스 APK를 빌드해 실제 기기에서 구매, 저장 복구, 전투를 확인합니다.

새 필드가 필요할 때는 JSON만 임의로 추가하지 말고 `src/types`의 해당 영역 계약, 공개 재수출이 필요하면 `src/types/game.ts` 파사드, `src/config/index.ts`, 관련 selector/engine, 테스트, 이 문서를 함께 갱신합니다.

기존 ID를 꼭 바꿔야 한다면 `save-migrations.json`에 이전 ID와 새 ID의 대응을 먼저 추가합니다. 현재 10종 시절 제거된 원반 5종의 소유·레벨과 쿠키봇 5종의 수량은 대응되는 현재 5종에 합산 복구됩니다. 이전 `cookie-bot` 수량과 이전 3종 몬스터 ID도 각각 현재 ID로 이전됩니다.
