# 쿠키전쟁 아키텍처

## 화면과 책임

`App.tsx`는 게임·전투·강화·정보 4개 대분류와 실제 화면 leaf를 조정합니다. 대분류를 누르면 세션 ref에 기억한 마지막 leaf 또는 데이터의 기본 leaf로 한 번에 이동하고, 소메뉴는 leaf를 직접 엽니다. 쿠키 클릭은 `GameScreen`, 전투 개체는 `BattleScreen`에만 존재하므로 두 플레이 방식이 섞이지 않습니다. `DiscScreen`과 `BotScreen`도 독립되어 원반과 쿠키봇 상점이 한 화면에 섞이지 않습니다.

`src/navigation/navigation.json`이 대분류 순서, 소분류 소속, 한국어 라벨, 아이콘, 화면 제목, 기본 leaf와 몬스터 NEW 배지 출처를 관리합니다. `navigation/model.ts`는 중복 ID, 누락 화면, 잘못된 부모·기본 leaf 참조를 시작 시 검증하고 기본/기억 화면 선택과 배지 상향을 순수 함수로 제공합니다. `ScreenLayout`은 공통 상단 정보와 설정, 자식이 둘 이상일 때만 나타나는 `SubmenuNav`, 4개 대분류 `BottomNav`를 조합합니다. 게임·전투에는 소메뉴 네이티브 뷰 자체가 생기지 않아 콘텐츠 영역을 유지합니다.

`GameScreen`은 통계 행과 전투 이동 버튼 사이의 중앙 영역 전체를 하나의 쿠키 획득 `Pressable`로 사용합니다. `useImmediateCookiePress`는 터치 시작에 즉시 보상을 주고 같은 터치의 후속 `onPress`만 제거하며, 접근성 서비스처럼 `onPress`만 보내는 입력은 그대로 처리합니다. hit slop·이동 허용 범위·중복 제거 시간은 `cookie-input.json`에서 읽습니다. 일반 획득 텍스트는 `screens/game/CookieGainFeedback`, 종류별로 독립한 크리티컬·슈퍼·조각 획득 연출은 `CookieSpecialFeedback`, 5초 조각 수명과 중복 수령 방지는 `useCookieFragmentCollection`로 분리했습니다. 다른 종류는 최대 4종이 겹쳐지고 같은 종류만 새 ID로 교체되며, 전체 슈퍼 크리티컬일 때만 별도 native-driver 값으로 쿠키 무대를 짧게 흔듭니다. 조각 `Pressable`은 메인 쿠키와 형제인 투명 오버레이에 있으므로 획득 터치가 기본 클릭으로 전파되지 않습니다.

의존 방향은 아래와 같습니다.

```text
화면·컴포넌트
    ↓ 조회/명령
GameContext          navigation/model ← navigation.json
    ↓ 상태 변경
gameReducer ← domain/gameSelectors ← config/*.json
    ↓ 저장                    ↓ 전투 설정
services/storage          engine/useBattleEngine
```

화면은 가격이나 보상을 액션 인자로 전달하지 않습니다. 예를 들어 `BUY_BOT`은 `botId`만 받고, 리듀서가 현재 저장 상태와 `bots.json`을 이용해 실제 가격을 다시 계산합니다. 따라서 UI 조작이나 잘못된 호출로 테이블과 다른 가격을 적용할 수 없습니다.

### 전투 화면 컴포넌트

`BattleScreen`은 전투 레이어를 조합하는 화면 조정자입니다. 게임 상태·효과음·보상 수명주기는 `screens/battle/useBattleScreenSession`, 화면 절전 방지는 `useBattleKeepAwake`, 피격·강공격 표시 계산은 `battlePresentation`, 성·거대 원반 입력은 `BattleActionControls`, HUD·준비 화면·결과 모달은 각각 독립 컴포넌트가 담당합니다. `useBattleKeepAwake`는 상태가 `active`일 때만 태그 기반 Wake Lock을 획득하고 idle·victory·defeat 전환 또는 화면 unmount에서 즉시 해제합니다. 전투 개체의 세부 표현은 `src/components/battle` 아래로 분리했습니다.

- `BattleHealthBar`: 체력 비율·색상과 게이지
- `BattleImpactEffect`: 피격 파편·충격파·피해 숫자
- `BattleProjectiles`: 아군·적군·거대 원반 발사체
- `BattleBotFormation`: 실제 전투 좌표를 순찰하는 쿠키봇 편성과 투척 프레임
- `BattleEnemyLayer`: 보스 좌표·이름·체력·그림자와 공격 상태
- `BossAnimationSprite`, `BotAnimationSprite`: 정적 `require`로 포함한 투명 WebP 프레임 표시
- `BattleUnits`: 봇·보스 레이어의 얇은 공개 파사드

표현 컴포넌트는 전투 상태를 props로 받아 그릴 뿐 HP·쿨타임·피해량을 직접 변경하지 않습니다. 새 시각 연출은 판정 엔진과 분리해 해당 표현 컴포넌트에 추가합니다.

## 데이터 기반 확장

게임 밸런스는 `src/config`의 JSON 파일에 있습니다.

- `difficulties.json`: 한 마리 보스의 HP·공격 배율, 이동 속도, 적 원반 레벨
- `enemy-discs.json`: 난이도별 적 원반 능력치
- `discs.json`: 능력 격차가 큰 5종 원반 구매·초기 레벨 데이터
- `disc-upgrade-rules.json`: 초기 레벨 이후 무한 강화 성장식과 최소 쿨타임
- `cookie-upgrades.json`: 클릭 힘·일반/슈퍼 크리티컬·자동 생산·쿠키 성 체력과 비활성 호환용 쿠키 크기 레벨 및 진화 기여 여부
- `cookie-upgrade-rules.json`: 표시되는 일곱 활성 강화의 명시 레벨 이후 무한 성장
- `cookie-critical.json`: 크리티컬 확률 단위·50% 상한·기본 10배·레벨당 배수
- `cookie-super-critical.json`: 슈퍼 크리티컬 확률 단위·10% 상한·기본 100배·레벨당 배수
- `cookie-fragments.json`: 두 쿠키 조각의 강화 연결·기본/레벨당 확률과 배수·5초 수명·등장/획득/음향 연출
- `cookie-pity.json`: 4종 희귀 보상의 연속 실패 천장 활성화와 동시 확정 우선순위
- `cookie-feedback.json`: 쿠키 클릭 보이스 변주·중첩 제한, 획득 텍스트와 일반/슈퍼 전체·축약 연출
- `cookie-input.json`: 쿠키 터치 hit slop·이동 허용 범위·중복 제거 시간
- `battle-auto.json`: 자동 전투 기본값과 최초·다음 전투 시작 지연
- `monsters.json`, `bots.json`: 추가 가능한 전투 개체 정의와 난이도별 보스 30종
- `enemy-waves.json`: 각 난이도와 고유 보스를 연결하는 전투 구성
- `cookies.json`: 80종 쿠키의 진화 총레벨, 이미지 키, 능력 배율
- `cookie-expansion.json`: 30종 확장의 시작 진화 레벨·간격·쿠키별 공통 배율
- `giant-disc.json`: 거대 원반의 30배 피해, 비행 속도, 화면 비율 크기와 이펙트
- `battle-rewards.json`: 스테이지 진행 승리당 전투 훈장 수와 훈장당 클릭·자동 생산·성 체력 보너스율
- `progression.json`: 난이도 해금 승수, 최초 클리어 거대 원반 수, 저장·자동 생산 주기
- `battle-stage-rules.json`: 같은 난이도 안에서 승리마다 적용할 전투 강화식
- `difficulty-expansion.json`: 기존 캠페인과 같은 수의 Blood Moon 난이도, 등급 경계 +20% 성장식과 이동·원반 상하한
- `battle-maps.json`: 난이도 ID와 지형·건축이 다른 고유 전투 테마의 일대일 연결
- `boss-balance.json`: 고성장 자동 공격 DPS에 따른 단일 보스 HP 하한과 즉사 방지
- `boss-behavior.json`: 보스 전역 공격력·공격 간격·이동 배율과 HP 분노 페이즈
- `boss-special-attack.json`: 주기 보스 망치 강공격의 예고·지면 충격·발사체·플래시 연출
- `boss-animation.json`: 30종 보스의 걷기 3프레임·망치 강공격 3프레임과 전환 시간
- `bot-animation.json`: 5종 쿠키봇의 달리기 3프레임·투척 3프레임, 순찰·표적 추종 값
- `battle-rules.json`: 좌표, 충돌 거리, 공격·AI 타이밍과 X1·X2·X3 전투 속도 등 전투 규칙
- `battle-ui.json`: 개체 렌더 크기, 상단 보스 HP, 체력 게이지 색상·외곽선
- `battle-feedback.json`: 공격 예고·돌진, 피격 흔들림, 다중 충격·전장 충격파·피해 숫자
- `battle-audio.json`: 전투 액션음 그룹별 중복 재생 제한과 상대 음량
- `audio-settings.json`: 5단계 실제 음량, 기본 단계, 미리듣기 지연
- `save-migrations.json`: 현재 저장 스키마 버전과 이전 콘텐츠 ID·쿠키 진화·전투 훈장 진행도를 현재 상태로 옮기는 호환 규칙

게임 결과에 영향을 주는 가격, 능력치, 진행 조건, 시간, 거리와 확률은 JSON에 둡니다. React Native의 글자 크기·여백·모서리 반경처럼 화면 표현만을 위한 값은 각 컴포넌트의 `StyleSheet`에 둡니다. `src/config/index.ts`가 JSON을 TypeScript 계약으로 노출하고 빠른 ID 조회 함수를 제공합니다.

생성 원본을 런타임 에셋으로 바꾸는 과정도 반복 가능한 스크립트로 분리했습니다. `scripts/process_animation_atlases.py`는 3×2 크로마키 atlas를 보스 또는 봇의 정해진 6개 프레임으로 자르고 soft matte·despill, 알파·모서리 검증, 384×384 lossless WebP 변환을 수행합니다. `scripts/process_cookie_assets.py`와 `process_cookie_atlas.py`는 크로마키 원본 또는 2×2 atlas를 검증한 뒤 512×512 투명 WebP로 변환하며, atlas 피사체에는 테이블화한 중앙 여백을 만들어 경계 접촉을 막습니다. `process_external_cookie_vfx.py`는 CC0 폭발 4×4 atlas를 16개 투명 WebP로 자르고 CC0 번개 11종의 검은 배경을 알파로 바꿔 세로형 WebP로 변환합니다. 피사체가 사라지거나 쿠키 모서리 배경이 불투명하면 변환이 실패합니다.

`domain/gameSelectors.ts`는 기존 import를 보존하는 얇은 공개 파사드입니다. 실제 순수 계산은 `domain/selectors`에서 업그레이드, 원반, 쿠키봇, 쿠키 진화, 전투 진행, 전투 훈장, 초기값 팩토리로 분리됩니다. 현재/다음 강화, 수량별 가격, 구매 가능 여부, 실효 난이도, 훈장 보너스와 최종 쿠키 능력치를 각 책임에서 한 번만 계산합니다. 업그레이드 목록은 `visible`인 항목만 대상으로 `구매 가능 → 쿠키 부족 → 강화 완료` 우선순위를 매번 계산하고, 같은 그룹에서는 다음 비용 오름차순과 원본 순서로 안정 정렬합니다. `enabled: false`인 행은 현재 레벨을 복원하지만 다음 구매를 만들지 않습니다.

`types/game.ts`도 기존 import를 보존하는 얇은 타입 파사드입니다. 실제 계약은 오디오, 전투 표현, 전투 규칙, 전투 콘텐츠, 성장·상점, 저장 상태, 내비게이션, 시스템 설정 모듈로 나뉩니다. 하위 타입 모듈은 파사드를 역참조하지 않고 저장 상태가 음량 타입만 읽는 한 방향 의존을 유지합니다. 새 설정 필드를 추가할 때는 해당 영역 타입만 변경하고 파사드에서 공개 여부를 결정합니다.

쿠키 진화 종류는 별도로 저장하지 않고 `countsTowardCookieEvolution: true`인 업그레이드의 현재 레벨 합계에 저장된 `legacyCookieEvolutionBonusLevels`를 더해 매번 계산합니다. 강화 화면에 보이는 7종 전체가 기여해 새 게임의 기본 합계가 7이며, 이미 저장된 슈퍼·두 조각 단계도 같은 selector가 읽으므로 별도 마이그레이션 없이 즉시 소급됩니다. 숨김 `cookieSize`만 `false`입니다. `cookies.json`에서 요구 총레벨 이하인 가장 높은 쿠키가 자동 활성화되며 해당 행의 클릭·자동 생산·쿠키 성 체력 배율이 최종 능력치에 적용됩니다. 메인 화면은 같은 selector가 계산한 현재 진화 레벨·다음 쿠키의 필요 레벨·남은 강화 수를 큰 숫자로 표시하고 구간 진행률도 함께 보여 줍니다. 쿠키 이미지는 `cookieSize`의 최고 비율과 JSON의 기준·상한 픽셀 값으로 계산한 기존 최대 크기에 고정합니다.

쿠키 도감은 `FlatList`로 가상화해 80종의 고해상도 이미지를 한꺼번에 마운트하지 않습니다. `assetRegistry.test.ts`는 쿠키·전장·보스·봇·외부 VFX의 모든 이미지 키를 각 정적 `require` 레지스트리와 대조합니다. `validateCookies`는 세 공통 배율의 동일성과 진화 순서에 따른 단조 증가를, `validateCookieExpansion`은 51~80단계의 시작 레벨·12레벨 간격·단계당 ×1.10 반올림을 강제합니다. 쿠키 런타임 이미지는 APK 용량을 억제하도록 투명 WebP를 정적 번들합니다.

쿠키 클릭 계산은 `domain/cookieClick.ts`가 담당합니다. `cookieCritical.ts`와 `cookieSuperCritical.ts`가 테이블·저장 레벨에서 확률·배수를 계산하고, `cookiePity.ts`가 표시 확률의 역수를 최대 시도 횟수로 바꿠어 4종 실패 횟수를 O(1)로 진전시킵니다. 네 희귀 보상은 공통 200,000단위 정수 눈금을 사용합니다. 첫 난수는 슈퍼·일반 크리티컬의 배타 구간, 두 난수는 마그마·전기 조각의 배타 구간을 판정한 뒤 천장을 적용합니다. 자연 슈퍼를 일반으로 낮추지 않고, 여러 천장이 겹치면 테이블 우선순위로 희귀한 결과를 먼저 보장합니다. `calculateCookieClickTransition`은 보상과 다음 실패 횟수를 한 객체로 반환하고 `CLICK_COOKIE`가 둘을 한 리듀서 전이로 커밋해 저장 불일치를 막습니다. 화면·효과음은 판별값과 계산된 보상만 소비합니다.

조각 발견과 보상은 `domain/cookieFragments.ts`가 담당합니다. 두 번째 독립 난수를 마그마·전기 순서의 겹치지 않는 정수 구간으로 나눠 클릭 보상 판정과 확률적으로 결합되지 않게 합니다. 클릭 명령은 조각 종류만 반환하고 즉시 보상을 주지 않습니다. UI가 같은 활성 ID를 5초 안에 정확히 한 번 눌렀을 때만 `claimCookieFragment` 명령이 현재 클릭 힘과 테이블 배수를 계산해 `GAIN_COOKIES`를 보내므로, 만료·중복 탭·교체된 조각은 저장 통화를 바꾸지 않습니다.

조각 획득 연출은 게임 판정과 분리됩니다. 마그마는 CC0 16프레임 폭발을 화산 분화구 위에서 한 번 재생하고, 전기는 CC0 번개 11종 중 7종을 서로 다른 위치와 시차로 표시합니다. 화면 비율·프레임 간격·번개 수·위치·수명은 `cookie-fragments.json`에 있고 사운드 테이블은 변경하지 않았습니다.

`battleRewardSelectors.ts`는 저장된 `battleMedals`를 안전 정수로 정규화하고 `battle-rewards.json`의 능력별 퍼센트를 곱해 세 영구 배율을 만듭니다. `cookieSelectors.ts`는 강화 값과 현재 쿠키 진화 배율을 먼저 계산한 뒤 이 배율을 클릭 힘·자동 생산·쿠키 성 체력에 각각 마지막으로 적용합니다. 훈장 수는 진화 합계에 들어가지 않아 전투 보상과 쿠키 종류 해금 규칙이 서로 결합되지 않습니다.

## 상태와 저장

`GameContext`는 영구 상태와 의미 있는 사용자 명령을 제공하는 Provider 조정자입니다. `useGameCommands`와 `useAutoProduction`은 하나의 projected dispatcher를 공유해 React 렌더 전 연속 입력도 최신 상태에서 직렬화합니다. `gameReducer`는 액션 전이와 가격 검증만 담당하고, 초기 상태는 `gameInitialState`, 저장 정규화·이전·오프라인 복구는 `gameSave`로 분리했습니다. 쿠키 진화 v8 이전, 전투 훈장 v9 소급, 저장 버전 판정은 `state/saveMigrations`의 독립 모듈이 각각 처리합니다. AsyncStorage 입출력은 `services/storage.ts`가 담당하며 저장 지연 시간과 생산 주기도 `progression.json`에서 읽습니다.

저장할 때마다 `lastSavedAt`을 함께 기록합니다. 다음 실행에서는 저장 데이터를 먼저 이전·정규화하고, `domain/offlineProduction.ts`가 저장 당시 자동 생산 능력과 `lastSavedAt → 현재 시각`의 완료 생산 주기를 계산합니다. 현재 쿠키와 누적 쿠키에 같은 양을 더하고 소비한 체크포인트를 즉시 AsyncStorage에 기록한 다음 화면을 엽니다. 따라서 로딩 직후 앱이 다시 종료되어도 같은 시간이 중복 지급되지 않습니다. 기기 시계가 뒤로 간 경우에는 0개를 지급하고 더 최신 체크포인트를 유지합니다. 실행 중 타이머도 실제 경과 시간을 기준으로 누락된 주기를 따라잡으며 Android가 백그라운드로 갈 때 즉시 저장합니다.

전투 승리 시 `completeBattleTransition`이 난이도 진행 단계와 `rewardClaimedStageIds`의 `난이도ID:전투번호` 키를 함께 확인합니다. 새 스테이지로 진행되는 승리는 `battle-rewards.json`에 따라 전투 훈장 1개를 `battleMedals`에 더하고, 진행 단계가 오르면서 해당 키도 없을 때 거대 원반 1개를 지급합니다. 난이도 진행도를 보상 판정의 우선 기준으로 삼으므로 이미 20승을 완료한 전투는 보상 키가 손상되어 누락됐더라도 재승리 보상이 0입니다. 20번째 최초 승리에서는 `highestUnlockedDifficultyIndex`와 `selectedDifficultyId`를 같은 순수 전이에서 다음 난이도로 올립니다. 결과 모달이 다시 렌더된 뒤 `다음 전투`는 새 선택값의 승리 수 0을 읽어 1번째 전투를 시작하며, 다음 난이도가 없는 `blood moon extreme god`만 현재 선택을 유지합니다. 전투 승리는 현재 쿠키나 누적 쿠키를 직접 변경하지 않습니다. `difficultyWinCounts`는 난이도별 진행 단계, `clearedDifficultyIds`는 최소 한 번 승리한 기록, `highestUnlockedDifficultyIndex`는 순차 해금에 사용합니다. 재도전, 보상, 해금이 서로 독립된 상태입니다.

저장 버전은 `save-migrations.json`의 `currentSaveVersion`에서 읽습니다. v7 이하 저장은 테이블에 고정한 레거시 ID `cookieSize`의 유효 레벨에서 기본 Lv.1을 뺀 값을 `legacyCookieEvolutionBonusLevels`로 한 번만 이전하고 v8 규칙을 거칩니다. 현재 강화 목록을 순회하지 않으므로 향후 `cookieSize` 행을 제거해도 v7 직행 업데이트가 달라지지 않습니다. v11의 슈퍼 크리티컬과 v12의 마그마·전기 조각 강화는 누락 시 Lv.1로 정규화합니다. v13은 네 실패 횟수 `cookiePityMisses`를 추가하며 이전 저장은 0, 손상 값은 음이 아닌 안전 정수로 복구합니다. v14는 기존 15개 난이도를 모두 완료한 v13 이하 저장을 과거 난이도 선택 위치와 무관하게 최초 Blood Moon 난이도로 한 번 연결합니다. 화면에 보이는 7종 단계는 진화 합계에 그대로 들어가 기존 강화가 자동 소급되며, 새 게임의 진화 기본 합계는 7이고 쿠키 크기만 기여 플래그가 `false`입니다.

v10 상태에는 X1·X2·X3 중 선택한 `battleSpeedMultiplier`를 저장합니다. 이전 저장처럼 값이 없거나 허용 목록 밖·비유한 값이면 `battle-rules.json`의 기본 X1로 복구합니다. 쿠키 크리티컬은 기존 `upgradeLevels` 맵을 그대로 사용하므로 이전 저장에 키가 없으면 `cookie-upgrades.json`의 Lv.1로 초기화되고 이후 강화 단계가 일반 강화와 같은 경로로 저장됩니다.

v8 이하 저장은 정규화된 `difficultyWinCounts`를 모두 합산하고 `battleMedalsPerLegacyWin`을 곱해 v9의 `battleMedals`를 한 번 계산합니다. 따라서 이미 보상 없이 완료한 모든 스테이지가 현재 난이도 진행도 그대로 소급되며, v9 이상에서는 저장된 훈장 수만 읽어 재실행 시 중복 가산하지 않습니다. 손상된 음수·소수·무한 값과 과도한 합계는 공통 안전 정수·포화 정책으로 복구합니다.

`giantDiscCount`는 이전 저장에 없으면 0으로 초기화하고 이후 획득·사용량을 영구 저장합니다. 이전 버전의 난이도 단위 보상 기록은 해당 난이도의 1번 전투 보상 키로 이전하므로 이미 보상을 받은 전투에서 거대 원반이 중복 지급되지 않습니다. 이전 단일 `discOwned`와 `discLevel`은 첫 번째 원반의 소유 여부와 레벨로 이전합니다. 10종 시절 제거된 원반의 소유·선택·레벨은 대응되는 현재 원반에 합치며 둘 다 레벨이 있으면 더 높은 값을 보존합니다. 제거된 쿠키봇 수량도 대응되는 현재 봇 수량에 더합니다. 이전 몬스터 ID도 새 다등급 몬스터 ID로 바꾸고 존재하지 않는 몬스터 ID는 제거합니다. 기존 `clearedDifficultyIds`는 해당 난이도 1승으로 이전하며, 새 20승 규칙에 맞춰 실제 해금 인덱스를 다시 계산합니다. 존재하지 않거나 잠긴 난이도가 선택되어 있으면 가장 높은 사용 가능 난이도로 안전하게 복구합니다.

현재 앱보다 높은 양의 안전 정수 `saveVersion`만 다운그레이드 상황으로 간주합니다. 알려진 필드만 메모리에서 정규화해 실행하되 오프라인 생산을 정산하거나 AsyncStorage에 다시 저장하지 않는 읽기 전용 호환 모드로 두어, 최신 앱이 만든 원본 저장을 구버전이 덮어쓰지 않습니다. 소수나 비안전 정수처럼 손상된 버전 값은 미래 저장으로 오인하지 않고 현재 v14의 저장 가능한 상태로 복구합니다.

## 전투 엔진

`useBattleEngine`은 UI와 독립된 순수 함수 `advanceBattle`로 전투를 진행합니다. 다중 경로, 행렬 간격과 순차 출현 로직은 제거했습니다. 보스 한 마리를 `enemyX` 중앙 좌표에 생성하고 `enemyStartY`에서 `enemyStopY`까지 직선으로 이동시킵니다. 모든 활성 봇의 반경 제한 자동 발사, 다중 아군 원반 충돌, 보스 원반, 쿠키 성 피해와 승패를 계산합니다.

`engine/battleSpeed.ts`는 저장된 전투 속도를 `battle-rules.json`의 X1·X2·X3 허용 목록으로 정규화합니다. 50ms 주기의 타이머가 실제 경과 시간을 `maxDeltaMs`로 제한한 뒤, 한 콜백에서 선택 배수만큼 같은 경과 시간으로 `advanceBattle`을 순차 호출하고 각 호출의 `now`도 한 단계씩 전진시킵니다. 따라서 속도 버튼은 CSS 애니메이션 배속이 아니라 이동·쿨타임·발사·충돌·피해·승패 전체를 실제 시뮬레이션 서브스텝으로 가속합니다. 중간 서브스텝에서 승패가 나면 남은 단계를 실행하지 않습니다.

모든 난이도는 서로 다른 `enemyWaveId`를 참조하고 각 웨이브는 고유 보스 ID 한 개를 가리키며 `enemyCount`는 1로 유지합니다. 30종 보스는 외형·이름·도감 설명만 다르고 기준 전투 능력치는 동일합니다. 난이도와 스테이지 selector가 HP·공격력·이동 속도·원반 레벨 공식을 적용하므로 에셋 교체가 밸런스를 바꾸지 않습니다. 기존 15개는 easy 기준 스테이지 증가량을 각 난이도 기준값에 더합니다. 뒤의 Blood Moon 15개는 `difficulty-expansion.json`에 따라 각각 직전 난이도 20번째의 HP·공격력보다 정확히 20% 높은 값에서 시작하고 적 원반 피해도 난이도마다 20% 증가합니다. 이동·원반 크기·속도·쿨타임은 테이블 상한·하한을 적용합니다.

단일 보스의 최종 HP는 `calculateBossHealth`가 계산합니다. 테이블 기본 HP를 최소값으로 유지하면서 장착 원반과 활성 쿠키봇의 수량·피해 배율·발사 간격으로 자동 DPS를 구하고, `boss-balance.json`의 목표 생존 시간 및 최소 자동 명중 수를 하한으로 적용합니다. 성장 전력이 낮은 구간은 기존 난이도 체력을 그대로 쓰고, 과거 저장처럼 봇이 수십 대씩 있는 경우에만 보정 HP가 우선됩니다. 수동 성 원반과 소모형 거대 원반은 자동 전력 계산에서 제외해 사용자 조작 보상을 유지합니다.

플레이어 원반은 매 프레임 목표의 현재 Y 좌표를 향해 이동하며, `playerProjectileMinimumFlightMs`보다 일찍 도착하지 않도록 남은 비행시간에 맞춰 이동량을 제한합니다. 따라서 빠른 상위 원반도 최소 비행시간 전에 적을 통과하지 않고, 성 앞에서 멈췄거나 이동 중인 목표에 도달하면 정상적으로 충돌합니다.

쿠키봇은 장착 원반을 각 봇의 테이블 공격 간격마다 자동 발사하되 `botAttackRadius` 안에 적이 있을 때만 발사합니다. `domain/botCombatMotion.ts`는 편성 슬롯을 기준으로 종류별 위상 차를 둔 좌우 순찰·전진과 보스 방향의 제한된 추종 위치를 계산합니다. `bot-animation.json`의 달리기 3프레임과 투척 준비·놓기·복귀 3프레임을 공격 시각에 맞춰 선택하며, 원반은 투척 순간의 실제 표시 좌표에 `projectileReleaseOffsetX/Y`를 더한 손 높이에서 시작합니다. 이전 원반이 비행 중이어도 공격 간격이 끝나면 다음 원반을 즉시 발사하며, 여러 봇 종류는 각각 독립적으로 움직입니다. 봇 원반은 `botDiscSizeMultiplier`로 성 원반보다 작게 계산합니다.

자동 전투 OFF에서는 사용자가 전투장 어디든 눌렀을 때만 쿠키 성이 별도 원반을 발사합니다. ON에서는 `useBattleScreenSession`이 같은 엔진 명령을 쿨타임마다 호출합니다. 결과 모달·거대 원반 버튼·하단 메뉴 같은 독립 UI는 전투장 입력과 분리하고, 거대 원반 버튼은 비활성 상태에서도 탭 전파를 막습니다.

수동 탭과 자동 effect 모두 장착 원반 레벨의 재사용 대기시간이 지났고 `castleAttackRadius` 안에 적이 있을 때만 한 발을 추가합니다. 판정과 발사체 생성은 엔진에 한 번만 존재하며 이전 쿠키 성 원반이 화면에 남아 있어도 쿨타임이 끝나면 다음 원반을 발사할 수 있습니다.

타이머와 수동 발사 명령은 `useBattleEngine`의 최신 상태 ref에서 순서대로 전이됩니다. 수동 발사 순수 함수가 전투 상태·쿨타임·사거리를 다시 확인하고 시각+증가 순번 ID를 발급하므로 리렌더 전의 빠른 연속 탭도 같은 쿨타임을 두 번 통과하지 않습니다. 이벤트 콜백은 마지막 전달 이벤트를 기억해 콜백 참조 변경만으로 같은 효과음을 다시 내지 않습니다.

성 원반 피해는 `battle-rules.json`의 `castleDiscDamageMultiplier`를 곱하며 현재 값은 장착 원반 기본 피해의 정확히 2배입니다. 자동 전투 설정은 발사 명령의 호출 시점만 바꾸고 피해·사거리·쿨타임을 바꾸지 않습니다. 전투의 쿠키 성은 프로젝트 전용으로 생성한 3D 쿠키 왕국 성에 현재 진화 쿠키 문양을 합성하는 별도 `CookieCastle` 컴포넌트입니다.

거대 원반은 일반 원반과 별개의 저장형 소모 무기입니다. `BattleScreen`은 엔진의 `throwGiantDisc` 한 명령만 호출합니다. 엔진은 최신 전투 상태에서 살아 있는 대상을 확인해 발사 후보를 먼저 만들고, 그때만 `GameContext.consumeGiantDisc`에 저장 수량 소비를 요청합니다. Context는 렌더 전 projected 상태를 즉시 갱신해 같은 재고를 연속 입력이 다시 쓸 수 없게 하고, 소비가 승인된 후보만 엔진 상태에 커밋합니다. 따라서 발사 실패 시 수량만 줄거나 재고 없이 발사되지 않습니다. 엔진은 현재 쿠키봇별 `장착 원반 피해 × 봇 피해 배율 × 보유 수`의 최댓값을 구한 뒤 `giant-disc.json`의 30배를 곱해 `source: giant` 발사체에 저장합니다. 명중은 일반 발사체와 같은 충돌 경로를 통과하므로 계산된 전체 피해가 보스 HP에 실제 반영됩니다. 화면은 테이블의 너비 비율과 색상으로 화면 약 1/3 크기의 회전 원반·두 겹 맥동 오라를 그립니다.

엔진은 같은 프레임에 발생한 모든 사건을 단조 증가 ID와 함께 `pendingEvents` 전달 저널에 순서대로 보존합니다. hook이 콜백에 정확히 한 번 전달한 ID까지만 acknowledge하며, 화면용 `events`는 최근 32개로 제한합니다. UI는 이력에서 승패 알림을 제외한 최신 `presentationEvent` 하나만 그리므로 같은 틱의 효과음은 빠지지 않으면서 피격 View 수는 제한됩니다. 각 이벤트에는 `kind`, `at`, `x`, `y`, `amount`, `attackKind`, `attackSource`가 있으며 판정 로직은 연출 컴포넌트를 모르고 UI도 HP를 직접 변경하지 않습니다.

보스의 `specialAttackCycleStartedAt`은 공격 사거리 진입 시 시작하고 `boss-special-attack.json`의 5초 주기 기준점으로만 사용합니다. `lastSpecialAttackAt`은 실제 강공격 실행 시각으로 분리해 애니메이션과 충격 이펙트의 기준이 됩니다. selector는 다음 강공격까지 남은 시간이 `적 원반 예상 비행시간 + 900ms windup` 안으로 들어오면 원거리 공격 채널을 예약해 새 일반탄 발사를 막습니다. 주기가 끝나면 일반 공격 쿨다운과 무관하게 원거리 공격 한 발을 `special`로 우선 발사하고 다음 주기 기준점을 갱신합니다. 별도 피해 배율은 더하지 않습니다. 난이도별 30종 보스는 각각 걷기 3프레임과 망치 준비·충돌·복귀 3프레임을 가져 총 180개 투명 WebP를 사용합니다. `domain/bossAnimation.ts`는 이동 거리, 강공격 예고, 실제 `lastSpecialAttackAt`으로 프레임을 선택하고 `BossHammerSmashEffect`는 충돌 시점부터 타원 충격파·지면 균열·먼지 입자를 짧게 그립니다. 일반 원거리·근접 공격은 강한 망치 프레임을 재생하지 않으며 `special` 강공격에만 준비·충돌·복귀가 나타납니다. 화면 흔들림·플래시와 특수 적 원반은 `boss-special-attack.json`, 프레임 키와 걷기·충돌·복귀 시간은 `boss-animation.json`을 읽습니다.

보스 공격 피해, 공격 간격, 이동 속도는 `boss-behavior.json`에서 마지막으로 보정합니다. 현재 기본 피해 배율 2, 쿨타임 배율 0.5, 이동 배율 0.8이므로 원거리·근접 기본 공격력은 2배, 공격 속도는 2배, 이동 속도는 20% 감소됩니다. 전체 난이도 배율 1.2는 최종 HP와 피해에 추가 적용됩니다. 보스는 `enemyAttackRadius`에 들어오면 근접 범위 전부터 적 전용 원반을 발사하고, 근접 범위에서는 별도 쿨타임으로 직접 타격합니다. HP 50% 하향 교차 시 `enraged` 상태를 단 한 번 활성화하고 이후 원반·근접 피해와 공격 간격에 분노 배율을 추가 적용합니다.

`BattleScreen`은 `getBattleMapForDifficulty`로 선택 난이도의 고유 배경을 조회합니다. `BattleMapImage.ts`는 JSON 이미지 키를 정적 `require`에 연결하므로 APK 번들에 30개 JPG 전장이 포함됩니다. 이미지는 단순 재색칠이 아니라 기존 초원·과수원·설원·악마계·신계와 신규 수정 광산·심해 도시·마법 도서관·연금 온실·거울 미궁·역중력 도시·다중우주 균열 등 지형과 랜드마크 자체가 다른 독립 테마입니다. 중앙 70%는 낮은 디테일로 비워 유닛과 원반을 분리하고 하단은 동적 쿠키 성을 위한 지면으로 유지합니다. HUD에는 난이도·전투 번호·남은 보스와 화면 폭 88%의 상단 보스 HP 바를 표시합니다. 보스 최대 렌더 크기는 `battle-ui.json`의 112이고 성과 봇은 아래쪽 좁은 슬롯에 배치합니다. 아군 원반은 파랑·금색, 보스 원반은 빨강·검붉은색입니다.

`useCookieAudioFeedback`은 Freesound CC0 `Crunch` MP3의 3보이스 풀과 연속 클릭 제한만 소유합니다. `useCookieSpecialAudioFeedback`은 일반 크리티컬 2개, 슈퍼 2개, 마그마 2개, 전기 3개의 로컬 Mixkit 플레이어를 종류별 그룹으로 관리합니다. 같은 종류가 다시 발동하면 해당 그룹의 플레이어·예약 타이머·비동기 요청 세대만 취소하고 처음부터 재생하며, 다른 종류는 서로 끊지 않아 시각 정책과 동일하게 최대 네 종류가 합성됩니다. 마그마는 180ms 간격 2회, 전기 천둥은 최대 상대 음량 1.0의 220ms 간격 3회로 테이블에 정의합니다. 시각 수명과 음향 레이어 강도는 낮은 확률일수록 오르도록 교차 테이블로 검증합니다. 화면 전환·사운드 OFF·Provider 해제는 모든 그룹과 예약 타이머를 취소합니다. `FeedbackContext`는 메뉴·전투 사운드와 진동을 조정하고, 전투 종료 시 재생 세대 번호를 올려 모든 액션음의 재시작을 막습니다.

`CookieCriticalEffect`는 하나의 native-driver 진행값으로 교차 참격광, 꺾이는 번개 균열과 회전하는 각진 쿠키 파편을 합성합니다. 원형 코어·확장 링은 렌더하지 않습니다. 전체 이펙트가 과도하게 겹치지 않도록 전체·축약 동시 개수와 획득 텍스트 개수를 테이블에서 제한합니다.

`CookieSuperCriticalEffect`는 별도 native-driver 진행값으로 각진 섬광, 수직 낙뢰 기둥, X자·수평의 주 참격과 청록·자홍 잔상, 10갈래 번개, 다색 파편 폭발을 합성합니다. 두 효과가 함께 쓰는 `AngularImpactPrimitives`가 참격·번개·파편의 생성 규칙만 담당하고, 일반·슈퍼 컴포넌트는 각 테이블을 조합하는 역할만 맡습니다. 모두 React Native View와 `LinearGradient`로 렌더해 래스터 이펙트 에셋이나 JS 프레임별 상태 갱신을 추가하지 않습니다.

`useBattleScreenSession`은 저장된 `autoBattleEnabled`를 읽어 idle 상태의 최초 시작, active 상태의 성 쿨타임별 자동 발사, 승리 보상 확정 뒤 다음 전투 시작을 각각 독립 effect로 조정합니다. 패배와 최종 난이도 마지막 전투는 자동 전환 조건에서 제외합니다. 사용자가 HUD나 결과 모달에서 설정을 끄면 각 effect의 cleanup이 예약 진행을 취소합니다. 실제 발사 가능 여부와 피해는 수동 입력과 같은 엔진 명령을 사용하므로 자동 모드가 전투 판정을 우회하지 않습니다.

전투 화면은 50ms 타이머 주기마다 실제 경과 델타를 제한하고, 같은 종류의 다수 봇을 한 개체·한 발의 합산 피해로 처리합니다. 봇 편성, 성, 보스·봇 애니메이션 프레임, 원반·쿠키 이미지는 메모이제이션하고 프레임은 정적 `require`로 번들에서 조회합니다. 순간 피격 연출은 한 이벤트당 짧은 수명의 제한된 View만 만들며 강한 공격에만 넓은 충격파를 사용합니다. 세부 점검 기준은 `PERFORMANCE.md`에 기록합니다.

`useBattleEngine`은 타이머·속도 서브스텝·명령·이벤트 전달만 조정합니다. `advanceBattle`은 적 이동, 아군 충돌, 봇 발사, 보스 공격, 승패 판정의 순수 단계들을 순서대로 합성하고 UI는 같은 `selectEnemyCombatTiming`으로 공격 예고를 계산합니다. 다수 적을 다시 도입하기 전에는 동일 기기 프로파일링과 개체 수 상한을 먼저 정합니다.

원반은 `discs.json`의 명시 레벨 이후에도 `disc-upgrade-rules.json`의 증가량으로 계속 계산됩니다. 쿨타임만 안전한 최소값에서 멈추고 공격력·크기·속도·비용에는 코드상 최대 레벨이 없습니다. 화면 밖을 덮지 않도록 실제 렌더링 크기만 전투 테이블 값으로 제한하며 전투 능력치와 저장 레벨은 계속 증가합니다.

## 검증 경계

- `__tests__/config.test.ts`: 게임 설정의 타입·참조·의미 검증, 30개 난이도·맵·보스와 Blood Moon 경계 성장식, 보스·봇 애니메이션 프레임 참조, 80종 쿠키, 크리티컬 보상·피드백과 전투 속도 무결성
- `__tests__/battleKeepAwake.test.ts`: active 전투만 절전 방지를 켜고 준비·승패 상태에서는 끄는 정책
- `__tests__/gameReducer.test.ts`: 스테이지별 거대 원반·전투 훈장 최초 보상과 재도전 차단, v9 소급·중복 방지, v10 저장 정규화, X1·X2·X3 순환·복구, 일곱 활성 강화의 무한 성장과 비용 우선 정렬
- `__tests__/cookieClick.test.ts`: 두 기본 크리티컬 경계, 슈퍼 강화당 +0.025%p와 기존 Lv.20의 0.575% 소급, 확률 상한·무제한 배수 성장
- `__tests__/cookieFeedback.test.ts`: 전체·축약 크리티컬 경계, 직전 클릭 보이스 반복 방지와 최소 클릭 간격
- `__tests__/battleEngine.test.ts`: 단일 보스 전투, 실제 속도 서브스텝, 공격 반경·중첩 발사·수동 성 공격, 거대 원반 피해, 이벤트 저널과 극단 수치 포화
- `__tests__/bossAnimation.test.ts`: 30종 보스의 걷기 프레임과 `special` 강공격에만 적용되는 준비·충돌·복귀 전환
- `__tests__/botCombatMotion.test.ts`: 5종 봇의 순찰·표적 추종 좌표와 달리기·투척 프레임 전환
- `__tests__/navigation.test.ts`: 4대 메뉴, 강화·정보 소메뉴 소속, 마지막 화면 기억, NEW 배지 상향과 잘못된 메뉴 테이블 거부
- `__tests__/numericSafety.test.ts`: 강화·구매·보상·자동 생산·전투 파생값의 `MAX_SAFE_INTEGER` 경계
- `__tests__/battleAudio.test.ts`: 전투 액션음 최소 재생 간격
- `__tests__/offlineProduction.test.ts`: 종료 시간 정산, 중복 방지, 시계 역행, 백그라운드 따라잡기, 무제한 기간
- `__tests__/storage.test.ts`: AsyncStorage 저장·복구와 미래 저장 읽기 전용 보호
- `npm run verify`: TypeScript, Jest, Expo 프로젝트 진단을 연속 실행

## 다음 확장 지점

- 몬스터: `MonsterConfig`에 행동 타입과 스프라이트 키 추가
- 쿠키봇: `bots.json`에 공격 타입과 상태 효과 추가
- 무기: 원반과 같은 레벨 테이블을 가진 새 무기 설정 추가
- 쿠키: `cookies.json`에 해금 조건과 능력 보정 추가
- 저장 이전: 다음 상태 형식 변경 시 `saveVersion`을 올리고 `mergeSavedGame`에 이전 규칙 추가
- 타입 계약: `src/types`의 해당 영역 모듈을 수정하고 외부 공개가 필요할 때만 `types/game.ts` 파사드에 재수출 추가
