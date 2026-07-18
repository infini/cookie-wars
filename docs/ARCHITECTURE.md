# 쿠키전쟁 아키텍처

## 화면과 책임

`App.tsx`는 8개 하단 메뉴의 현재 화면만 선택합니다. 쿠키 클릭은 `GameScreen`, 전투 개체는 `BattleScreen`에만 존재하므로 두 플레이 방식이 섞이지 않습니다. `DiscScreen`과 `BotScreen`도 독립되어 원반과 쿠키봇 상점이 한 화면에 섞이지 않습니다. 공통 상단 정보, 설정, 하단 메뉴는 `ScreenLayout`이 담당합니다.

의존 방향은 아래와 같습니다.

```text
화면·컴포넌트
    ↓ 조회/명령
GameContext
    ↓ 상태 변경
gameReducer ← domain/gameSelectors ← config/*.json
    ↓ 저장                    ↓ 전투 설정
services/storage          engine/useBattleEngine
```

화면은 가격이나 보상을 액션 인자로 전달하지 않습니다. 예를 들어 `BUY_BOT`은 `botId`만 받고, 리듀서가 현재 저장 상태와 `bots.json`을 이용해 실제 가격을 다시 계산합니다. 따라서 UI 조작이나 잘못된 호출로 테이블과 다른 가격을 적용할 수 없습니다.

## 데이터 기반 확장

게임 밸런스는 `src/config`의 JSON 파일에 있습니다.

- `difficulties.json`: 적 수, HP·공격 배율, 이동 속도, 적 원반 레벨, 최초 보상
- `enemy-discs.json`: 난이도별 적 원반 능력치
- `discs.json`: 10종 원반 구매·초기 레벨 데이터
- `disc-upgrade-rules.json`: 초기 레벨 이후 무한 강화 성장식과 최소 쿨타임
- `cookie-upgrades.json`: 클릭, 크기, 자동 생산, 쿠키 성 체력
- `cookie-upgrade-rules.json`: 클릭 힘·자동 생산·쿠키 성 체력의 명시 레벨 이후 무한 성장
- `monsters.json`, `bots.json`: 추가 가능한 전투 개체 정의
- `cookies.json`: 10종 쿠키의 진화 총레벨, 이미지 키, 능력 배율
- `progression.json`: 난이도 해금 승수, 저장·자동 생산 주기
- `battle-stage-rules.json`: 같은 난이도 안에서 승리마다 적용할 전투 강화식
- `battle-rules.json`: 좌표, 충돌 거리, 공격·AI 타이밍 등 전투 규칙
- `audio-settings.json`: 5단계 실제 음량, 기본 단계, 미리듣기 지연
- `save-migrations.json`: 이전 콘텐츠 ID를 현재 ID로 옮기는 저장 호환 규칙

게임 결과에 영향을 주는 가격, 능력치, 진행 조건, 시간, 거리와 확률은 JSON에 둡니다. React Native의 글자 크기·여백·모서리 반경처럼 화면 표현만을 위한 값은 각 컴포넌트의 `StyleSheet`에 둡니다. `src/config/index.ts`가 JSON을 TypeScript 계약으로 노출하고 빠른 ID 조회 함수를 제공합니다.

`domain/gameSelectors.ts`는 화면과 리듀서가 함께 쓰는 순수 계산 계층입니다. 현재/다음 업그레이드, 봇의 수량별 가격, 구매 가능 여부, 활성 봇 목록, 난이도 승리 진행률, 현재 전투 단계의 실효 난이도, 최종 쿠키 능력치를 여기에서 한 번만 계산합니다.

쿠키 진화 상태는 별도로 저장하지 않고 모든 쿠키 업그레이드의 현재 레벨 합계로 매번 계산합니다. `cookies.json`에서 요구 총레벨 이하인 가장 높은 쿠키가 자동 활성화되며 해당 행의 클릭·자동 생산·쿠키 성 체력 배율이 최종 능력치에 적용됩니다. 파생 상태라서 저장 불일치나 임의 해금 상태가 생기지 않습니다.

## 상태와 저장

`GameContext`는 영구 상태와 의미 있는 사용자 명령을 제공하고, `gameReducer`가 모든 상태 변경 규칙과 가격 검증을 처리합니다. AsyncStorage 저장은 `services/storage.ts`로 분리되어 있습니다. 저장 지연 시간도 `progression.json`에서 읽습니다.

전투 승리 시 `rewardClaimedDifficultyIds`를 확인하여 난이도마다 첫 승리일 때만 보상을 지급합니다. `difficultyWinCounts`는 난이도별 누적 승리, `clearedDifficultyIds`는 최소 한 번 승리한 기록, `highestUnlockedDifficultyIndex`는 순차 해금에 사용합니다. 재도전, 보상, 해금이 서로 독립된 상태입니다.

저장 버전은 3입니다. 이전 버전의 단일 `discOwned`와 `discLevel`은 첫 번째 원반의 소유 여부와 레벨로 이전합니다. 이전 단일 봇 ID는 `save-migrations.json`의 별칭으로 첫 쿠키봇에 수량을 합산합니다. 기존 `clearedDifficultyIds`는 해당 난이도 1승으로 이전하며, 새 20승 규칙에 맞춰 실제 해금 인덱스를 다시 계산합니다. 존재하지 않거나 잠긴 난이도가 선택되어 있으면 가장 높은 사용 가능 난이도로 안전하게 복구합니다.

## 전투 엔진

`useBattleEngine`은 UI와 독립된 순수 함수 `advanceBattle`로 전투를 진행합니다. 적의 균등 슬롯 순차 출현과 이동, 모든 활성 봇의 원반 자동 발사, 다중 원반 충돌, 적 원반, 쿠키 성 피해, 승패 판정을 한 단계씩 계산합니다. 난이도가 높아질 때뿐 아니라 같은 난이도에서 승리 수가 오를 때도 selector가 `battle-stage-rules.json`을 적용해 적 수, HP·공격력·이동 속도와 적 원반 레벨을 높입니다. 아직 출현 시간이 되지 않은 적은 이동·표적·공격 대상에서 제외되며, 적 회피 로직은 존재하지 않습니다.

난이도는 `monsterId`로 몬스터를 참조하고, 전투 엔진은 구매 수량이 1개 이상인 모든 봇을 배열로 받습니다. 특정 몬스터나 쿠키봇을 전역 상수로 고정하지 않으므로 새 종류를 추가해도 엔진 호출 구조를 바꿀 필요가 없습니다.

쿠키봇은 장착 원반을 각 봇의 테이블 공격 간격마다 자동 발사합니다. 이전 원반이 비행 중이어도 공격 간격이 끝나면 다음 원반을 즉시 발사하며, 여러 봇 종류는 각각 독립적으로 움직입니다.

쿠키 성은 스스로 공격하지 않습니다. 전투 중 사용자가 성을 눌렀을 때만 다음 두 조건으로 별도 원반을 발사합니다.

유일한 조건은 장착 원반 레벨의 재사용 대기시간이 지난 것입니다. 이전 쿠키 성 원반이 화면에 남아 있어도 쿨타임이 끝나면 다음 원반을 발사합니다.

성 원반 피해는 `battle-rules.json`의 `castleDiscDamageMultiplier`를 곱하며 현재 값은 봇 원반의 정확히 2배입니다. 모드 ON/OFF 상태와 수동 모드 전환은 존재하지 않습니다. 전투의 쿠키 성은 Kenney 성 그래픽에 현재 진화 쿠키 문양을 합성하는 별도 `CookieCastle` 컴포넌트이며, 단순 쿠키 버튼과 역할·외형을 공유하지 않습니다.

원반은 `discs.json`의 명시 레벨 이후에도 `disc-upgrade-rules.json`의 증가량으로 계속 계산됩니다. 쿨타임만 안전한 최소값에서 멈추고 공격력·크기·속도·비용에는 코드상 최대 레벨이 없습니다. 화면 밖을 덮지 않도록 실제 렌더링 크기만 전투 테이블 값으로 제한하며 전투 능력치와 저장 레벨은 계속 증가합니다.

## 검증 경계

- `__tests__/config.test.ts`: 15개 난이도, 같은 난이도의 단계 성장, 10종 원반·10종 봇의 능력 격차, 참조 무결성, 5단계 음량
- `__tests__/gameReducer.test.ts`: 최초 보상 1회, 정확한 20승 해금, 테이블 기반 구매, 100레벨 이후 강화
- `__tests__/battleEngine.test.ts`: 적의 균등 순차 출현, 모든 난이도의 원반 명중, 중첩 발사, 봇 자동 발사, 성의 자동 공격 금지, 성 원반 2배 피해
- `npm run verify`: TypeScript, Jest, Expo 프로젝트 진단을 연속 실행

## 다음 확장 지점

- 몬스터: `MonsterConfig`에 행동 타입과 스프라이트 키 추가
- 쿠키봇: `bots.json`에 공격 타입과 상태 효과 추가
- 무기: 원반과 같은 레벨 테이블을 가진 새 무기 설정 추가
- 쿠키: `cookies.json`에 해금 조건과 능력 보정 추가
- 저장 이전: 다음 상태 형식 변경 시 `saveVersion`을 올리고 `mergeSavedGame`에 이전 규칙 추가
