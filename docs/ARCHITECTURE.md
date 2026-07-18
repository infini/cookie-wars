# 쿠키전쟁 구조

## 화면과 책임

`App.tsx`는 7개 하단 메뉴의 현재 화면만 선택합니다. 쿠키 클릭은 `GameScreen`, 전투 개체와 입력은 `BattleScreen`에만 존재하므로 두 플레이 방식이 섞이지 않습니다. 공통 상단 정보, 설정, 하단 메뉴는 `ScreenLayout`이 담당합니다.

## 데이터 기반 확장

게임 밸런스는 `src/config`의 JSON 파일에 있습니다.

- `difficulties.json`: 적 수, HP·공격 배율, 이동 속도, 적 원반 레벨, 회피 확률, 반응 속도, 최초 보상
- `enemy-discs.json`: 난이도별 적 원반 능력치
- `discs.json`: 플레이어 원반 구매·레벨 데이터
- `cookie-upgrades.json`: 클릭, 크기, 자동 생산, 쿠키 성 체력
- `monsters.json`, `bots.json`, `cookies.json`: 추가 가능한 개체 정의

새 항목은 UI 로직에 숫자를 하드코딩하지 않고 해당 파일의 데이터를 추가하는 방식으로 확장합니다. `src/config/index.ts`가 JSON을 TypeScript 타입으로 검증된 형태로 노출합니다.

## 상태와 저장

`GameContext`는 영구 상태와 사용자 명령을 제공하고, `gameReducer`가 모든 상태 변경 규칙을 처리합니다. AsyncStorage 저장은 `services/storage.ts`로 분리되어 있습니다.

전투 승리 시 `rewardClaimedDifficultyIds`를 확인하여 난이도마다 첫 승리일 때만 보상을 지급합니다. `clearedDifficultyIds`는 클리어 기록, `highestUnlockedDifficultyIndex`는 다음 난이도 해금에 각각 사용하므로 재도전과 보상 여부가 분리됩니다.

## 전투 엔진

`useBattleEngine`은 UI와 독립된 `advanceBattle` 함수로 전투를 진행합니다. 적 이동, 자동 공격, 원반 충돌, 회피, 적 원반, 쿠키 성 피해, 승패 판정을 한 단계씩 계산합니다. 난이도가 높아지면 설정 데이터에 따라 적 수와 적 원반 레벨이 오르고 회피 확률이 커지며 반응 시간이 짧아집니다.

플레이어 원반은 다음 두 조건을 모두 만족할 때만 발사됩니다.

1. 현재 화면에 플레이어 원반이 없음
2. 현재 원반 레벨의 재사용 대기시간이 지남

## 다음 확장 지점

- 몬스터: `MonsterConfig`에 행동 타입과 스프라이트 키 추가
- 쿠키봇: `bots.json`에 공격 타입과 상태 효과 추가
- 무기: 원반과 같은 레벨 테이블을 가진 새 무기 설정 추가
- 쿠키: `cookies.json`에 해금 조건과 능력 보정 추가
- 저장 이전: `saveVersion`별 변환 함수를 `services/storage.ts`에 추가
